import { compare } from "bcrypt";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { JWTProvider } from "@/shared/infra/jwt/jwt-provider";
import { Logger } from "@/shared/infra/logger/logger";
import { UserRepository } from "@/modules/users/domain/user.repository";
import { UsuarioEmpresaRepository } from "@/modules/users/domain/usuario-empresa.repository";
import { EmpresaAcceso } from "@/modules/users/domain/usuario-empresa";

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignInOutput {
  token: string;
  /**
   * Empresas a las que el usuario tiene acceso, con su rol en cada una.
   * El frontend usa esto para: si hay una sola, seleccionarla automáticamente;
   * si hay más de una, mostrar el selector de empresa.
   */
  empresas: EmpresaAcceso[];
}

@injectable()
export class SignIn {
  constructor(
    @inject(DI_TYPES.UserRepository) private readonly userRepository: UserRepository,
    @inject(DI_TYPES.UsuarioEmpresaRepository)
    private readonly usuarioEmpresaRepository: UsuarioEmpresaRepository,
    @inject(DI_TYPES.JWTProvider) private readonly jwtProvider: JWTProvider,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: SignInInput): Promise<SignInOutput> {
    const email = input.email.toLowerCase();

    // 1. Buscar el user
    const user = await this.userRepository.getByEmail(email);
    if (!user) {
      // OJO: misma respuesta para "user no existe" y "password incorrecta".
      // Si las distinguís, le decís al atacante "este email existe en mi base".
      // Le da info para hacer brute force.
      throw new ApiError("Credenciales inválidas", Code.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new ApiError("Cuenta desactivada", Code.FORBIDDEN);
    }

    // 2. Verificar password (bcrypt.compare hashea la entrada con el mismo salt y compara)
    const isValid = await compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new ApiError("Credenciales inválidas", Code.UNAUTHORIZED);
    }

    // 3. Actualizar last_login_at (no bloqueamos la respuesta si falla)
    await this.userRepository.updateLastLogin(user.id);

    // 4. Firmar el JWT con solo el id (SIN rol ni empresa — eso se resuelve
    //    por request vía el header X-Empresa-Id, así el acceso queda siempre
    //    al día aunque el token no haya vencido).
    const token = this.jwtProvider.encrypt({ id: user.id });

    // 5. Empresas a las que tiene acceso, para que el frontend arme el selector.
    const empresas = await this.usuarioEmpresaRepository.listEmpresasForUsuario(user.id);

    this.logger.info({ userId: user.id }, "User signed in");

    return { token, empresas };
  }
}
