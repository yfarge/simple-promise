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
        return new SimplePromise((resolve, reject) => {
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
        })
    }

    catch(onRejected) {
        return this.then(undefined, onRejected)
    }

    finally(onFinally) {
        this.then(
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
        return new SimplePromise((resolve, reject) => {
            promises.forEach((promise, i) => {
                promise
                    .then((value) => {
                        fulfilledPromises++
                        result[i] = value

                        if (fulfilledPromises === promises.length) {
                            resolve(result)
                        }
                    })
                    .catch(reject)
            })
        })
    }

    static allSettled(promises) {
        const result = []
        let completedPromises = 0
        return new SimplePromise((resolve) => {
            promises.forEach((promise, i) => {
                promise
                    .then((value) => {
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
        })
    }

    static race(promises) {
        return new SimplePromise((resolve, reject) => {
            promises.forEach((promise) => {
                promise.then(resolve).catch(reject)
            })
        })
    }

    static any(promises) {
        const errors = []
        let rejectedPromises = 0
        return new SimplePromise((resolve, reject) => {
            promises.forEach((promise, i) => {
                promise.then(resolve).catch((reason) => {
                    rejectedPromises++
                    errors[i] = reason
                    if (rejectedPromises === promises.length) {
                        reject(
                            new AggregateError(
                                errors,
                                'All promises were rejected'
                            )
                        )
                    }
                })
            })
        })
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
            if (value instanceof SimplePromise) {
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
