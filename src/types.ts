import type { BaseLogger } from './base-logger'
import type { LOG_METADATA, LOG_MESSAGE } from './constants'
import type { Transport } from './transports'

export interface BaseLoggerOptions {
    level?: number
    silent?: boolean
    name?: string
    parentNames?: string[]
    formatters?: LogFormatter[]
    filters?: LogFilter[]
    transports?: Transport[]
    nameFilter?: LogNameFilter
}

export type ChildLoggerOptions<B = BaseLoggerOptions> = B & {
    forwardEvents?: boolean
}

export type LoggerEvents = {
    'log-error': (error: any, entry: LogEntry, transport: Transport, logger: BaseLogger) => void
}

export interface LogMetadata {
    [LOG_METADATA]: true

    excludeTransports?: string[]
    timer?: string
    timerResult?: bigint

    [key: PropertyKey]: unknown
}

export interface LogEntry {
    level: number
    levelName: string
    timestamp: number
    message?: string
    excludeTransports: string[]
    params: unknown[]
    metadata?: LogMetadata
    errors?: Error[]

    [LOG_MESSAGE]?: string
}

export type LogFormatter = (entry: LogEntry, logger: BaseLogger) => LogEntry

export type LogFilter = (entry: LogEntry, logger: BaseLogger) => boolean

export type LogNameFilter = (level: number, parentNames: string[], name?: string) => boolean
