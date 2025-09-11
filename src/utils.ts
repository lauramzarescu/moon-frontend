import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Updater } from '@tanstack/table-core';
import type { Ref } from 'vue';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
    ref.value = typeof updaterOrValue === 'function' ? updaterOrValue(ref.value) : updaterOrValue;
}

/**
 * Executes a function with a delay of 301ms to avoid debouncing issues.
 * This is useful when you need to ensure a function executes after typical debounce periods.
 *
 * @param fn - The function to execute after the delay
 * @param args - Arguments to pass to the function
 * @returns Promise that resolves with the function's return value
 *
 * @example
 * // Execute a function with delay
 * await withDelay(() => console.log('Hello'));
 *
 * // Execute an async function with delay
 * const result = await withDelay(async () => {
 *   const data = await fetchData();
 *   return data;
 * });
 *
 * // Execute a function with arguments
 * await withDelay((name: string) => console.log(`Hello ${name}`), 'World');
 *
 * // Use in Vue components to avoid debouncing
 * await withDelay(async () => {
 *   await performApiCall();
 *   emit('refresh');
 * });
 */
export function withDelay<T extends (...args: any[]) => any>(
    fn: T,
    ...args: Parameters<T>
): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const result = await fn(...args);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, 301);
    });
}

/**
 * A simpler version of withDelay for void functions that don't need return values.
 * Executes a function with a 301ms delay to avoid debouncing issues.
 *
 * @param fn - The function to execute after the delay
 *
 * @example
 * // Simple delayed execution
 * delayedExecute(() => {
 *   console.log('This runs after 301ms');
 * });
 *
 * // With async functions
 * delayedExecute(async () => {
 *   await someAsyncOperation();
 * });
 */
export function delayedExecute(fn: () => void | Promise<void>): void {
    setTimeout(async () => {
        try {
            await fn();
        } catch (error) {
            console.error('Error in delayed execution:', error);
        }
    }, 301);
}
