import { inspect, type InspectOptions } from 'node:util'
import type { Prettier } from '../types'
import { indent } from '../utils'

export type ParamsPrettierOptions = InspectOptions & {
    indent?: number
}

export const resolveInspectOptions = (options: InspectOptions = {}): InspectOptions => {
    const { depth = Number.POSITIVE_INFINITY, colors = true, breakLength } = options
    const { maxArrayLength = Number.POSITIVE_INFINITY, maxStringLength = Number.POSITIVE_INFINITY } = options

    return {
        depth,
        colors,
        maxArrayLength,
        maxStringLength,
        breakLength: breakLength ?? Math.max(80, process.stdout.columns),
        ...options,
    }
}

export function formatParams(params: unknown[], options: ParamsPrettierOptions = {}) {
    return indent(inspect(params, resolveInspectOptions(options)), options.indent)
}

export const params = (options: ParamsPrettierOptions = {}): Prettier => {
    return (entry) => (entry.params.length > 0 ? '\n' + formatParams(entry.params, options) : '')
}
