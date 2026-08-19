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
  FileStorage: Symbol.for("FileStorage"),
  WsaaClient: Symbol.for("WsaaClient"),
  WslspClient: Symbol.for("WslspClient"),
  BoletaPdfGenerator: Symbol.for("BoletaPdfGenerator"),
  ReporteDiarioPdfGenerator: Symbol.for("ReporteDiarioPdfGenerator"),
  ReporteDiarioExcelGenerator: Symbol.for("ReporteDiarioExcelGenerator"),
  ResumenCuentaPdfGenerator: Symbol.for("ResumenCuentaPdfGenerator"),
  ResumenCuentaExcelGenerator: Symbol.for("ResumenCuentaExcelGenerator"),

  // ── Module: empresas ───────────────────────────
  EmpresaValidation: Symbol.for("EmpresaValidation"),
  EmpresaRepository: Symbol.for("EmpresaRepository"),
  CreateEmpresa: Symbol.for("CreateEmpresa"),
  ListEmpresas: Symbol.for("ListEmpresas"),
  UpdateEmpresa: Symbol.for("UpdateEmpresa"),
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
  ListEmpresaUsers: Symbol.for("ListEmpresaUsers"),
  SetUserActive: Symbol.for("SetUserActive"),
  ChangePassword: Symbol.for("ChangePassword"),
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
  UpdateCliente: Symbol.for("UpdateCliente"),
  DeleteCliente: Symbol.for("DeleteCliente"),
  ClienteFinalRepository: Symbol.for("ClienteFinalRepository"),
  CreateClienteFinal: Symbol.for("CreateClienteFinal"),
  ListClientesFinales: Symbol.for("ListClientesFinales"),
  ClienteController: Symbol.for("ClienteController"),

  // ── Module: proveedores ─────────────────────────
  ProveedorValidation: Symbol.for("ProveedorValidation"),
  ProveedorRepository: Symbol.for("ProveedorRepository"),
  CreateProveedor: Symbol.for("CreateProveedor"),
  ListProveedores: Symbol.for("ListProveedores"),
  GetProveedor: Symbol.for("GetProveedor"),
  UpdateProveedor: Symbol.for("UpdateProveedor"),
  DeleteProveedor: Symbol.for("DeleteProveedor"),
  ReactivarProveedor: Symbol.for("ReactivarProveedor"),
  ProveedorController: Symbol.for("ProveedorController"),

  // ── Module: frigorificos ─────────────────────────
  FrigorificoValidation: Symbol.for("FrigorificoValidation"),
  FrigorificoRepository: Symbol.for("FrigorificoRepository"),
  CreateFrigorifico: Symbol.for("CreateFrigorifico"),
  ListFrigorificos: Symbol.for("ListFrigorificos"),
  GetFrigorifico: Symbol.for("GetFrigorifico"),
  UpdateFrigorifico: Symbol.for("UpdateFrigorifico"),
  DeleteFrigorifico: Symbol.for("DeleteFrigorifico"),
  ReactivarFrigorifico: Symbol.for("ReactivarFrigorifico"),
  FrigorificoController: Symbol.for("FrigorificoController"),

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
  ObtenerStockTropas: Symbol.for("ObtenerStockTropas"),
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
  EmitirCaeLiquidacionCompra: Symbol.for("EmitirCaeLiquidacionCompra"),
  LiquidacionCompraController: Symbol.for("LiquidacionCompraController"),

  // ── Module: liquidacion-faena ─────────────────────
  LiquidacionFaenaValidation: Symbol.for("LiquidacionFaenaValidation"),
  LiquidacionFaenaRepository: Symbol.for("LiquidacionFaenaRepository"),
  CreateLiquidacionFaena: Symbol.for("CreateLiquidacionFaena"),
  GetLiquidacionFaena: Symbol.for("GetLiquidacionFaena"),
  LiquidacionFaenaController: Symbol.for("LiquidacionFaenaController"),

  // ── Module: informes-compras ──────────────────────
  ObtenerRentabilidadTropas: Symbol.for("ObtenerRentabilidadTropas"),
  InformesComprasController: Symbol.for("InformesComprasController"),

  // ── Module: boletas ──────────────────────────────
  BoletaValidation: Symbol.for("BoletaValidation"),
  BoletaRepository: Symbol.for("BoletaRepository"),
  CreateBoleta: Symbol.for("CreateBoleta"),
  ListBoletas: Symbol.for("ListBoletas"),
  GetBoleta: Symbol.for("GetBoleta"),
  ObtenerReporteDiarioData: Symbol.for("ObtenerReporteDiarioData"),
  GenerarBoletaPdf: Symbol.for("GenerarBoletaPdf"),
  GenerarReporteDiarioPdf: Symbol.for("GenerarReporteDiarioPdf"),
  GenerarReporteDiarioExcel: Symbol.for("GenerarReporteDiarioExcel"),
  UpdateBoleta: Symbol.for("UpdateBoleta"),
  DeleteBoleta: Symbol.for("DeleteBoleta"),
  BoletaController: Symbol.for("BoletaController"),

  // ── Module: ventas ───────────────────────────────
  VentaValidation: Symbol.for("VentaValidation"),
  VentaRepository: Symbol.for("VentaRepository"),
  CreateVenta: Symbol.for("CreateVenta"),
  ListVentas: Symbol.for("ListVentas"),
  GetVenta: Symbol.for("GetVenta"),
  SetPrecioVenta: Symbol.for("SetPrecioVenta"),
  SetPrecioVentasLote: Symbol.for("SetPrecioVentasLote"),
  UpdateVentaItem: Symbol.for("UpdateVentaItem"),
  DeleteVenta: Symbol.for("DeleteVenta"),
  VentaController: Symbol.for("VentaController"),

  // ── Module: planificacion-cabezas ────────────────
  PlanificacionCabezasValidation: Symbol.for("PlanificacionCabezasValidation"),
  PlanificacionCabezasRepository: Symbol.for("PlanificacionCabezasRepository"),
  UpsertPlanificacionCabezas: Symbol.for("UpsertPlanificacionCabezas"),
  ListPlanificacionCabezas: Symbol.for("ListPlanificacionCabezas"),
  PlanificacionCabezasController: Symbol.for("PlanificacionCabezasController"),

  // ── Module: cheques ───────────────────────────────
  ChequeValidation: Symbol.for("ChequeValidation"),
  ChequeRepository: Symbol.for("ChequeRepository"),
  ListCheques: Symbol.for("ListCheques"),
  GetCheque: Symbol.for("GetCheque"),
  ActualizarEstadoCheque: Symbol.for("ActualizarEstadoCheque"),
  ChequeController: Symbol.for("ChequeController"),

  // ── Module: cargos-cuenta-corriente ───────────────
  CargoCuentaCorrienteValidation: Symbol.for("CargoCuentaCorrienteValidation"),
  CargoCuentaCorrienteRepository: Symbol.for("CargoCuentaCorrienteRepository"),
  CreateCargoCuentaCorriente: Symbol.for("CreateCargoCuentaCorriente"),
  ListCargosCuentaCorriente: Symbol.for("ListCargosCuentaCorriente"),
  CargoCuentaCorrienteController: Symbol.for("CargoCuentaCorrienteController"),

  // ── Module: cobros ────────────────────────────────
  CobroValidation: Symbol.for("CobroValidation"),
  CobroRepository: Symbol.for("CobroRepository"),
  CreateCobro: Symbol.for("CreateCobro"),
  ListCobros: Symbol.for("ListCobros"),
  GetCobro: Symbol.for("GetCobro"),
  AplicarCobroFifo: Symbol.for("AplicarCobroFifo"),
  SugerirRecargoCheque: Symbol.for("SugerirRecargoCheque"),
  ConfirmarRecargoCheque: Symbol.for("ConfirmarRecargoCheque"),
  SugerirReversionChequeRechazado: Symbol.for("SugerirReversionChequeRechazado"),
  ConfirmarRechazoCheque: Symbol.for("ConfirmarRechazoCheque"),
  CobroController: Symbol.for("CobroController"),

  // ── Module: cuenta-corriente ──────────────────────
  CuentaCorrienteValidation: Symbol.for("CuentaCorrienteValidation"),
  ObtenerSaldoCliente: Symbol.for("ObtenerSaldoCliente"),
  ObtenerSaldosClientes: Symbol.for("ObtenerSaldosClientes"),
  ObtenerMovimientosCuentaCorriente: Symbol.for("ObtenerMovimientosCuentaCorriente"),
  ObtenerResumenCuentaData: Symbol.for("ObtenerResumenCuentaData"),
  GenerarResumenCuentaPdf: Symbol.for("GenerarResumenCuentaPdf"),
  GenerarResumenCuentaExcel: Symbol.for("GenerarResumenCuentaExcel"),
  CuentaCorrienteController: Symbol.for("CuentaCorrienteController"),

  // ── Module: metas-semanales ──────────────────────
  MetasSemanalesValidation: Symbol.for("MetasSemanalesValidation"),
  ObtenerProgresoMetasSemanales: Symbol.for("ObtenerProgresoMetasSemanales"),
  MetasSemanalesController: Symbol.for("MetasSemanalesController"),

  // ── Module: porcentaje-cobranza ──────────────────
  PorcentajeCobranzaValidation: Symbol.for("PorcentajeCobranzaValidation"),
  ObtenerPorcentajeCobranza: Symbol.for("ObtenerPorcentajeCobranza"),
  PorcentajeCobranzaController: Symbol.for("PorcentajeCobranzaController"),

  // ── Module: personal (Cargo, Empleado, HorarioEmpleado) ──
  CargoValidation: Symbol.for("CargoValidation"),
  CargoRepository: Symbol.for("CargoRepository"),
  CreateCargo: Symbol.for("CreateCargo"),
  ListCargos: Symbol.for("ListCargos"),
  GetCargo: Symbol.for("GetCargo"),
  UpdateCargo: Symbol.for("UpdateCargo"),
  DeleteCargo: Symbol.for("DeleteCargo"),
  ReactivarCargo: Symbol.for("ReactivarCargo"),
  CargoController: Symbol.for("CargoController"),

  EmpleadoValidation: Symbol.for("EmpleadoValidation"),
  EmpleadoRepository: Symbol.for("EmpleadoRepository"),
  CreateEmpleado: Symbol.for("CreateEmpleado"),
  ListEmpleados: Symbol.for("ListEmpleados"),
  GetEmpleado: Symbol.for("GetEmpleado"),
  UpdateEmpleado: Symbol.for("UpdateEmpleado"),
  DeleteEmpleado: Symbol.for("DeleteEmpleado"),
  ReactivarEmpleado: Symbol.for("ReactivarEmpleado"),
  SubirDniEmpleado: Symbol.for("SubirDniEmpleado"),
  DescargarDniEmpleado: Symbol.for("DescargarDniEmpleado"),

  HorarioEmpleadoRepository: Symbol.for("HorarioEmpleadoRepository"),
  ListHorariosEmpleado: Symbol.for("ListHorariosEmpleado"),
  SetHorariosEmpleado: Symbol.for("SetHorariosEmpleado"),

  EmpleadoController: Symbol.for("EmpleadoController"),

  FichajeValidation: Symbol.for("FichajeValidation"),
  FichajeRepository: Symbol.for("FichajeRepository"),
  PrevisualizarImportacionFichajes: Symbol.for("PrevisualizarImportacionFichajes"),
  ConfirmarImportacionFichajes: Symbol.for("ConfirmarImportacionFichajes"),
  AgregarFichajeManual: Symbol.for("AgregarFichajeManual"),
  FichajeController: Symbol.for("FichajeController"),

  JornadaValidation: Symbol.for("JornadaValidation"),
  CalcularJornadasEmpleado: Symbol.for("CalcularJornadasEmpleado"),
  JornadaController: Symbol.for("JornadaController"),

  BalanceHorasValidation: Symbol.for("BalanceHorasValidation"),
  CalcularBalanceHoras: Symbol.for("CalcularBalanceHoras"),
  BalanceHorasController: Symbol.for("BalanceHorasController"),

  // ── Module: informe-cobranzas ────────────────────
  InformeCobranzasValidation: Symbol.for("InformeCobranzasValidation"),
  InformeCobranzasPdfGenerator: Symbol.for("InformeCobranzasPdfGenerator"),
  InformeCobranzasExcelGenerator: Symbol.for("InformeCobranzasExcelGenerator"),
  ObtenerInformeCobranzas: Symbol.for("ObtenerInformeCobranzas"),
  GenerarInformeCobranzasPdf: Symbol.for("GenerarInformeCobranzasPdf"),
  GenerarInformeCobranzasExcel: Symbol.for("GenerarInformeCobranzasExcel"),
  InformeCobranzasController: Symbol.for("InformeCobranzasController"),

  // ── Module: cabezas ────────────────────
  CabezasValidation: Symbol.for("CabezasValidation"),
  ObtenerInformeCabezas: Symbol.for("ObtenerInformeCabezas"),
  CabezasController: Symbol.for("CabezasController"),
} as const;
