import { createContext, useCallback, useContext, useState, useMemo } from 'react';
import { useRetimer } from 'foxact/use-retimer';
import { requestIdleCallback } from 'foxact/request-idle-callback';

export interface PinnedDomain {
  zoneId: string,
  zoneName: string
}

const PinnedDomainsContext = createContext<PinnedDomain[]>([]);
export function usePinnedDomains() {
  return useContext(PinnedDomainsContext);
}

interface PinnedDomainsActions {
  addPinnedDomain: (domain: PinnedDomain) => void,
  removePinnedDomain: (zoneId: string) => void,
  isPinned: (zoneId: string) => boolean
}

const PinnedDomainsActionsContext = createContext<PinnedDomainsActions | null>(null);
export function usePinnedDomainsActions() {
  const actions = useContext(PinnedDomainsActionsContext);

  if (!actions) {
    throw new Error('You must wrap your app with <PinnedDomainsProvider />');
  }

  return actions;
}

const STORAGE_KEY = 'dashflare-pinned-domains';

export function PinnedDomainsProvider({ children }: React.PropsWithChildren) {
  const [pinnedDomains, setPinnedDomains] = useState<PinnedDomain[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const retimer = useRetimer();

  const persistToStorage = useCallback((domains: PinnedDomain[]) => {
    const timerId = requestIdleCallback(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(domains));
    });
    retimer(timerId);
  }, [retimer]);

  const addPinnedDomain = useCallback((domain: PinnedDomain) => {
    setPinnedDomains(prev => {
      if (prev.some(d => d.zoneId === domain.zoneId)) {
        return prev;
      }
      const newDomains = [...prev, domain];
      persistToStorage(newDomains);
      return newDomains;
    });
  }, [persistToStorage]);

  const removePinnedDomain = useCallback((zoneId: string) => {
    setPinnedDomains(prev => {
      const newDomains = prev.filter(d => d.zoneId !== zoneId);
      persistToStorage(newDomains);
      return newDomains;
    });
  }, [persistToStorage]);

  const isPinned = useCallback((zoneId: string) => {
    return pinnedDomains.some(d => d.zoneId === zoneId);
  }, [pinnedDomains]);

  const actions = useMemo(() => ({
    addPinnedDomain,
    removePinnedDomain,
    isPinned
  }), [addPinnedDomain, removePinnedDomain, isPinned]);

  return (
    <PinnedDomainsActionsContext.Provider value={actions}>
      <PinnedDomainsContext.Provider value={pinnedDomains}>
        {children}
      </PinnedDomainsContext.Provider>
    </PinnedDomainsActionsContext.Provider>
  );
}
