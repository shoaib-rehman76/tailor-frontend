import "@/src/i18n";

import React, { useEffect, useMemo } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "@/src/store/store";
import { hydrateAllFromStorage } from "@/src/bootstrap/hydrateAllFromStorage";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { applyLanguageAndDirection } from "@/src/i18n/applyLanguageAndDirection";
import { setupPersistence } from "@/src/bootstrap/setupPersistence";
import { useOfflineSync } from "@/src/hooks/useOfflineSync";

function Bootstrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const language = useAppSelector((s) => s.settings.language);
  useOfflineSync();

  useEffect(() => {
    const unsubscribe = setupPersistence(store);
    void dispatch(hydrateAllFromStorage());
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    void applyLanguageAndDirection(language);
  }, [language]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 15_000 },
          mutations: { retry: 0 },
        },
      }),
    []
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Bootstrapper>{children}</Bootstrapper>
      </QueryClientProvider>
    </Provider>
  );
}

