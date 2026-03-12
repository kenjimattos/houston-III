import type { UserSessionInfo } from "@/types/user-session";

export async function fetchCurrentUserSession(): Promise<UserSessionInfo> {
  const res = await fetch("/api/me", { credentials: "include" });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Não autenticado");
    }
    throw new Error("Erro ao buscar dados do usuário");
  }

  const json = await res.json();
  return json.data;
}
