const STATE = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected',
}

class SimplePromise {
    #state = STATE.PENDING
    #result = null
    #promiseFulfillReactions = []
    #promiseRejectReactions = []
    #onResolveBinded = this.#onResolve.bind(this)
    #onRejectBinded = this.#onReject.bind(this)

    constructor(executor) {
        try {
            executor(this.#onResolveBinded, this.#onRejectBinded)
        } catch (e) {
            this.#onRejectBinded(e)
        }
    }

    then(onFulfilled, onRejected) {
        const { promise, resolve, reject } = SimplePromise.withResolvers()
        this.#promiseFulfillReactions.push((result) => {
            if (onFulfilled == null) {
                resolve(result)
                return
            }

            try {
                resolve(onFulfilled(result))
            } catch (e) {
                reject(e)
            }
        })

        this.#promiseRejectReactions.push((result) => {
            if (onRejected == null) {
                reject(result)
                return
            }

            try {
                resolve(onRejected(result))
            } catch (e) {
                reject(e)
            }
        })

        this.#processCallbacks()
        return promise
    }

    catch(onRejected) {
        return this.then(undefined, onRejected)
    }

    finally(onFinally) {
        return this.then(
            (value) => {
                onFinally()
                return value
            },
            (reason) => {
                onFinally()
                throw reason
            }
        )
    }

    static resolve(value) {
        return new SimplePromise((resolve) => resolve(value))
    }

    static reject(value) {
        return new SimplePromise((reject) => reject(value))
    }

    static all(promises) {
        const result = []
        let fulfilledPromises = 0
        const { promise, resolve, reject } = SimplePromise.withResolvers()
        promises.forEach((p, i) => {
            p.then((value) => {
                fulfilledPromises++
                result[i] = value

                if (fulfilledPromises === promises.length) {
                    resolve(result)
                }
            }).catch(reject)
        })
        return promise
    }

    static allSettled(promises) {
        const result = []
        let completedPromises = 0
        const { promise, resolve } = SimplePromise.withResolvers()
        promises.forEach((p, i) => {
            p.then((value) => {
                result[i] = { status: STATE.FULFILLED, value }
            })
                .catch((reason) => {
                    result[i] = { status: STATE.REJECTED, reason }
                })
                .finally(() => {
                    completedPromises++
                    if (completedPromises === promises.length) {
                        resolve(result)
                    }
                })
        })
        return promise
    }

    static race(promises) {
        const { promise, resolve, reject } = SimplePromise.withResolvers()
        promises.forEach((p) => {
            p.then(resolve).catch(reject)
        })
        return promise
    }

    static any(promises) {
        const errors = []
        let rejectedPromises = 0
        const { promise, resolve, reject } = SimplePromise.withResolvers()
        promises.forEach((p, i) => {
            p.then(resolve).catch((reason) => {
                rejectedPromises++
                errors[i] = reason
                if (rejectedPromises === promises.length) {
                    reject(
                        new AggregateError(errors, 'All promises were rejected')
                    )
                }
            })
        })
        return promise
    }

    static withResolvers() {
        let resolve, reject
        const promise = new SimplePromise((resolve_, reject_) => {
            resolve = resolve_
            reject = reject_
        })
        return { promise, resolve, reject }
    }

    #processCallbacks() {
        if (this.#state === STATE.FULFILLED) {
            this.#promiseFulfillReactions.forEach((onFulfilled) =>
                onFulfilled(this.#result)
            )
            this.#promiseFulfillReactions = []
        }

        if (this.#state === STATE.REJECTED) {
            this.#promiseRejectReactions.forEach((onRejected) =>
                onRejected(this.#result)
            )
            this.#promiseRejectReactions = []
        }
    }

    #onResolve(value) {
        queueMicrotask(() => {
            if (this.#state !== STATE.PENDING) return
            if (value && typeof value.then === 'function') {
                value.then(this.#onResolveBinded, this.#onRejectBinded)
                return
            }

            this.#state = STATE.FULFILLED
            this.#result = value
            this.#processCallbacks()
        })
    }

    #onReject(reason) {
        queueMicrotask(() => {
            if (this.#state !== STATE.PENDING) return
            this.#state = STATE.REJECTED
            this.#result = reason
            if (this.#promiseRejectReactions.length === 0) {
                throw new UncaughtPromiseError()
            }
            this.#processCallbacks()
        })
    }
}

class UncaughtPromiseError extends Error {
    constructor(error) {
        super(error)
        this.stack = `(in promise) ${error.stack}`
    }
}

export { SimplePromise }
