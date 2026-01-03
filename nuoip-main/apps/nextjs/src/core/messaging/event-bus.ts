export interface EventBus<TEventMap extends Record<string, any> = Record<string, any>> {
  on<K extends keyof TEventMap>(event: K, handler: (payload: TEventMap[K]) => void): void
  emit<K extends keyof TEventMap>(event: K, payload: TEventMap[K]): void
  off<K extends keyof TEventMap>(event: K, handler?: (payload: TEventMap[K]) => void): void
}

export const createEventBus = <TEventMap extends Record<string, any> = Record<string, any>>(): EventBus<TEventMap> => ({
  on: () => {},
  emit: () => {},
  off: () => {},
})
