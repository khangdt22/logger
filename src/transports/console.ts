import type { LogEntry } from '../types'
import { Transport } from './transport'
import type { TransportOptions } from './types'

export interface ConsoleTransportOptions extends TransportOptions {
    stderrLevels?: number[]
}

export class ConsoleTransport extends Transport {
    public override readonly writeType = 'sync'

    protected readonly stderrLevels: number[]

    public constructor(options: ConsoleTransportOptions = {}) {
        super('logger.transports.console', options)

        this.stderrLevels = options.stderrLevels ?? []
    }

    protected log(message: string, entry: LogEntry) {
        this.getStream(entry).write(message + '\n', 'utf8')
    }

    protected getStream(entry: LogEntry) {
        return this.stderrLevels.includes(entry.level) ? process.stderr : process.stdout
    }
}
