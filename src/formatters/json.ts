import { omit, filterByValue } from '@khangdt22/utils/object'
import { notNullish } from '@khangdt22/utils/condition'
import type { LogFormatter, LogEntry } from '../types'
import { stringify } from '../utils'
import { LOG_FORMATTED_MESSAGE } from '../constants'

export function toJson(entry: LogEntry) {
    return stringify(filterByValue(omit({ ...entry }, 'excludeTransports'), notNullish))
}

export const json = (): LogFormatter => (entry) => {
    return { ...entry, [LOG_FORMATTED_MESSAGE]: toJson(entry) }
}
