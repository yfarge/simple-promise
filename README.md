# SimplePromise: A Lightweight Promise Implementation

`SimplePromise` is a custom implementation of JavaScript's `Promise` that mimics the core functionalities of native Promises.

## Features

-   **Standard Promise Methods**: Supports `.then()`, `.catch()`, and `.finally()` methods.
-   **Static Methods**: Implements `SimplePromise.resolve()`, `SimplePromise.reject()`, `SimplePromise.all()`, `SimplePromise.allSettled()`, `SimplePromise.race()`, and `SimplePromise.any()`.
-   **Custom Uncaught Rejection Handling**: Throws `UncaughtPromiseError` if a rejection is not handled.
-   **Microtask-based Execution**: Uses `queueMicrotask()` to manage asynchronous execution.

## Installation

Clone the repository and include the `SimplePromise` class in your project.

```javascript
import { SimplePromise } from './SimplePromise'
```

## Example Usage

### Basic Promise

```javascript
const promise = new SimplePromise((resolve, reject) => {
    setTimeout(() => resolve('Success!'), 1000)
})

promise.then((value) => console.log(value)) // Output after 1 second: "Success!"
```

### Chaining Promises

```javascript
new SimplePromise((resolve) => resolve(2))
    .then((value) => value * 2)
    .then((value) => console.log(value)) // Output: 4
```

### Handling Errors

```javascript
new SimplePromise((_, reject) => reject('Something went wrong')).catch(
    (error) => console.error(error)
) // Output: "Something went wrong"
```

### Using `finally`

```javascript
new SimplePromise((resolve) => resolve('Done')).finally(() =>
    console.log('Cleaning up...')
) // Output: "Cleaning up..."
```

### Static Methods

-   **`SimplePromise.resolve()`**:

    ```javascript
    SimplePromise.resolve(42).then((value) => console.log(value)) // Output: 42
    ```

-   **`SimplePromise.reject()`**:

    ```javascript
    SimplePromise.reject('Error!').catch((reason) => console.error(reason)) // Output: "Error!"
    ```

-   **`SimplePromise.all()`**:

    ```javascript
    SimplePromise.all([
        SimplePromise.resolve(1),
        SimplePromise.resolve(2),
    ]).then((values) => console.log(values)) // Output: [1, 2]
    ```

-   **`SimplePromise.allSettled()`**:

    ```javascript
    SimplePromise.allSettled([
        SimplePromise.resolve(1),
        SimplePromise.reject(2),
    ]).then((values) => console.log(values)) // Output: [{status: 'fulfilled', value: 1}, {status: 'rejected', reason: 2}]
    ```

-   **`SimplePromise.race()`**:

    ```javascript
    SimplePromise.race([
        SimplePromise.reject('First Settled'),
        SimplePromise.resolve('Second Settled'),
    ]).then((value) => console.log(value)) // Output: "First Settled"
    ```

-   **`SimplePromise.any()`**:

    ```javascript
    SimplePromise.any([
        SimplePromise.reject('Failed'),
        SimplePromise.resolve('First Success'),
    ]).then((value) => console.log(value)) // Output: "First Success"
    ```

## Testing

This implementation is tested using [Vitest](https://vitest.dev/). The test suite covers basic functionality, chaining, static methods, and edge cases like uncaught rejections.

### Running the Tests

1. Install the dependencies:

    ```bash
    pnpm install vitest
    ```

2. Run the tests:

    ```bash
    pnpm run vitest
    ```
