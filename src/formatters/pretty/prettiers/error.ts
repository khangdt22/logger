import mergeError from 'merge-error-cause'
import clean from 'clean-stack'
import { type Color, dim, whiteBright, bgRed } from 'colorette'
import { isNullish } from '@khangdt22/utils/condition'
import isErrorInstance from 'is-error-instance'
import type { Prettier } from '../types'
import { noop, indent as indentStr } from '../utils'
import type { LogEntry } from '../../../types'
import { formatParams, type ParamsPrettierOptions } from './params'

export interface FormatErrorTypeOptions {
    messageColor?: Color
    bgColor?: Color
    padding?: { left?: number; right?: number }
    badge?: boolean
}

export interface FormatErrorOptions extends FormatErrorTypeOptions {
    mergeErrorCause?: boolean
    cleanStack?: boolean
    dimStack?: boolean
    stackColor?: Color
    ignorePayload?: string[]
    mergeIgnorePayload?: boolean
    indent?: number
    formatPayloadOptions?: ParamsPrettierOptions
}

export type ErrorPrettierOptions = FormatErrorOptions

export function formatErrorType(errType: string, options: FormatErrorTypeOptions = {}) {
    const { messageColor = whiteBright, bgColor = bgRed, padding = {}, badge = true } = options
    const { left = 1, right = 1 } = padding

    if (!badge) {
        return messageColor(`[${errType}]`)
    }

    return bgColor(messageColor(' '.repeat(left) + errType + ' '.repeat(right)))
}

export function formatError(error: Error, options: FormatErrorOptions = {}) {
    const { mergeErrorCause = true, cleanStack = true, dimStack = true, stackColor = noop, indent = 2 } = options
    const { messageColor = whiteBright } = options
    const err = mergeErrorCause ? mergeError(error) : error
    const defaultIgnorePayload = ['code', 'exitCode', 'name', 'message', 'stack', 'cause']

    let { ignorePayload, mergeIgnorePayload = true } = options

    if (isNullish(ignorePayload)) {
        ignorePayload = defaultIgnorePayload
        mergeIgnorePayload = false
    }

    if (mergeIgnorePayload) {
        ignorePayload.push(...defaultIgnorePayload)
    }

    err.stack = (err.stack ?? '').replace(err.message, '')
    err.stack = cleanStack ? clean(err.stack) : err.stack

    const errType = formatErrorType(err.name + (err['code'] ? ` (${err['code']})` : ''), { ...options, messageColor })
    const errPayload = Object.keys(err).filter((k) => !ignorePayload!.includes(k)).map((k) => [k, err[k]])

    const errStack = err.stack.split('\n').slice(1).map((i) => {
        return (dimStack ? dim : noop)(stackColor(indentStr(i, indent, true)))
    })

    let payloadMsg = ''

    if (errPayload.length > 0) {
        payloadMsg = `\n${formatParams(Object.fromEntries(errPayload), { ...options.formatPayloadOptions, indent })}`
    }

    let subErr: string | undefined

    if (err instanceof AggregateError) {
        subErr = indentStr(err.errors.map((e) => formatError(e, { ...options, badge: true })).join('\n'), indent)
    }

    return `${errType} ${messageColor(err.message)}\n${errStack.join('\n')}${payloadMsg}` + (subErr ? `\n${subErr}` : '')
}

export function containsOnlyErrors(entry: LogEntry) {
    if (entry.message) {
        return false
    }

    return entry.params.every((param) => isErrorInstance(param))
}

export const error = (options: ErrorPrettierOptions = {}): Prettier => (entry) => {
    if (!entry.errors?.length) {
        return ''
    }

    const errors: Error[] = entry.errors ?? []
    const isContainsOnlyErrors = containsOnlyErrors(entry)

    for (const error of entry.params) {
        if (isErrorInstance(error)) {
            errors.push(error as Error)
        }
    }

    const message: string[] = []

    for (const [i, error] of errors.entries()) {
        message.push(formatError(error, { ...options, badge: options.badge ?? !(i === 0 && isContainsOnlyErrors) }))
    }

    return (isContainsOnlyErrors ? ' ' : '\n') + message.join('\n')
}
