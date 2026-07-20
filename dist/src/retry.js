export class RetryableError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.name = 'RetryableError';
        this.status = status;
    }
}
export async function withRetry(fn, maxRetries = 2, delayMs = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries + 1; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            const status = error instanceof RetryableError ? error.status : 0;
            const isNetworkError = error instanceof TypeError;
            if (i < maxRetries && (status >= 500 || status === 429 || isNetworkError)) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}
