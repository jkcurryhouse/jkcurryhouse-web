"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { configureAmplify } from "@/lib/amplify-config";

configureAmplify();

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      const attrs = await fetchUserAttributes();
      setUser({
        userId: current.userId,
        username: current.username,
        email: attrs.email ?? "",
        name: attrs.name ?? "",
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          loadUser();
          break;
        case "signedOut":
          setUser(null);
          break;
      }
    });

    return unsubscribe;
  }, [loadUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
