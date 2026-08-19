import { httpClient, unwrap } from "@/shared/api/http-client";
import type {
  ChangePasswordInput,
  EmpresaAcceso,
  SignInInput,
  SignInOutput,
  User,
} from "@/modules/auth/domain/auth.types";

/**
 * Capa "infra" del módulo auth: única responsable de saber las URLs y el
 * shape crudo de la API. Los hooks (`use-cases` del lado del cliente) son los
 * únicos que llaman a estas funciones.
 */
export const authApi = {
  signIn(input: SignInInput): Promise<SignInOutput> {
    return unwrap(httpClient.post("/account/signin", input));
  },

  getMyAccount(): Promise<User> {
    return unwrap(httpClient.get("/account/me"));
  },

  getMyEmpresas(): Promise<EmpresaAcceso[]> {
    return unwrap(httpClient.get("/account/empresas"));
  },

  changePassword(input: ChangePasswordInput): Promise<void> {
    return unwrap(httpClient.post("/account/change-password", input));
  },
};
