import { type Color, bold } from 'colorette'
import type { Prettier } from '../types'
import { noop } from '../utils'
import { Logger } from '../../../logger'
import { LOG_COLORS } from '../../../constants'

export interface LevelPrettierOptions {
    colors?: Record<number, Color>
    highlight?: boolean
    longestLevelName?: number
}

export const level = (options: LevelPrettierOptions = {}): Prettier => {
    const { highlight = true } = options

    return (entry, logger) => {
        let longestLevelName = options.longestLevelName
        let color = options.colors?.[entry.level]

        if (logger instanceof Logger) {
            longestLevelName ??= 5
            color ??= LOG_COLORS[entry.level]
        }

        const uncolorized = entry.levelName.toUpperCase().padEnd(longestLevelName ?? 0)
        const colorizer = color ?? noop

        return (highlight ? bold : noop)(colorizer(uncolorized))
    }
}
