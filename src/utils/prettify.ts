import { inspect } from 'node:util'
import { type FormatOptions, format } from '@khangdt22/utils/number'
import { type FormatOptions as FormatDateOptions, format as formatDate } from 'date-fns'
import { bold, dim, yellow } from 'colorette'

export interface PrettifyOptions {
    formatNumber?: boolean
    formatNumberOptions?: FormatOptions
    formatTime?: boolean
    formatTimeOptions?: FormatDateOptions & { format?: string; includeUnixTimestamp?: boolean }
}

export function prettify(input: unknown, options: PrettifyOptions = {}) {
    const { formatNumber = true, formatNumberOptions } = options
    const { formatTime = true, formatTimeOptions = {} } = options
    const { format: timeFormat = 'yyyy-MM-dd HH:mm:ss', includeUnixTimestamp = true } = formatTimeOptions

    let suffix = ''

    if (formatNumber && typeof input === 'number') {
        input = format(input, formatNumberOptions)
    }

    if (formatTime && input instanceof Date) {
        suffix = includeUnixTimestamp ? ` (${dim(input.getTime())})` : ''
        input = formatDate(input, timeFormat, formatTimeOptions)
    }

    return typeof input === 'string' ? (bold(yellow(input)) + suffix) : inspect(input)
}
