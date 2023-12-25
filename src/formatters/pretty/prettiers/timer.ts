import { type Color, magenta, dim as d } from 'colorette'
import { isNullish } from '@khangdt22/utils/condition'
import prettyMilliseconds, { type Options } from 'pretty-ms'
import { format } from '@khangdt22/utils/number'
import type { Prettier } from '../types'
import { noop } from '../utils'

export interface TimerPrettierOptions {
    dim?: boolean
    humanize?: boolean
    color?: Color
    formatOptions?: Options
}

export function toMilliseconds(input: bigint) {
    const ns = input.toString()
    const intPart = ns.slice(0, -6) || '0'
    const decimalPart = ns.slice(-6).padStart(6, '0')

    return Number(`${intPart}.${decimalPart}`)
}

export const timer = (options: TimerPrettierOptions = {}): Prettier => {
    const { dim = true, humanize = true, color = magenta, formatOptions = {} } = options
    const { formatSubMilliseconds = true, ...rest } = formatOptions

    const humanizer = (input: bigint) => {
        if (!humanize) {
            return `${format(input)}ns`
        }

        return prettyMilliseconds(toMilliseconds(input), { formatSubMilliseconds, ...rest })
    }

    return (entry) => {
        if (isNullish(entry.metadata?.timerResult)) {
            return ''
        }

        const uncolorized = humanizer(entry.metadata.timerResult)

        return (dim ? d : noop)(color('  ' + uncolorized))
    }
}
