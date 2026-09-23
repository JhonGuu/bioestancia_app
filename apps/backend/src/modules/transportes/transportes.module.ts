import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { TransporteController } from "@/modules/transportes/infra/http/transporte.controller";
import { TransporteValidation } from "@/modules/transportes/infra/http/validation";
import { ChoferRepositoryDrizzle } from "@/modules/transportes/infra/repository/chofer.repository";
import { TransporteClienteRepositoryDrizzle } from "@/modules/transportes/infra/repository/transporte-cliente.repository";
import { TransportistaRepositoryDrizzle } from "@/modules/transportes/infra/repository/transportista.repository";
import { VehiculoRepositoryDrizzle } from "@/modules/transportes/infra/repository/vehiculo.repository";
import {
  CreateChofer,
  DeleteChofer,
  GetChofer,
  ListChoferes,
  ReactivarChofer,
  UpdateChofer,
} from "@/modules/transportes/use-cases/chofer.use-cases";
import {
  GetTransporteCliente,
  SetTransporteCliente,
} from "@/modules/transportes/use-cases/transporte-cliente.use-cases";
import {
  CreateTransportista,
  DeleteTransportista,
  GetTransportista,
  ListTransportistas,
  ReactivarTransportista,
  UpdateTransportista,
} from "@/modules/transportes/use-cases/transportista.use-cases";
import {
  CreateVehiculo,
  DeleteVehiculo,
  GetVehiculo,
  ListVehiculos,
  ReactivarVehiculo,
  UpdateVehiculo,
} from "@/modules/transportes/use-cases/vehiculo.use-cases";

/** Va después de `clientes`: los autorizados por cliente inyectan `ClienteRepository`. */
export function registerTransportesModule(container: Container): void {
  container.bind(DI_TYPES.TransporteValidation).to(TransporteValidation);

  container.bind(DI_TYPES.TransportistaRepository).to(TransportistaRepositoryDrizzle);
  container.bind(DI_TYPES.ChoferRepository).to(ChoferRepositoryDrizzle);
  container.bind(DI_TYPES.VehiculoRepository).to(VehiculoRepositoryDrizzle);
  container.bind(DI_TYPES.TransporteClienteRepository).to(TransporteClienteRepositoryDrizzle);

  container.bind(DI_TYPES.CreateTransportista).to(CreateTransportista);
  container.bind(DI_TYPES.ListTransportistas).to(ListTransportistas);
  container.bind(DI_TYPES.GetTransportista).to(GetTransportista);
  container.bind(DI_TYPES.UpdateTransportista).to(UpdateTransportista);
  container.bind(DI_TYPES.DeleteTransportista).to(DeleteTransportista);
  container.bind(DI_TYPES.ReactivarTransportista).to(ReactivarTransportista);

  container.bind(DI_TYPES.CreateChofer).to(CreateChofer);
  container.bind(DI_TYPES.ListChoferes).to(ListChoferes);
  container.bind(DI_TYPES.GetChofer).to(GetChofer);
  container.bind(DI_TYPES.UpdateChofer).to(UpdateChofer);
  container.bind(DI_TYPES.DeleteChofer).to(DeleteChofer);
  container.bind(DI_TYPES.ReactivarChofer).to(ReactivarChofer);

  container.bind(DI_TYPES.CreateVehiculo).to(CreateVehiculo);
  container.bind(DI_TYPES.ListVehiculos).to(ListVehiculos);
  container.bind(DI_TYPES.GetVehiculo).to(GetVehiculo);
  container.bind(DI_TYPES.UpdateVehiculo).to(UpdateVehiculo);
  container.bind(DI_TYPES.DeleteVehiculo).to(DeleteVehiculo);
  container.bind(DI_TYPES.ReactivarVehiculo).to(ReactivarVehiculo);

  container.bind(DI_TYPES.GetTransporteCliente).to(GetTransporteCliente);
  container.bind(DI_TYPES.SetTransporteCliente).to(SetTransporteCliente);

  container.bind(DI_TYPES.TransporteController).to(TransporteController);
  container.get(DI_TYPES.TransporteController);
}
