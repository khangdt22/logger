import type { AnyObject } from '@khangdt22/utils/object'
import type { LogMetadata as BaseLogMetadata } from '../types'
import { LOG_METADATA } from '../constants'

export const LOG_PARAMS = Symbol.for('logger.params')

export function params(input: () => any[]) {
    return { [LOG_PARAMS]: input }
}

type LogMetadata<T extends AnyObject = AnyObject> = Omit<BaseLogMetadata, typeof LOG_METADATA> & T

export function metadata<T extends AnyObject>(input: LogMetadata<T>) {
    return { [LOG_METADATA]: true, ...input }
}
