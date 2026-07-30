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

  // ── Module: empresas ───────────────────────────
  EmpresaValidation: Symbol.for("EmpresaValidation"),
  EmpresaRepository: Symbol.for("EmpresaRepository"),
  CreateEmpresa: Symbol.for("CreateEmpresa"),
  ListEmpresas: Symbol.for("ListEmpresas"),
  EmpresaController: Symbol.for("EmpresaController"),

  // ── Module: users ──────────────────────────────
  UserValidation: Symbol.for("UserValidation"),
  UserRepository: Symbol.for("UserRepository"),
  UsuarioEmpresaRepository: Symbol.for("UsuarioEmpresaRepository"),
  SignUp: Symbol.for("SignUp"),
  SignIn: Symbol.for("SignIn"),
  GetMyAccount: Symbol.for("GetMyAccount"),
  GetMyEmpresas: Symbol.for("GetMyEmpresas"),
  GrantEmpresaAccess: Symbol.for("GrantEmpresaAccess"),
  UserController: Symbol.for("UserController"),

  // ── Module: listas-precios ─────────────────────
  ListaDePreciosValidation: Symbol.for("ListaDePreciosValidation"),
  ListaDePreciosRepository: Symbol.for("ListaDePreciosRepository"),
  CreateListaDePrecios: Symbol.for("CreateListaDePrecios"),
  ListListasDePrecios: Symbol.for("ListListasDePrecios"),
  GetListaDePrecios: Symbol.for("GetListaDePrecios"),
  ListaDePreciosController: Symbol.for("ListaDePreciosController"),

  // ── Module: clientes ────────────────────────────
  ClienteValidation: Symbol.for("ClienteValidation"),
  ClienteRepository: Symbol.for("ClienteRepository"),
  CreateCliente: Symbol.for("CreateCliente"),
  ListClientes: Symbol.for("ListClientes"),
  GetCliente: Symbol.for("GetCliente"),
  ClienteController: Symbol.for("ClienteController"),

  // ── Module: proveedores ─────────────────────────
  ProveedorValidation: Symbol.for("ProveedorValidation"),
  ProveedorRepository: Symbol.for("ProveedorRepository"),
  CreateProveedor: Symbol.for("CreateProveedor"),
  ListProveedores: Symbol.for("ListProveedores"),
  GetProveedor: Symbol.for("GetProveedor"),
  ProveedorController: Symbol.for("ProveedorController"),

  // ── Module: compras (antes "tropas") ────────────
  CompraValidation: Symbol.for("CompraValidation"),
  CompraRepository: Symbol.for("CompraRepository"),
  CompraCategoriaRepository: Symbol.for("CompraCategoriaRepository"),
  CreateCompra: Symbol.for("CreateCompra"),
  ListCompras: Symbol.for("ListCompras"),
  GetCompra: Symbol.for("GetCompra"),
  UpdateCompra: Symbol.for("UpdateCompra"),
  CerrarCompra: Symbol.for("CerrarCompra"),
  ReabrirCompra: Symbol.for("ReabrirCompra"),
  CompraController: Symbol.for("CompraController"),

  // ── Module: resultado-faena ──────────────────────
  ResultadoFaenaValidation: Symbol.for("ResultadoFaenaValidation"),
  ResultadoFaenaRepository: Symbol.for("ResultadoFaenaRepository"),
  CreateResultadoFaena: Symbol.for("CreateResultadoFaena"),
  GetResultadoFaena: Symbol.for("GetResultadoFaena"),
  ResultadoFaenaController: Symbol.for("ResultadoFaenaController"),

  // ── Module: liquidacion-compra ───────────────────
  LiquidacionCompraValidation: Symbol.for("LiquidacionCompraValidation"),
  LiquidacionCompraRepository: Symbol.for("LiquidacionCompraRepository"),
  CreateLiquidacionCompra: Symbol.for("CreateLiquidacionCompra"),
  GetLiquidacionCompra: Symbol.for("GetLiquidacionCompra"),
  LiquidacionCompraController: Symbol.for("LiquidacionCompraController"),

  // ── Module: boletas ──────────────────────────────
  BoletaValidation: Symbol.for("BoletaValidation"),
  BoletaRepository: Symbol.for("BoletaRepository"),
  CreateBoleta: Symbol.for("CreateBoleta"),
  ListBoletas: Symbol.for("ListBoletas"),
  GetBoleta: Symbol.for("GetBoleta"),
  BoletaController: Symbol.for("BoletaController"),

  // ── Module: ventas ───────────────────────────────
  VentaValidation: Symbol.for("VentaValidation"),
  VentaRepository: Symbol.for("VentaRepository"),
  CreateVenta: Symbol.for("CreateVenta"),
  ListVentas: Symbol.for("ListVentas"),
  GetVenta: Symbol.for("GetVenta"),
  VentaController: Symbol.for("VentaController"),

  // ── Module: planificacion-cabezas ────────────────
  PlanificacionCabezasValidation: Symbol.for("PlanificacionCabezasValidation"),
  PlanificacionCabezasRepository: Symbol.for("PlanificacionCabezasRepository"),
  UpsertPlanificacionCabezas: Symbol.for("UpsertPlanificacionCabezas"),
  ListPlanificacionCabezas: Symbol.for("ListPlanificacionCabezas"),
  PlanificacionCabezasController: Symbol.for("PlanificacionCabezasController"),
} as const;
