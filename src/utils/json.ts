import { isErrorLike, serializeError } from 'serialize-error'
import mergeErrorCause from 'merge-error-cause'

export const stringify = (value: unknown): string => JSON.stringify(value, (_, value) => {
    if (isErrorLike(value)) {
        return serializeError(mergeErrorCause(value))
    }

    if (typeof value === 'bigint') {
        return value.toString()
    }

    return value
})
