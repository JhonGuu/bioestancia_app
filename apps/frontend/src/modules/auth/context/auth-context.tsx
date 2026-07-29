import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SessionStorage } from "@/shared/auth/session-storage";
import { AuthEvents } from "@/shared/auth/auth-events";
import { authApi } from "@/modules/auth/api/auth.api";
import type { EmpresaAcceso, SignInInput, User } from "@/modules/auth/domain/auth.types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  empresas: EmpresaAcceso[];
  empresaActiva: EmpresaAcceso | null;
  signIn: (input: SignInInput) => Promise<void>;
  logout: () => void;
  selectEmpresa: (empresaId: string) => void;
  isSigningIn: boolean;
  signInError: string | null;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const [token, setToken] = React.useState<string | null>(() => SessionStorage.getToken());
  const [empresaActivaId, setEmpresaActivaId] = React.useState<string | null>(() =>
    SessionStorage.getEmpresaId(),
  );

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getMyAccount,
    enabled: !!token,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const empresasQuery = useQuery({
    queryKey: ["auth", "empresas"],
    queryFn: authApi.getMyEmpresas,
    enabled: !!token,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  // El http-client emite este evento cuando el server devuelve 401 (token
  // vencido/inválido) y ya limpió el localStorage — acá solo sincronizamos
  // el estado de React con eso.
  React.useEffect(() => {
    return AuthEvents.onUnauthorized(() => {
      setToken(null);
      setEmpresaActivaId(null);
      queryClient.clear();
    });
  }, [queryClient]);

  const signInMutation = useMutation({
    mutationFn: authApi.signIn,
    onSuccess: (data) => {
      SessionStorage.setToken(data.token);
      setToken(data.token);

      // Si solo tiene acceso a una empresa, se la seleccionamos de una —
      // no tiene sentido mostrarle un selector de una sola opción.
      if (data.empresas.length === 1) {
        const [unica] = data.empresas;
        SessionStorage.setEmpresaId(unica.empresaId);
        setEmpresaActivaId(unica.empresaId);
      }
    },
  });

  const signIn = React.useCallback(
    async (input: SignInInput) => {
      await signInMutation.mutateAsync(input);
    },
    [signInMutation],
  );

  const logout = React.useCallback(() => {
    SessionStorage.clear();
    setToken(null);
    setEmpresaActivaId(null);
    queryClient.clear();
  }, [queryClient]);

  const selectEmpresa = React.useCallback(
    (empresaId: string) => {
      SessionStorage.setEmpresaId(empresaId);
      setEmpresaActivaId(empresaId);
      // Cambiar de empresa invalida cualquier dato de negocio que haya en
      // caché: viene de otra empresa y ya no aplica.
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "auth",
      });
    },
    [queryClient],
  );

  const empresas = empresasQuery.data ?? [];
  const empresaActiva = empresas.find((e) => e.empresaId === empresaActivaId) ?? null;

  const status: AuthStatus = !token
    ? "unauthenticated"
    : meQuery.isPending || empresasQuery.isPending
      ? "loading"
      : meQuery.isError
        ? "unauthenticated"
        : "authenticated";

  const value: AuthContextValue = {
    status,
    user: meQuery.data ?? null,
    empresas,
    empresaActiva,
    signIn,
    logout,
    selectEmpresa,
    isSigningIn: signInMutation.isPending,
    signInError: signInMutation.error?.message ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
