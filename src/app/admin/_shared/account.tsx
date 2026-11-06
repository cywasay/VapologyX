"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

export type Account = { id: string; email: string; avatarUrl: string | null };

// undefined while loading, null when the account couldn't be read.
type AccountState = { account: Account | null | undefined; setAvatar: (url: string) => void };
const AccountContext = createContext<AccountState | null>(null);

// Loads the signed-in admin once for the whole dashboard.
export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null | undefined>(undefined);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setAccount(data.user?.email ? { id: data.user.id, email: data.user.email, avatarUrl: data.user.user_metadata.avatar_url ?? null } : null);
    });
  }, []);

  const setAvatar = (avatarUrl: string) => setAccount(current => current && { ...current, avatarUrl });
  return <AccountContext.Provider value={{ account, setAvatar }}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const state = useContext(AccountContext);
  if (!state) throw new Error("useAccount must be used inside the dashboard");
  return state;
}
