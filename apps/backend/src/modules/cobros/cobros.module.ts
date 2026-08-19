import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CobroController } from "@/modules/cobros/infra/http/cobro.controller";
import { CobroValidation } from "@/modules/cobros/infra/http/validation";
import { CreateCobro } from "@/modules/cobros/use-cases/create-cobro.use-case";
import { ListCobros } from "@/modules/cobros/use-cases/list-cobros.use-case";
import { GetCobro } from "@/modules/cobros/use-cases/get-cobro.use-case";
import { AplicarCobroFifo } from "@/modules/cobros/use-cases/aplicar-cobro-fifo.use-case";
import { SugerirRecargoCheque } from "@/modules/cobros/use-cases/sugerir-recargo-cheque.use-case";
import { ConfirmarRecargoCheque } from "@/modules/cobros/use-cases/confirmar-recargo-cheque.use-case";
import { SugerirReversionChequeRechazado } from "@/modules/cobros/use-cases/sugerir-reversion-cheque-rechazado.use-case";
import { ConfirmarRechazoCheque } from "@/modules/cobros/use-cases/confirmar-rechazo-cheque.use-case";

/**
 * Depende de `clientes` (ClienteRepository), `boletas` (BoletaRepository),
 * `ventas` (VentaRepository), `cheques` (ChequeRepository) y
 * `cargos-cuenta-corriente` (CargoCuentaCorrienteRepository) —
 * `CreateCobro` valida el cliente y crea cheques, `AplicarCobroFifo` lee
 * boletas/ventas para calcular el saldo pendiente, y los 4 use-cases de
 * recargo/rechazo de cheque leen y crean cargos. Debe registrarse DESPUÉS
 * de los cinco en `di.ts`.
 *
 * `CobroRepository` NO se bindea acá — se bindea suelto en `di.ts` antes de
 * `boletas`/`ventas` (ver comentario ahí) porque esos módulos también lo
 * necesitan.
 */
export function registerCobrosModule(container: Container): void {
  container.bind(DI_TYPES.CobroValidation).to(CobroValidation);
  container.bind(DI_TYPES.AplicarCobroFifo).to(AplicarCobroFifo);
  container.bind(DI_TYPES.CreateCobro).to(CreateCobro);
  container.bind(DI_TYPES.ListCobros).to(ListCobros);
  container.bind(DI_TYPES.GetCobro).to(GetCobro);
  container.bind(DI_TYPES.SugerirRecargoCheque).to(SugerirRecargoCheque);
  container.bind(DI_TYPES.ConfirmarRecargoCheque).to(ConfirmarRecargoCheque);
  container.bind(DI_TYPES.SugerirReversionChequeRechazado).to(SugerirReversionChequeRechazado);
  container.bind(DI_TYPES.ConfirmarRechazoCheque).to(ConfirmarRechazoCheque);
  container.bind(DI_TYPES.CobroController).to(CobroController);
  container.get(DI_TYPES.CobroController);
}
