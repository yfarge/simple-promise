const STATE = {
    PENDING: 0,
    FULFILLED: 1,
    REJECTED: 2,
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
