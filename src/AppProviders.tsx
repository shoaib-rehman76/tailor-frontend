import "@/src/i18n";

import React, { useEffect, useMemo, useRef } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "@/src/store/store";
import { hydrateAllFromStorage } from "@/src/bootstrap/hydrateAllFromStorage";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { applyLanguageAndDirection } from "@/src/i18n/applyLanguageAndDirection";
import { setupPersistence } from "@/src/bootstrap/setupPersistence";
import { useOfflineSync } from "@/src/hooks/useOfflineSync";
import { clearSession } from "@/src/store/slices/authSlice";
import { authApi } from "@/src/api/authApi";

function Bootstrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const language = useAppSelector((s) => s.settings.language);
  const session = useAppSelector((s) => s.auth.session);
  const validatedTokenRef = useRef<string | null>(null);
  useOfflineSync();

  useEffect(() => {
    const unsubscribe = setupPersistence(store);
    void dispatch(hydrateAllFromStorage());
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    void applyLanguageAndDirection(language);
  }, [language]);

  useEffect(() => {
    if (!session) return;
    if (session.expiresAt <= Date.now()) {
      dispatch(clearSession());
      return;
    }

    const timeout = setTimeout(() => {
      dispatch(clearSession());
    }, session.expiresAt - Date.now());

    return () => clearTimeout(timeout);
  }, [dispatch, session]);

  useEffect(() => {
    if (!session) {
      validatedTokenRef.current = null;
      return;
    }
    if (session.expiresAt <= Date.now()) return;
    if (validatedTokenRef.current === session.token) return;

    validatedTokenRef.current = session.token;

    void authApi.me().catch(() => {
      validatedTokenRef.current = null;
      dispatch(clearSession());
    });
  }, [dispatch, session]);

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
