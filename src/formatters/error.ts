import isErrorInstance from 'is-error-instance'
import mergeError from 'merge-error-cause'
import type { LogFormatter } from '../types'

export const error = (): LogFormatter => (entry) => {
    const params: unknown[] = []
    const errors: Error[] = []

    for (const item of entry.params) {
        if (isErrorInstance(item)) {
            errors.push(mergeError(item))
        } else {
            params.push(item)
        }
    }

    entry.params = params
    entry.errors ??= []
    entry.errors.push(...errors)

    return entry
}
