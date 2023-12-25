import { type Color, whiteBright } from 'colorette'
import { isNullish } from '@khangdt22/utils/condition'
import type { Prettier } from '../types'

export interface MessagePrettierOptions {
    color?: Color
}

export const message = (options: MessagePrettierOptions = {}): Prettier => {
    const { color = whiteBright } = options

    return (entry) => {
        if (isNullish(entry.message)) {
            return ''
        }

        return ' ' + color(entry.message)
    }
}
