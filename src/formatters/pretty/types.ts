import type { LogEntry } from '../../types'
import type { BaseLogger } from '../../base-logger'

export type Prettier = (entry: LogEntry, logger: BaseLogger) => string
