import { isNullish } from '@khangdt22/utils/condition'
import isErrorInstance from 'is-error-instance'
import { BaseLogger } from './base-logger'
import { LogLevel, LOG_LEVEL_NAMES } from './constants'
import type { BaseLoggerOptions, ChildLoggerOptions } from './types'
import { gracefulExit, exit } from './utils'
import { UnhandledRejectionError } from './errors'
import { Transport } from './transports'

export type LogLevelType = LogLevel | (typeof LOG_LEVEL_NAMES[keyof typeof LOG_LEVEL_NAMES]) | number

type Options<T extends { level?: number }> = Omit<T, 'level'> & { level?: LogLevelType }

export type LoggerOptions = Omit<Options<BaseLoggerOptions>, 'transports'> & {
    transports?: Transport[]
    handleExceptions?: boolean
    handleRejections?: boolean
    handleExit?: boolean
}

type ChildLoggerOps = Omit<ChildLoggerOptions<LoggerOptions>, 'handleExceptions' | 'handleRejections' | 'handleExit'>

export function getLevel(level?: LogLevelType) {
    if (isNullish(level)) {
        return
    }

    if (typeof level === 'number') {
        return level
    }

    return LogLevel[level.toUpperCase() as keyof typeof LogLevel]
}

export class Logger extends BaseLogger {
    public constructor(options: LoggerOptions = {}) {
        const level = getLevel(options.level)
        const { handleExceptions = true, handleRejections = true, handleExit = true } = options

        super({ ...options, level })

        if (handleExceptions) {
            this.handleExceptions()
        }

        if (handleRejections) {
            this.handleRejections()
        }

        if (handleExit) {
            this.handleExit()
        }
    }

    public override setLevel(level: LogLevelType) {
        return super.setLevel(getLevel(level)!)
    }

    public override child(options?: ChildLoggerOps): this {
        return super.createChildLogger(this, <any>{
            ...options,
            level: getLevel(options?.level),
            handleExceptions: false,
            handleRejections: false,
            handleExit: false,
        })
    }

    public override createTimer(id?: string | true, level?: LogLevelType, ...args: unknown[]) {
        return super.createTimer(id, ...this.resolveArgs(level, ...args))
    }

    public override stopTimer(id: string, level?: LogLevelType, name?: string, ...args: unknown[]) {
        return super.stopTimer(id, ...this.resolveArgs(level, name, ...args))
    }

    public silly(...args: unknown[]) {
        return this.writeLog(LogLevel.SILLY, ...args)
    }

    public trace(...args: unknown[]) {
        return this.writeLog(LogLevel.TRACE, ...args)
    }

    public debug(...args: unknown[]) {
        return this.writeLog(LogLevel.DEBUG, ...args)
    }

    public info(...args: unknown[]) {
        return this.writeLog(LogLevel.INFO, ...args)
    }

    public warn(...args: unknown[]) {
        return this.writeLog(LogLevel.WARN, ...args)
    }

    public error(...args: unknown[]) {
        return this.writeLog(LogLevel.ERROR, ...args)
    }

    public fatal(...args: unknown[]) {
        return this.writeLog(LogLevel.FATAL, ...args)
    }

    public exit(exitCode = 0, level?: LogLevelType, ...args: unknown[]) {
        if (!isNullish(level)) {
            this.writeLog(level, ...args)
        }

        return gracefulExit(exitCode)
    }

    public forceExit(exitCode = 0, level?: LogLevelType, ...args: unknown[]) {
        if (!isNullish(level)) {
            this.writeLog(level, ...args)
        }

        return process.exit(exitCode)
    }

    public writeLog(level: LogLevelType, ...args: unknown[]) {
        return this.log(...this.resolveArgs(level, ...args))
    }

    protected resolveArgs(level?: LogLevelType, ...args: unknown[]): [any, any, any] {
        const levelNum = getLevel(level)

        if (!isNullish(levelNum)) {
            return [levelNum, LOG_LEVEL_NAMES[levelNum], ...args] as any
        }

        return [level, ...args] as any
    }

    protected handleExceptions() {
        process.on('uncaughtException', (error) => {
            this.fatal(error)
            gracefulExit(isErrorInstance(error) && error['exitCode'] ? error['exitCode'] : 1)
        })
    }

    protected handleRejections() {
        process.on('unhandledRejection', (reason, promise) => {
            throw new UnhandledRejectionError(promise, undefined, { cause: reason })
        })
    }

    protected handleExit() {
        process.on('SIGTERM', () => exit(this))
        process.on('SIGINT', () => exit(this))
    }
}
