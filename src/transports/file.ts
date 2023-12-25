import { type LogRotatorOptions, LogRotator } from '../utils'
import { Transport } from './transport'
import type { TransportOptions } from './types'

export type FileTransportOptions = LogRotatorOptions & TransportOptions

export class FileTransport extends Transport {
    protected readonly rotator: LogRotator

    public constructor(outputDirectory: string, options: FileTransportOptions) {
        super('logger.transports.file', options)

        this.rotator = new LogRotator(outputDirectory, options)
    }

    protected async log(message: string) {
        return this.rotator.write(message + '\n')
    }
}
