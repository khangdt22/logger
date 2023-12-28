import { TypedEventEmitter } from '@khangdt22/utils/event'
import { isString } from '@khangdt22/utils/string'
import { isObject } from '@khangdt22/utils/object'
import { isNullish } from '@khangdt22/utils/condition'
import { isFunction } from '@khangdt22/utils/function'
import type { BaseLoggerOptions, LogEntry, LogFilter, LogFormatter, LoggerEvents, LogMetadata, ChildLoggerOptions, LogNameFilter } from './types'
import { LOG_METADATA, LOG_MESSAGE } from './constants'
import { LOG_PARAMS } from './utils'
import { Transport } from './transports'

export class BaseLogger extends TypedEventEmitter<LoggerEvents> {
    public level: number
    public silent: boolean

    public readonly name?: string
    public readonly parentNames: string[]

    public readonly filters: LogFilter[]
    public readonly formatters: LogFormatter[]
    public readonly syncTransports: Transport[]
    public readonly asyncTransports: Transport[]

    protected readonly nameFilter: LogNameFilter
    protected readonly timers: Record<string, bigint> = {}

    protected timerId = 0

    public constructor(protected readonly options: BaseLoggerOptions = {}) {
        super()

        const { level = Number.NEGATIVE_INFINITY, silent = false, name, parentNames = [], nameFilter } = options
        const { filters = [], formatters = [], transports = [] } = options
        const { syncTransports, asyncTransports } = this.getTransports(transports)

        this.level = level
        this.silent = silent
        this.name = name
        this.parentNames = parentNames
        this.filters = filters
        this.formatters = formatters
        this.syncTransports = syncTransports
        this.asyncTransports = asyncTransports
        this.nameFilter = nameFilter ?? (() => true)
    }

    public enable() {
        this.silent = false
    }

    public disable() {
        this.silent = true
    }

    public setLevel(level: number) {
        this.level = level
    }

    public addFilter(filter: LogFilter) {
        this.filters.push(filter)
    }

    public addFormatter(formatter: LogFormatter) {
        this.formatters.push(formatter)
    }

    public addTransport(transport: Transport) {
        const { syncTransports, asyncTransports } = this.getTransports([transport])

        this.syncTransports.push(...syncTransports)
        this.asyncTransports.push(...asyncTransports)
    }

    public child(options: ChildLoggerOptions = {}): this {
        return this.createChildLogger(this, options)
    }

    public createTimer(id?: string | true, level?: number, name?: string, ...args: unknown[]) {
        if (id === true || id === undefined) {
            id = `timer-${++this.timerId}`
        }

        if (!isNullish(level) && name) {
            this.log(level, name, ...args, { [LOG_METADATA]: true, timer: id })
        }

        this.timers[id] = process.hrtime.bigint()

        return id
    }

    public getTimerResult(id: string) {
        return this.timers[id] ? process.hrtime.bigint() - this.timers[id] : undefined
    }

    public stopTimer(id: string, level?: number, name?: string, ...args: unknown[]) {
        const timerResult = this.getTimerResult(id)

        if (!isNullish(level) && name) {
            this.log(level, name, ...args, { [LOG_METADATA]: true, timer: id, timerResult })
        }

        delete this.timers[id]
    }

    public log(level: number, name: string, ...args: unknown[]) {
        if (!this.isLoggable(level)) {
            return
        }

        const entry = this.formatters.reduce((entry, fmt) => fmt(entry, this), this.toLogEntry(level, name, ...args))

        if (this.filters.some((filter) => !filter(entry, this))) {
            return
        }

        this.writeToAllAsyncTransports(entry).catch((error) => {
            throw error
        })

        for (const transport of this.syncTransports) {
            this.writeToTransport(transport, entry)
        }
    }

    protected writeToTransport(transport: Transport, entry: LogEntry) {
        if (!transport.isTransportAllowed(entry)) {
            return
        }

        return transport.write(entry, this)
    }

    protected async writeToAllAsyncTransports(entry: LogEntry) {
        return Promise.all(this.asyncTransports.map(async (i) => this.writeToAsyncTransport(i, entry)))
    }

    protected async writeToAsyncTransport(transport: Transport, entry: LogEntry) {
        if (!transport.isTransportAllowed(entry)) {
            return
        }

        return transport.writeAsync(entry, this).catch((error) => this.onTransportError(transport, error, entry))
    }

    protected createChildLogger<T extends BaseLogger>(instance: T, options: ChildLoggerOptions = {}) {
        const { name, parentNames = [], forwardEvents = true, ...rest } = { ...this.options, ...options }
        const { level = this.level, silent = this.silent } = rest
        const { filters = this.filters, formatters = this.formatters } = rest
        const { transports = [...this.syncTransports, ...this.asyncTransports] } = rest

        const child = new (instance.constructor as typeof BaseLogger)({
            ...rest,
            level,
            silent,
            name,
            filters,
            formatters,
            transports,
            parentNames: [...this.parentNames, ...(this.name ? [this.name] : []), ...parentNames],
        })

        if (forwardEvents) {
            child.on('log-error', (entry, error, transport, logger) => this.emit('log-error', entry, error, transport, logger))
        }

        return child as T
    }

    protected toLogEntry(level: number, levelName: string, ...args: unknown[]) {
        const entry: LogEntry = { level, levelName, timestamp: Date.now(), excludeTransports: [], params: [] }

        if (isString(args[0])) {
            entry.message = args.shift() as string
            entry[LOG_MESSAGE] = entry.message
        }

        if (isFunction(args[0]?.[LOG_PARAMS])) {
            args.unshift(...args.shift()![LOG_PARAMS]())
        }

        for (const arg of args) {
            if (this.isLogMetadata(arg)) {
                if (arg.excludeTransports) {
                    entry.excludeTransports.push(...arg.excludeTransports)
                }

                Object.assign(entry.metadata ??= { [LOG_METADATA]: true }, arg)
            } else {
                entry.params.push(arg)
            }
        }

        return entry
    }

    protected isLoggable(level: number) {
        return !this.silent && (level >= this.level || this.nameFilter(level, this.parentNames, this.name))
    }

    protected isLogMetadata(input: unknown): input is LogMetadata {
        return isObject(input) && input[LOG_METADATA] === true
    }

    protected onTransportError(transport: Transport, error: any, entry: LogEntry) {
        this.emit('log-error', error, entry, transport, this)
    }

    protected getTransports(transports: Transport[]) {
        const syncTransports: Transport[] = []
        const asyncTransports: Transport[] = []

        for (const transport of transports) {
            (transport.writeType === 'sync' ? syncTransports : asyncTransports).push(transport)
        }

        return { syncTransports, asyncTransports }
    }
}
