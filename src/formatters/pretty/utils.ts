import { ltrim } from '@khangdt22/utils/string'

export const noop = (text: string) => text

export function indent(input: string, size = 2, trim = false) {
    return input.split('\n').map((i) => ' '.repeat(size) + (trim ? ltrim(i) : i)).join('\n')
}
