export const LOG_PARAMS = Symbol.for('logger.params')

export function params(input: () => any[]) {
    return { [LOG_PARAMS]: input }
}
