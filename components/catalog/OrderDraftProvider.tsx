"use client";

import {createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode} from "react";

type OrderDraftState<Draft, Message> = {draft: Draft | null; message: Message};
type Listener = () => void;

function createOrderDraftStore() {
  // Filters may unmount rows, so drafts live until their catalog provider unmounts.
  const drafts = new Map<string, unknown>();
  const listeners = new Map<string, Set<Listener>>();

  return {
    get<State>(key: string, initial: State): State {
      return drafts.has(key) ? drafts.get(key) as State : initial;
    },
    update<State>(key: string, initial: State, change: (state: State) => State) {
      const current = drafts.has(key) ? drafts.get(key) as State : initial;
      const next = change(current);
      if (Object.is(current, next)) return;
      drafts.set(key, next);
      listeners.get(key)?.forEach(listener => listener());
    },
    subscribe(key: string, listener: Listener) {
      const subscribers = listeners.get(key) ?? new Set<Listener>();
      listeners.set(key, subscribers);
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
        if (subscribers.size === 0) listeners.delete(key);
      };
    },
  };
}

const OrderDraftContext = createContext<ReturnType<typeof createOrderDraftStore> | null>(null);

export function OrderDraftProvider({children}: {children: ReactNode}) {
  const [store] = useState(createOrderDraftStore);
  return <OrderDraftContext.Provider value={store}>{children}</OrderDraftContext.Provider>;
}

export function useOrderDraft<Draft, Message = string>(variantId: string, controller: string, initialMessage: Message) {
  const sharedStore = useContext(OrderDraftContext);
  const [fallbackStore] = useState(() => sharedStore ?? createOrderDraftStore());
  const store = sharedStore ?? fallbackStore;
  const [initialState] = useState<OrderDraftState<Draft, Message>>(() => ({draft: null, message: initialMessage}));
  const key = JSON.stringify([controller, variantId]);
  const binding = useMemo(() => ({
    subscribe: (listener: Listener) => store.subscribe(key, listener),
    getSnapshot: () => store.get(key, initialState),
    getServerSnapshot: () => initialState,
  }), [store, key, initialState]);
  const state = useSyncExternalStore(binding.subscribe, binding.getSnapshot, binding.getServerSnapshot);

  const setDraft = useCallback((draft: Draft | null) => {
    store.update(key, initialState, current => Object.is(current.draft, draft) ? current : {...current, draft});
  }, [store, key, initialState]);
  const setMessage = useCallback((message: Message) => {
    store.update(key, initialState, current => Object.is(current.message, message) ? current : {...current, message});
  }, [store, key, initialState]);

  return {...state, setDraft, setMessage};
}
