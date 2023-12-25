import { inspect, type InspectOptions } from 'node:util'
import { bold, pre, join, FmtString, fmt } from 'telegraf/format'
import { format } from 'date-fns'
import isErrorInstance from 'is-error-instance'
import { serializeError } from 'serialize-error'
import { ltrim, chunk } from '@khangdt22/utils/string'
import { last } from '@khangdt22/utils/array'
import Bottleneck from 'bottleneck'
import { Telegraf } from 'telegraf'
import mergeErrorCause from 'merge-error-cause'
import type { LogEntry } from '../types'
import type { BaseLogger } from '../base-logger'
import { resolveInspectOptions } from '../formatters/pretty/prettiers'
import { indent } from '../formatters/pretty/utils'
import { Transport } from './transport'
import type { TransportOptions } from './types'

export interface TelegramSendMessageOptions {
    disableWebPagePreview?: boolean
    allowSendingWithoutReply?: boolean
    messageThreadId?: number
    replyToMessageId?: number
    disableNotification?: boolean
}

export interface TelegramTransportOptions extends TransportOptions {
    botToken: string
    chatId: string | number
    dateFormat?: string
    nameSeparator?: string
    inspectOptions?: Omit<InspectOptions, 'colors'>
    sendOptions?: TelegramSendMessageOptions
}

export const TELEGRAM_MAX_MESSAGE_LENGTH = 4096

export const TELEGRAM_MAX_MESSAGES_PER_SECOND = 30

export const TELEGRAM_MAX_MESSAGES_PER_MINUTE_PER_CHAT = 20

export class TelegramTransport extends Transport {
    protected readonly chatId: string | number
    protected readonly dateFormat: string
    protected readonly nameSeparator: string
    protected readonly inspectOptions: InspectOptions
    protected readonly limiter: Bottleneck
    protected readonly sender: Telegraf

    public constructor(protected readonly options: TelegramTransportOptions) {
        super('logger.transports.telegram', options)

        this.dateFormat = options.dateFormat ?? 'yyyy-MM-dd HH:mm:ss.SSS'
        this.nameSeparator = options.nameSeparator ?? ':'
        this.inspectOptions = resolveInspectOptions(options.inspectOptions ?? {})
        this.limiter = this.createLimiter()
        this.sender = new Telegraf(options.botToken)
        this.chatId = options.chatId
    }

    protected async log(_: string, entry: LogEntry, logger: BaseLogger) {
        const messages = this.chunkMessage(this.getMessage(entry, logger))

        for (const message of messages) {
            await this.limiter.schedule(async () => this.sendMessage(message))
        }
    }

    protected async sendMessage(message: FmtString): Promise<void> {
        const options = this.options.sendOptions ?? {}
        const { disableWebPagePreview = true, allowSendingWithoutReply, messageThreadId, replyToMessageId } = options
        const { disableNotification } = options

        await this.sender.telegram.sendMessage(this.chatId, message, {
            disable_web_page_preview: disableWebPagePreview,
            allow_sending_without_reply: allowSendingWithoutReply,
            message_thread_id: messageThreadId,
            reply_to_message_id: replyToMessageId,
            disable_notification: disableNotification,
        })
    }

    protected chunkMessage(message: FmtString) {
        if (!message.entities) {
            return [message]
        }

        const messages: FmtString[] = []
        const overflow = message.entities.findIndex((e) => e.offset + e.length > TELEGRAM_MAX_MESSAGE_LENGTH)

        if (overflow === -1) {
            return [message]
        }

        const offset = message.entities[overflow].offset
        const entities = message.entities.splice(0, overflow)
        const newEntities = message.entities.map((e) => ({ ...e, offset: e.offset - offset }))

        messages.push(new FmtString(message.text.slice(0, offset), entities))
        messages.push(...this.chunkMessage(new FmtString(message.text.slice(offset), newEntities)))

        return messages
    }

    protected getMessage(entry: LogEntry, logger: BaseLogger) {
        const name = [...logger.parentNames, logger.name].join(this.nameSeparator)

        const message = [
            this.formatMessage('• Level: ', entry.levelName),
            this.formatMessage('• Time: ', format(entry.timestamp, this.dateFormat)),
        ]

        if (name.length > 0) {
            message.push(this.formatMessage('• Name: ', name))
        }

        if (entry.message?.length) {
            message.push(this.formatMessage('• Message: ', entry.message))
        }

        if (entry.params.length > 0) {
            const params: string[] = []

            for (const param of entry.params) {
                params.push(this.formatParam(param))
            }

            message.push(this.formatMessage('• Params:\n', JSON.stringify(params, null, 2), pre('json')))
        }

        if (entry.errors?.length) {
            for (const error of entry.errors) {
                message.push(this.formatMessage('• Error:\n', this.formatError(error), pre('json')))
            }
        }

        return join(message, '\n')
    }

    protected formatMessage(key: string, message: string, formatter: (message: string) => FmtString = bold) {
        const length = key.length + message.length
        const limit = TELEGRAM_MAX_MESSAGE_LENGTH

        if (length > limit) {
            return fmt(key, join(chunk(message, limit - key.length).map((m) => this.formatMessage('', m, formatter))))
        }

        return fmt(key, formatter(message))
    }

    protected formatError(error: any) {
        return JSON.stringify(serializeError(error), null, 2)
    }

    protected formatErrorValue(value: unknown) {
        if (typeof value === 'symbol' || typeof value === 'function' || typeof value === 'object') {
            return this.inspect(value, 6)
        }

        return String(value)
    }

    protected formatParam(param: unknown) {
        if (isErrorInstance(param)) {
            return JSON.stringify(serializeError(mergeErrorCause(param)))
        }

        return this.inspect(param, 4)
    }

    protected inspect(param: unknown, indentSpace: number) {
        return this.trimLastLineSpace(
            ltrim(indent(inspect(param, { ...this.inspectOptions, colors: false }), indentSpace)),
            indentSpace - 2
        )
    }

    protected trimLastLineSpace(message: string, space: number) {
        const lines = message.split('\n')

        if (lines.length > 1) {
            lines[lines.length - 1] = ' '.repeat(space) + ltrim(last(lines))
        }

        return lines.join('\n')
    }

    protected createLimiter() {
        const reservoir = TELEGRAM_MAX_MESSAGES_PER_MINUTE_PER_CHAT
        const minTime = 1000 / TELEGRAM_MAX_MESSAGES_PER_SECOND

        return new Bottleneck({
            reservoir,
            reservoirRefreshAmount: reservoir,
            reservoirRefreshInterval: 60 * 1000,
            minTime,
            maxConcurrent: 1,
        })
    }
}
