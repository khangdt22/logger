import { format as formatDate, type FormatOptions } from 'date-fns/format'
import { type Color, dim as d } from 'colorette'
import type { Prettier } from '../types'
import { noop } from '../utils'

export interface TimestampPrettierOptions extends FormatOptions {
    dim?: boolean
    color?: Color
    format?: string
    brackets?: boolean
}

export const timestamp = (options: TimestampPrettierOptions = {}): Prettier => {
    const { format = 'HH:mm:ss.SSS', dim = true, color = noop, brackets = true } = options

    return (entry) => {
        const formatted = formatDate(entry.timestamp, format, options)
        const uncolorized = brackets ? `[${formatted}]` : formatted

        return (dim ? d : noop)(color(uncolorized))
    }
}
