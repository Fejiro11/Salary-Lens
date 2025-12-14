/**
 * Browser-compatible fetch-retry polyfill
 */

interface RetryOptions {
  retries?: number;
  retryDelay?: number | ((attempt: number, error: Error | null, response: Response | null) => number);
  retryOn?: number[] | ((attempt: number, error: Error | null, response: Response | null) => boolean);
}

function fetchRetry(fetch: typeof globalThis.fetch, defaults?: RetryOptions) {
  return function fetchWithRetry(
    input: RequestInfo | URL,
    init?: RequestInit & RetryOptions
  ): Promise<Response> {
    const retries = init?.retries ?? defaults?.retries ?? 3;
    const retryDelay = init?.retryDelay ?? defaults?.retryDelay ?? 1000;
    const retryOn = init?.retryOn ?? defaults?.retryOn ?? [500, 502, 503, 504];

    return new Promise((resolve, reject) => {
      const attemptFetch = (attempt: number) => {
        fetch(input, init)
          .then((response) => {
            // Check if we should retry based on status code
            const shouldRetry = Array.isArray(retryOn)
              ? retryOn.includes(response.status)
              : typeof retryOn === 'function'
              ? retryOn(attempt, null, response)
              : false;

            if (shouldRetry && attempt < retries) {
              const delay =
                typeof retryDelay === 'function'
                  ? retryDelay(attempt, null, response)
                  : retryDelay;
              setTimeout(() => attemptFetch(attempt + 1), delay);
            } else {
              resolve(response);
            }
          })
          .catch((error) => {
            // Check if we should retry on error
            const shouldRetry =
              typeof retryOn === 'function'
                ? retryOn(attempt, error, null)
                : attempt < retries;

            if (shouldRetry && attempt < retries) {
              const delay =
                typeof retryDelay === 'function'
                  ? retryDelay(attempt, error, null)
                  : retryDelay;
              setTimeout(() => attemptFetch(attempt + 1), delay);
            } else {
              reject(error);
            }
          });
      };

      attemptFetch(0);
    });
  };
}

export default fetchRetry;
export { fetchRetry };
