import { formatWithOptions, type InspectOptions } from 'node:util'
import type { LogFormatter } from '../types'

export const LOG_INTERPOLATION = Symbol.for('logger.interpolation')

export type InterpolationOptions = InspectOptions

export function countSpecifiers(input: string) {
    return (input.match(/%[Ocdfijos]/g) ?? []).length
}

export const interpolation = (options: InterpolationOptions = {}): LogFormatter => (entry) => {
    let specifiers = 0

    if (entry.message && (specifiers = countSpecifiers(entry.message)) > 0) {
        const meta = entry.metadata?.[LOG_INTERPOLATION] as unknown[] | undefined
        const params = meta ?? (entry.params.length > 0 ? entry.params.splice(0, specifiers) : [])

        if (params.length > 0) {
            entry.message = formatWithOptions(options, entry.message, ...params)
        }
    }

    return entry
}
