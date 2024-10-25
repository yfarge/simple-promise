import { describe, expect, it } from 'vitest'
import { SimplePromise } from 'SimplePromise'

const DEFAULT_VALUE = 'default'
const ERROR_MESSAGE = 'error'

describe('then', () => {
    it('should resolve with the correct value', async () => {
        await new SimplePromise((resolve) => resolve(DEFAULT_VALUE)).then(
            (value) => expect(value).toBe(DEFAULT_VALUE)
        )
    })

    it("should support multiple 'then' calls for the same promise", async () => {
        const p = new SimplePromise((resolve) => resolve(DEFAULT_VALUE))
        await SimplePromise.allSettled([
            p.then((value) => expect(value).toBe(DEFAULT_VALUE)),
            p.then((value) => expect(value).toBe(DEFAULT_VALUE)),
        ])
    })

    it('should support chaining', async () => {
        await new SimplePromise((resolve) => resolve(2))
            .then((value) => value ** 2)
            .then((value) => expect(value).toBe(4))
    })

    it("should support both 'onResolved' and 'onRejected' callbacks", async () => {
        await SimplePromise.allSettled([
            new SimplePromise((resolve) => resolve(DEFAULT_VALUE)).then(
                (value) => expect(value).toBe(DEFAULT_VALUE),
                () => {
                    throw new Error('Should not reach here')
                }
            ),
            new SimplePromise((_, reject) => reject(ERROR_MESSAGE)).then(
                () => {
                    throw new Error('Should not reach here')
                },
                (reason) => expect(reason).toBe(ERROR_MESSAGE)
            ),
        ])
    })
})

describe('catch', () => {
    it('should reject with the correct value', async () => {
        await new SimplePromise((_, reject) => reject(ERROR_MESSAGE)).catch(
            (reason) => expect(reason).toBe(ERROR_MESSAGE)
        )
    })

    it("should support multiple 'catch' calls for the same promise", async () => {
        const p = new SimplePromise((_, reject) => reject(ERROR_MESSAGE))
        await SimplePromise.allSettled([
            p.catch((reason) => expect(reason).toBe(ERROR_MESSAGE)),
            p.catch((reason) => expect(reason).toBe(ERROR_MESSAGE)),
        ])
    })

    it('should support chaining', async () => {
        await new SimplePromise((resolve) => resolve(2))
            .then((value) => {
                throw value ** 2
            })
            .catch((reason) => expect(reason).toBe(4))
    })

    it('should throw an `UncaughtPromiseError` if a promise is rejected and not caught', async () => {
        await expect(
            new SimplePromise((_, reject) => reject(ERROR_MESSAGE))
        ).rejects.toThrowError()
    })
})

describe('finally', () => {
    it("should call the 'onFinally' callback without arguments", async () => {
        await new SimplePromise((resolve) => resolve(DEFAULT_VALUE)).finally(
            (value) => expect(value).toBeUndefined()
        )

        await new SimplePromise((_, reject) => {
            reject(ERROR_MESSAGE)
        })
            .catch((reason) => expect(reason).toBe(ERROR_MESSAGE))
            .finally((value) => expect(value).toBeUndefined())
    })

    it('should support multiple `finally` calls for the same promise', async () => {
        const p = new SimplePromise((resolve) => resolve(DEFAULT_VALUE))
        await SimplePromise.allSettled([
            p.finally((value) => expect(value).toBeUndefined()),
            p.finally((value) => expect(value).toBeUndefined()),
        ])
    })

    it('should support chaining', async () => {
        await SimplePromise.allSettled([
            new SimplePromise((resolve) => resolve(DEFAULT_VALUE))
                .then((value) => value)
                .finally((value) => expect(value).toBeUndefined()),
            new SimplePromise((_, reject) => reject(ERROR_MESSAGE))
                .then((value) => value)
                .catch((reason) => reason)
                .finally((value) => expect(value).toBeUndefined()),
        ])
    })
})

