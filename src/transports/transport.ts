import { notNullish } from '@khangdt22/utils/condition'
import { createDeferred, type Awaitable } from '@khangdt22/utils/promise'
import { TypedEventEmitter } from '@khangdt22/utils/event'
import type { AnyObject } from '@khangdt22/utils/object'
import PQueue from 'p-queue'
import type { LogFormatter, LogEntry } from '../types'
import type { BaseLogger } from '../base-logger'
import { LOG_FORMATTED_MESSAGE } from '../constants'
import { toJson } from '../formatters'
import { addExitHandler } from '../utils'
import { TransportError } from '../errors'
import type { TransportOptions } from './types'

export abstract class Transport<E extends AnyObject = AnyObject> extends TypedEventEmitter<E> {
    public readonly name: string
    public readonly silent: boolean
    public readonly level?: number
    public readonly formatters: LogFormatter[]
    public readonly writeType: 'sync' | 'async' = 'async'

    protected readonly queue: PQueue

    protected constructor(name: string, options: TransportOptions) {
        super()

        const { silent = false, level, formatters = [] } = options

        this.silent = silent
        this.name = name
        this.level = level
        this.formatters = formatters
        this.queue = new PQueue({ concurrency: 1 })
    }

    public isTransportAllowed({ excludeTransports, level }: LogEntry) {
        if (this.silent || excludeTransports.includes(this.name)) {
            return false
        }

        return notNullish(this.level) ? level >= this.level : true
    }

    public write(entry: LogEntry, logger: BaseLogger) {
        const message = this.getLogMessage(entry, logger)

        try {
            this.log(message, entry, logger)
        } catch (error) {
            this.onError(error)
        }
    }

    public async writeAsync(entry: LogEntry, logger: BaseLogger) {
        const isLogged = createDeferred<void>()
        const clean = addExitHandler(() => isLogged)
        const message = this.getLogMessage(entry, logger)

        return this.queue.add(() => this.log(message, entry, logger)).catch(this.onError.bind(this)).finally(() => {
            isLogged.resolve()
            clean()
        })
    }

    protected abstract log(message: string, entry: LogEntry, logger: BaseLogger): Awaitable<void>

    protected getLogMessage(entry: LogEntry, logger: BaseLogger) {
        const newEntry = { ...entry }
        const formattedEntry = this.formatters.reduce((entry, fmt) => fmt(entry, logger), newEntry)

        return formattedEntry[LOG_FORMATTED_MESSAGE] ?? toJson(formattedEntry)
    }

    protected onError(error: unknown) {
        throw new TransportError(this, undefined, { cause: error })
    }
}
