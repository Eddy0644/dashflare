import { createContext, useCallback, useContext, useState, useMemo } from 'react';
import { useRetimer } from 'foxact/use-retimer';
import { requestIdleCallback } from 'foxact/request-idle-callback';

const SelectedAccountIdContext = createContext<string | null>(null);
export function useSelectedAccountId() {
  return useContext(SelectedAccountIdContext);
}

interface SelectedAccountActions {
  setSelectedAccountId: (accountId: string | null) => void
}

const SelectedAccountActionsContext = createContext<SelectedAccountActions | null>(null);
export function useSelectedAccountActions() {
  const actions = useContext(SelectedAccountActionsContext);

  if (!actions) {
    throw new Error('You must wrap your app with <SelectedAccountProvider />');
  }

  return actions;
}

const STORAGE_KEY = 'dashflare-selected-account';

export function SelectedAccountProvider({ children }: React.PropsWithChildren) {
  const [selectedAccountId, setSelectedAccountIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const retimer = useRetimer();

  const setSelectedAccountId = useCallback((accountId: string | null) => {
    setSelectedAccountIdState(accountId);
    const timerId = requestIdleCallback(() => {
      if (accountId) {
        localStorage.setItem(STORAGE_KEY, accountId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    });
    retimer(timerId);
  }, [retimer]);

  const actions = useMemo(() => ({
    setSelectedAccountId
  }), [setSelectedAccountId]);

  return (
    <SelectedAccountActionsContext.Provider value={actions}>
      <SelectedAccountIdContext.Provider value={selectedAccountId}>
        {children}
      </SelectedAccountIdContext.Provider>
    </SelectedAccountActionsContext.Provider>
  );
}
