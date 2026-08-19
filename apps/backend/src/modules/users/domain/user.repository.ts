import { UserWithCredentials } from "@/modules/users/domain/user";

/**
 * Interface del repositorio de Users. Forma parte del DOMINIO.
 *
 * Los use-cases dependen de esta interface, no de la implementación concreta.
 * La implementación concreta vive en `infra/repository/user.repository.ts`
 * y se conecta a esta interface vía DI.
 *
 * Si mañana cambiás de Drizzle a Prisma, solo tocás la implementación.
 * Esta interface queda igual y los use-cases ni se enteran.
 */
export interface UserRepository {
  /** Busca un user por id. Devuelve null si no existe. */
  getById(id: string): Promise<UserWithCredentials | null>;

  /** Busca un user por email (case-insensitive). Devuelve null si no existe. */
  getByEmail(email: string): Promise<UserWithCredentials | null>;

  /** Busca por email O username (cualquiera de los dos). Útil para validar duplicados al signup. */
  findByEmailOrUsername(email: string, username: string): Promise<UserWithCredentials | null>;

  /** Crea un user nuevo. Recibe el hash ya calculado (el use-case lo hashea). No tiene rol: el rol se otorga aparte, por empresa (ver UsuarioEmpresaRepository). */
  create(input: CreateUserInput): Promise<UserWithCredentials>;

  /** Actualiza el campo `last_login_at` con `now()`. Lo llama el use-case de SignIn. */
  updateLastLogin(userId: string): Promise<void>;

  /** Activa o desactiva el usuario (login bloqueado si `isActive: false`). */
  setActive(userId: string, isActive: boolean): Promise<void>;

  /**
   * Actualiza el hash de contraseña y apaga `mustChangePassword`. Lo llama
   * `ChangePassword` — cambiar la contraseña siempre limpia el flag, sea un
   * cambio forzado (primer login) o voluntario.
   */
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

/**
 * Input para crear un user. Notá que recibe `passwordHash` ya calculado,
 * no la password en plano. La responsabilidad del repo es persistir, no hashear.
 */
export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  /** Default `false`. Ver `User.mustChangePassword`. */
  mustChangePassword?: boolean;
}
