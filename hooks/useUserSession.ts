"use client"

import { useState, useEffect, useCallback } from "react";
import { fetchCurrentUserSession } from "@/services/meService";
import type { UserSessionInfo } from "@/types/user-session";

export function useUserSession() {
  const [data, setData] = useState<UserSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const session = await fetchCurrentUserSession();
      setData(session);
    } catch (err) {
      console.error("Erro ao buscar sessão do usuário:", err);
      setError(err instanceof Error ? err.message : String(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
