import type { LogFormatter } from '../types'
import { LOG_FORMATTED_MESSAGE } from '../constants'

export function stripColor(input: string) {
    // eslint-disable-next-line no-control-regex
    return ('' + input).replaceAll(/\u001B\[\d+m/g, '')
}

export const uncolorize = (): LogFormatter => (entry) => {
    entry[LOG_FORMATTED_MESSAGE] = stripColor(entry[LOG_FORMATTED_MESSAGE])

    if (entry.message) {
        entry.message = stripColor(entry.message)
    }

    return entry
}
