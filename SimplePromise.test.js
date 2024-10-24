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
        await p.then((value) => expect(value).toBe(DEFAULT_VALUE))
        await p.then((value) => expect(value).toBe(DEFAULT_VALUE))
    })

    it('should support chaining', async () => {
        await new SimplePromise((resolve) => resolve(2))
            .then((value) => value ** 2)
            .then((value) => expect(value).toBe(4))
    })

    it("should support both 'onResolved' and 'onRejected' callbacks", async () => {
        await new SimplePromise((resolve) => resolve(DEFAULT_VALUE)).then(
            (value) => expect(value).toBe(DEFAULT_VALUE),
            () => {
                throw new Error('Should not reach here')
            }
        )

        await new SimplePromise((_, reject) => reject(ERROR_MESSAGE)).then(
            () => {
                throw new Error('Should not reach here')
            },
            (reason) => expect(reason).toBe(ERROR_MESSAGE)
        )
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
        await p.catch((reason) => expect(reason).toBe(ERROR_MESSAGE))
        await p.catch((reason) => expect(reason).toBe(ERROR_MESSAGE))
    })

    it('should support chaining', async () => {
        await new SimplePromise((resolve) => resolve(2))
            .then((value) => {
                throw value ** 2
            })
            .catch((reason) => expect(reason).toBe(4))
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

    it('should support multiple finally calls for the same promise', async () => {
        const p = new SimplePromise((resolve) => resolve(DEFAULT_VALUE))
        await p.finally((value) => expect(value).toBeUndefined())
        await p.finally((value) => expect(value).toBeUndefined())
    })

    it('should support chaining', async () => {
        await new SimplePromise((resolve) => resolve(DEFAULT_VALUE))
            .then((value) => value)
            .finally((value) => expect(value).toBeUndefined())

        await new SimplePromise((_, reject) => reject(ERROR_MESSAGE))
            .then((value) => value)
            .catch((reason) => reason)
            .finally((value) => expect(value).toBeUndefined())
    })
})
