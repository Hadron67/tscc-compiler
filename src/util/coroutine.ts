export interface Coroutine<T>{
    run(a: T): void;
    fail(): void;
};