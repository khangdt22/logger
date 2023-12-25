import { createDeferred } from '@khangdt22/utils/promise'
import type { LogEntry } from '../types'
import { Transport } from './transport'
import type { TransportOptions } from './types'

export interface ConsoleTransportOptions extends TransportOptions {
    stderrLevels?: number[]
}

export class ConsoleTransport extends Transport {
    protected readonly stderrLevels: number[]

    public constructor(options: ConsoleTransportOptions = {}) {
        super('logger.transports.console', options)

        this.stderrLevels = options.stderrLevels ?? []
    }

    protected async log(message: string, entry: LogEntry) {
        const isWrote = createDeferred<void>()
        const stream = this.stderrLevels.includes(entry.level) ? process.stderr : process.stdout

        stream.write(message + '\n', 'utf8', (error) => {
            if (error) {
                isWrote.reject(error)
            } else {
                isWrote.resolve()
            }
        })

        return isWrote
    }
}
