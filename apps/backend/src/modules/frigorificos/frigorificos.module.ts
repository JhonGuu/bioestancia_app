import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { FrigorificoController } from "@/modules/frigorificos/infra/http/frigorifico.controller";
import { FrigorificoValidation } from "@/modules/frigorificos/infra/http/validation";
import { FrigorificoRepositoryDrizzle } from "@/modules/frigorificos/infra/repository/frigorifico.repository";
import { CreateFrigorifico } from "@/modules/frigorificos/use-cases/create-frigorifico.use-case";
import { ListFrigorificos } from "@/modules/frigorificos/use-cases/list-frigorificos.use-case";
import { GetFrigorifico } from "@/modules/frigorificos/use-cases/get-frigorifico.use-case";
import { UpdateFrigorifico } from "@/modules/frigorificos/use-cases/update-frigorifico.use-case";
import { DeleteFrigorifico } from "@/modules/frigorificos/use-cases/delete-frigorifico.use-case";
import { ReactivarFrigorifico } from "@/modules/frigorificos/use-cases/reactivar-frigorifico.use-case";

export function registerFrigorificosModule(container: Container): void {
  container.bind(DI_TYPES.FrigorificoValidation).to(FrigorificoValidation);
  container.bind(DI_TYPES.FrigorificoRepository).to(FrigorificoRepositoryDrizzle);
  container.bind(DI_TYPES.CreateFrigorifico).to(CreateFrigorifico);
  container.bind(DI_TYPES.ListFrigorificos).to(ListFrigorificos);
  container.bind(DI_TYPES.GetFrigorifico).to(GetFrigorifico);
  container.bind(DI_TYPES.UpdateFrigorifico).to(UpdateFrigorifico);
  container.bind(DI_TYPES.DeleteFrigorifico).to(DeleteFrigorifico);
  container.bind(DI_TYPES.ReactivarFrigorifico).to(ReactivarFrigorifico);
  container.bind(DI_TYPES.FrigorificoController).to(FrigorificoController);
  container.get(DI_TYPES.FrigorificoController);
}
