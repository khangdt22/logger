import { filter, map } from '@khangdt22/utils/object'
import type { LogFormatter } from '../../types'
import { LOG_FORMATTED_MESSAGE } from '../../constants'
import type { Prettier } from './types'
import { timestamp, level, name, message, timer, params, error, type TimestampPrettierOptions, type LevelPrettierOptions, type NamePrettierOptions, type MessagePrettierOptions, type TimerPrettierOptions, type ErrorPrettierOptions, type ParamsPrettierOptions } from './prettiers'

export interface PrettyOptions {
    format?: string
    prettierOptions?: {
        timestamp?: TimestampPrettierOptions
        level?: LevelPrettierOptions
        name?: NamePrettierOptions
        message?: MessagePrettierOptions
        timer?: TimerPrettierOptions
        error?: ErrorPrettierOptions
        params?: ParamsPrettierOptions
    }
    prettiers?: {
        timestamp?: Prettier
        level?: Prettier
        name?: Prettier
        message?: Prettier
        timer?: Prettier
        error?: Prettier
        params?: Prettier
    }
}

export function pretty(options: PrettyOptions = {}): LogFormatter {
    const showName = Boolean(process.env.LOG_SHOW_NAME ?? false)
    const { format = `{timestamp} {level}${showName ? '{name}' : ''}{message}{timer}{error}{params}` } = options
    const { prettierOptions = {} } = options

    const prettiers = {
        timestamp: () => options.prettiers?.timestamp ?? timestamp(prettierOptions.timestamp),
        level: () => options.prettiers?.level ?? level(prettierOptions.level),
        name: () => options.prettiers?.name ?? name(prettierOptions.name),
        message: () => options.prettiers?.message ?? message(prettierOptions.message),
        timer: () => options.prettiers?.timer ?? timer(prettierOptions.timer),
        error: () => options.prettiers?.error ?? error(prettierOptions.error),
        params: () => options.prettiers?.params ?? params(prettierOptions.params),
    }

    const allowedPrettiers = map(filter(prettiers, (key) => format.includes(key)), (key, value) => {
        return [key, value()]
    })

    return (entry, logger) => {
        let message = format

        for (const [key, fmt] of Object.entries(allowedPrettiers)) {
            message = message.replaceAll(`{${key}}`, fmt(entry, logger))
        }

        return { ...entry, [LOG_FORMATTED_MESSAGE]: message }
    }
}
