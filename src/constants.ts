import { red, yellow, cyan, green, white, gray } from 'colorette'

export const LOG_METADATA = Symbol.for('logger.metadata')

export const LOG_MESSAGE = Symbol.for('logger.message')

export const LOG_FORMATTED_MESSAGE = Symbol.for('logger.formatted-message')

export enum LogLevel {
    SILLY,
    TRACE,
    DEBUG,
    INFO,
    WARN,
    ERROR,
    FATAL,
}

export const LOG_LEVEL_NAMES = <const>{
    [LogLevel.SILLY]: 'silly',
    [LogLevel.TRACE]: 'trace',
    [LogLevel.DEBUG]: 'debug',
    [LogLevel.INFO]: 'info',
    [LogLevel.WARN]: 'warn',
    [LogLevel.ERROR]: 'error',
    [LogLevel.FATAL]: 'fatal',
}

export const LOG_COLORS = <const>{
    [LogLevel.SILLY]: gray,
    [LogLevel.TRACE]: white,
    [LogLevel.DEBUG]: green,
    [LogLevel.INFO]: cyan,
    [LogLevel.WARN]: yellow,
    [LogLevel.ERROR]: red,
    [LogLevel.FATAL]: red,
}
