import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { LiquidacionCompraController } from "@/modules/liquidacion-compra/infra/http/liquidacion-compra.controller";
import { LiquidacionCompraValidation } from "@/modules/liquidacion-compra/infra/http/validation";
import { LiquidacionCompraRepositoryDrizzle } from "@/modules/liquidacion-compra/infra/repository/liquidacion-compra.repository";
import { CreateLiquidacionCompra } from "@/modules/liquidacion-compra/use-cases/create-liquidacion-compra.use-case";
import { GetLiquidacionCompra } from "@/modules/liquidacion-compra/use-cases/get-liquidacion-compra.use-case";
import { EmitirCaeLiquidacionCompra } from "@/modules/liquidacion-compra/use-cases/emitir-cae-liquidacion-compra.use-case";

/**
 * Depende de `compras` (CompraRepository + CompraCategoriaRepository) y de
 * `proveedores` (ProveedorRepository, para `EmitirCaeLiquidacionCompra`) —
 * debe registrarse DESPUÉS de ambos en `di.ts`.
 */
export function registerLiquidacionCompraModule(container: Container): void {
  container.bind(DI_TYPES.LiquidacionCompraValidation).to(LiquidacionCompraValidation);
  container.bind(DI_TYPES.LiquidacionCompraRepository).to(LiquidacionCompraRepositoryDrizzle);
  container.bind(DI_TYPES.CreateLiquidacionCompra).to(CreateLiquidacionCompra);
  container.bind(DI_TYPES.GetLiquidacionCompra).to(GetLiquidacionCompra);
  container.bind(DI_TYPES.EmitirCaeLiquidacionCompra).to(EmitirCaeLiquidacionCompra);
  container.bind(DI_TYPES.LiquidacionCompraController).to(LiquidacionCompraController);
  container.get(DI_TYPES.LiquidacionCompraController);
}
