import type { Logger } from '../logger'

export type ExitHandler = (exitCode?: number) => Promise<void>

const exitTasks = new Set<[handler: ExitHandler, maxWaitTime: number]>()

export function addExitHandler(handler: ExitHandler, maxWaitTime = 3000) {
    exitTasks.add([handler, maxWaitTime])

    return () => {
        exitTasks.delete([handler, maxWaitTime])
    }
}

let _isExiting = false
let ctrlCCount = 0

export function isExiting() {
    return _isExiting
}

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

export function gracefulExit(exitCode = 0, maxWaitTime = 3000) {
    if (isExiting()) {
        return
    }

    _isExiting = true

    function done() {
        _isExiting = false
        process.exit(exitCode)
    }

    if (exitTasks.size === 0) {
        return done()
    }

    const promises: Array<Promise<void>> = []

    for (const [handler, wait] of exitTasks) {
        promises.push(handler(exitCode))
        maxWaitTime = Math.max(maxWaitTime, wait)
    }

    const timeout = setTimeout(done, maxWaitTime)

    Promise.all(promises).finally(() => {
        clearTimeout(timeout)
        done()
    })
}
