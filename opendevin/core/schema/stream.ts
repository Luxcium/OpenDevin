/**
 * StreamMixin class providing basic stream functionality.
 */
export class StreamMixin<T> implements IterableIterator<T> {
    private generator: Generator<T>;
    private closed: boolean;

    constructor(generator: Generator<T>) {
        this.generator = generator;
        this.closed = false;
    }

    /**
     * Returns the iterator itself.
     */
    [Symbol.iterator](): IterableIterator<T> {
        return this;
    }

    /**
     * Returns the next value from the generator or ends iteration if closed.
     */
    next(): IteratorResult<T> {
        if (this.closed) {
            return { done: true, value: undefined as unknown as T };
        } else {
            return this.generator.next();
        }
    }
}

/**
 * Abstract class CancellableStream extending StreamMixin.
 */
export abstract class CancellableStream<T> extends StreamMixin<T> {
    /**
     * Closes the stream.
     */
    abstract close(): void;

    /**
     * Returns the exit code or null.
     */
    abstract exitCode(): number | null;
}
