import { gracefulExit, isExiting } from '@khangdt22/utils/process'
import type { Logger } from '../logger'

export type { ExitHandler } from '@khangdt22/utils/process'

export { addExitHandler, isExiting, gracefulExit } from '@khangdt22/utils/process'

let ctrlCCount = 0

export function exit(logger: Logger, exitCode?: number, maxWaitTime?: number) {
    ctrlCCount++

    if (ctrlCCount > 2) {
        process.exit()
    }

    if (isExiting()) {
        return logger.warn('Application is currently shutting down, to force exit press Ctrl+C again')
    }

    process.stdout.write('\n')
    logger.info('Shutting down...')

    return gracefulExit(exitCode, maxWaitTime)
}