describe('static methods', () => {
    describe('resolve', () => {
        it('should resolve with the correct value', async () => {
            await SimplePromise.resolve(DEFAULT_VALUE).then((value) =>
                expect(value).toBe(DEFAULT_VALUE)
            )
        })
    })

    describe('reject', () => {
        it('should reject with the correct value', async () => {
            await SimplePromise.reject(ERROR_MESSAGE).catch((reason) =>
                expect(reason).toBe(ERROR_MESSAGE)
            )
        })
    })

    describe('all', () => {
        it('should return a promise that resolves to array of values if all promises are successful', async () => {
            await SimplePromise.all([
                new SimplePromise((resolve) => resolve(0)),
                new SimplePromise((resolve) => resolve(1)),
                new SimplePromise((resolve) => resolve(2)),
            ]).then((values) => expect(values).toEqual([0, 1, 2]))
        })

        it('should return a promise that rejects to the first reject reason if any of the promises reject', async () => {
            await SimplePromise.all([
                new SimplePromise((resolve) => resolve(0)),
                new SimplePromise((resolve) => resolve(1)),
                new SimplePromise((reject) => reject(ERROR_MESSAGE)),
            ]).catch((value) => expect(value).toBe(ERROR_MESSAGE))
        })
    })

    describe('allSettled', () => {
        it('should return a promise that resolves to an array of objects', async () => {
            await SimplePromise.allSettled([
                new SimplePromise((resolve) => resolve(0)),
                new SimplePromise((_, reject) => reject(1)),
                new SimplePromise((resolve) => resolve(2)),
                new SimplePromise((_, reject) => reject(3)),
                new SimplePromise((resolve) => resolve(4)),
            ]).then((values) =>
                expect(values).toEqual([
                    { status: 'fulfilled', value: 0 },
                    { status: 'rejected', reason: 1 },
                    { status: 'fulfilled', value: 2 },
                    { status: 'rejected', reason: 3 },
                    { status: 'fulfilled', value: 4 },
                ])
            )
        })
    })

    describe('race', () => {
        it('should return a promise that settles with the eventual state of the first promise that settles', async () => {
            await SimplePromise.race([
                new SimplePromise((resolve) => resolve(0)),
                new SimplePromise((resolve) => resolve(1)),
            ]).then((value) => expect(value).toBe(0))

            await SimplePromise.race([
                new SimplePromise((reject) => reject(0)),
                new SimplePromise((resolve) => resolve(1)),
            ]).then((value) => expect(value).toBe(0))
        })
    })

    describe('any', () => {
        it('should return a promise that resolves to the first fulfilled promise value', async () => {
            await SimplePromise.any([
                new SimplePromise((resolve) => resolve(0)),
                new SimplePromise((resolve) => resolve(1)),
                new SimplePromise((resolve) => resolve(2)),
            ]).then((value) => expect(value).toBe(0))
        })

        it('should reject to an `AggregateError` if all of the promises are rejected', async () => {
            await SimplePromise.any([
                new SimplePromise((_, reject) => reject(0)),
                new SimplePromise((_, reject) => reject(1)),
                new SimplePromise((_, reject) => reject(2)),
            ]).catch((e) => {
                expect(e).toBeInstanceOf(AggregateError)
                expect(e.errors).toEqual([0, 1, 2])
            })
        })
    })

    describe('withResolvers', () => {
        it('should resolve the promise to the correct value passed to resolve', async () => {
            const { promise, resolve } = SimplePromise.withResolvers()
            resolve(DEFAULT_VALUE)
            await promise.then((value) => expect(value).toBe(DEFAULT_VALUE))
        })

        it('should reject the promise to the correct reason passed to reject', async () => {
            const { promise, reject } = SimplePromise.withResolvers()
            reject(ERROR_MESSAGE)
            await promise.catch((reason) => expect(reason).toBe(ERROR_MESSAGE))
        })
    })
})
