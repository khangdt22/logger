import type { LogNameFilter } from '../types'

export interface DebugOptions {
    level?: number
    separator?: string
    envKey?: string
    defaultFilter?: string
}

export function parseFilter(filter: string) {
    const includes: RegExp[] = []
    const excludes: RegExp[] = []

    for (let item of filter.split(/[\s,]+/)) {
        if (!item) {
            continue
        }

        item = item.replaceAll('*', '.*?')

        if (item.startsWith('-')) {
            excludes.push(new RegExp(`^${item.slice(1)}$`))
        } else {
            includes.push(new RegExp(`^${item}$`))
        }
    }

    return { includes, excludes }
}

export function debug(options: DebugOptions = {}): LogNameFilter {
    const { level: enableLevel = 0, separator = ':', envKey = 'LOG_DEBUG', defaultFilter = '-*' } = options
    const filter = process.env[envKey] ?? defaultFilter
    const { includes, excludes } = parseFilter(filter)

    return (level, parentNames, name) => {
        if (level < enableLevel) {
            return false
        }

        if (filter === '*') {
            return true
        }

        const key = [...parentNames, name].join(separator)

        if (filter === '-*' || key.length === 0) {
            return false
        }

        if (excludes.some((i) => i.test(key))) {
            return false
        }

        return includes.some((i) => i.test(key))
    }
}
