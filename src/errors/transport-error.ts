import { Transport } from '../transports'

export class TransportError extends Error {
    public readonly transport: string

    public constructor(transport: Transport, message?: string, options?: ErrorOptions) {
        super(message ?? 'An error occurred while writing to the transport:', options)

        this.transport = transport.name
    }
}
