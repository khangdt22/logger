import { Logger, type LoggerOptions, getLevel, type LogLevelType } from './logger'
import { interpolation, error, type InterpolationOptions, pretty, type PrettyOptions, json, uncolorize } from './formatters'
import { debug, type DebugOptions } from './utils'
import { LogLevel, LOG_LEVEL_NAMES, LOG_METADATA } from './constants'
import { ConsoleTransport, type ConsoleTransportOptions, type FileTransportOptions, FileTransport } from './transports'
import { type TelegramTransportOptions, TelegramTransport } from './transports/telegram'

export interface FormatterOptions {
    interpolation?: InterpolationOptions
    debug?: DebugOptions
    pretty?: PrettyOptions
}

interface TransportOptions {
    console?: ConsoleTransportOptions
    file?: FileTransportOptions & { output: string }
    telegram?: TelegramTransportOptions
}

export interface DefaultLoggerOptions extends LoggerOptions {
    formatterOptions?: FormatterOptions
    transportOptions?: TransportOptions
}

function createFileTransport(options: Required<TransportOptions>['file']) {
    return new FileTransport(options.output, { level: LogLevel.WARN, formatters: [uncolorize(), json()], ...options })
}

function createTelegramTransport(options: Required<TransportOptions>['telegram']) {
    return new TelegramTransport({ level: LogLevel.ERROR, formatters: [uncolorize()], ...options })
}

export function createDefaultLogger(options: DefaultLoggerOptions = {}) {
    const { formatterOptions = {}, transportOptions = {}, level = LogLevel.INFO } = options
    const debugLevel = getLevel(process.env.LOG_DEBUG_LEVEL as LogLevelType) ?? LogLevel.DEBUG

    const logger = new Logger({
        level,
        formatters: [interpolation(formatterOptions.interpolation), error()],
        transports: [
            new ConsoleTransport({
                stderrLevels: [LogLevel.ERROR, LogLevel.FATAL],
                formatters: [pretty(formatterOptions.pretty)],
                ...transportOptions.console,
            }),
            ...(transportOptions.file ? [createFileTransport(transportOptions.file)] : []),
            ...(transportOptions.telegram ? [createTelegramTransport(transportOptions.telegram)] : []),
        ],
        nameFilter: debug({ level: debugLevel, ...formatterOptions.debug }),
        ...options,
    })

    logger.on('log-error', (error, _, transport, logger) => {
        logger.log(LogLevel.FATAL, LOG_LEVEL_NAMES[LogLevel.FATAL], error, {
            [LOG_METADATA]: true,
            excludeTransports: [transport.name],
        })
    })

    return logger
}
