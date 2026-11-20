"use client";
import {
  createContext, useContext, useEffect, useState,
  useCallback, type ReactNode,
} from "react";
import { Hub } from "aws-amplify/utils";
import { configureAmplify } from "@/lib/amplify-config";
import { getAdminUser, type AdminUser } from "@/lib/admin-auth";

configureAmplify();

interface AdminContextValue {
  admin:   AdminUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue>({
  admin: null, loading: true, refresh: async () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin,   setAdmin]   = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    const result = await getAdminUser();
    setAdmin(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    check();
    const unsub = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn" || payload.event === "signedOut") check();
    });
    return unsub;
  }, [check]);

  return (
    <AdminContext.Provider value={{ admin, loading, refresh: check }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
