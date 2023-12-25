import type { LogFormatter } from '../types'

export interface TransportOptions {
    silent?: boolean
    level?: number
    formatters?: LogFormatter[]
}
