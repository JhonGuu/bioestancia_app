/**
 * Identificadores únicos de las dependencias del container.
 *
 * Convención: agrupados por tipo de dependencia. Cuando agregues una nueva,
 * sumala en su grupo correspondiente.
 */
export const DI_TYPES = {
  // Adapters de infraestructura
  HttpServer: Symbol.for("HttpServer"),
  DBConnection: Symbol.for("DBConnection"),
  JWTProvider: Symbol.for("JWTProvider"),
  Logger: Symbol.for("Logger"),
  AuthProvider: Symbol.for("AuthProvider"),

  // ── Module: users ──────────────────────────────
  UserValidation: Symbol.for("UserValidation"),
  UserRepository: Symbol.for("UserRepository"),
  SignUp: Symbol.for("SignUp"),
  SignIn: Symbol.for("SignIn"),
  GetMyAccount: Symbol.for("GetMyAccount"),
  UserController: Symbol.for("UserController"),
} as const;
