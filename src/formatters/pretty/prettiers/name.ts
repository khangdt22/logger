import { magenta, dim as d, type Color } from 'colorette'
import type { Prettier } from '../types'
import { noop } from '../utils'

export interface NamePrettierOptions {
    dim?: boolean
    separator?: string
    color?: Color
}

export const name = (options: NamePrettierOptions = {}): Prettier => {
    const { separator = ':', dim = true, color = magenta } = options

    return (_, logger) => {
        const uncolorized = [...logger.parentNames, logger.name].join(separator)

        return uncolorized.length > 0 ? (dim ? d : noop)(color(' ' + uncolorized)) : ''
    }
}
