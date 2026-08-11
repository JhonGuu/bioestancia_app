// Polyfill de Reflect.metadata — necesario para que Inversify funcione al
// levantar el container fuera del bootstrap normal de index.ts.
import "reflect-metadata";
import { hash } from "bcrypt";

import { DI } from "@/shared/infra/di/di";
import { DI_TYPES } from "@/shared/infra/di/types";
import { Env } from "@/shared/infra/env/env";
import { Logger } from "@/shared/infra/logger/logger";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { Rubro } from "@/modules/empresas/domain/empresa";
import { EmpresaRepository, UpdateEmpresaInput } from "@/modules/empresas/domain/empresa.repository";
import { UserRepository } from "@/modules/users/domain/user.repository";
import { UsuarioEmpresaRepository } from "@/modules/users/domain/usuario-empresa.repository";
import { Roles } from "@/modules/users/domain/roles";

/**
 * Seed de bootstrap: crea las dos empresas iniciales (Bioestancia, El Meridiano)
 * y, si están seteadas las variables SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD,
 * un usuario admin con acceso a ambas.
 *
 * Es necesario porque los endpoints que crean empresas/usuarios/accesos requieren
 * un admin existente (`RoleGroups.AdminOnly`) — sin este script no hay forma de
 * arrancar el sistema desde cero. Es idempotente: correrlo de nuevo no duplica
 * empresas ni usuarios.
 *
 * Uso:
 *   SEED_ADMIN_EMAIL=vos@bioestancia.com SEED_ADMIN_PASSWORD=algo-seguro pnpm db:seed
 *
 * Sin esas dos variables, solo crea las empresas (sin admin).
 *
 * También completa cuit/teléfono/dirección de cada empresa (se muestran en el
 * encabezado del PDF de boleta — ver `BoletaPdfGenerator`) si vienen seteados
 * por env (`SEED_BIOESTANCIA_*` / `SEED_EL_MERIDIANO_*`, ver abajo). Es
 * backfill, no pisa datos ya cargados: solo completa los campos que estén
 * vacíos, así que es seguro correrlo de nuevo con variables distintas.
 */
async function seed(): Promise<void> {
  const container = DI.getInstance().container;
  const logger = container.get<Logger>(DI_TYPES.Logger);
  const db = container.get<DrizzleAdapter>(DI_TYPES.DBConnection);
  const empresaRepository = container.get<EmpresaRepository>(DI_TYPES.EmpresaRepository);
  const userRepository = container.get<UserRepository>(DI_TYPES.UserRepository);
  const usuarioEmpresaRepository = container.get<UsuarioEmpresaRepository>(
    DI_TYPES.UsuarioEmpresaRepository,
  );

  await db.init();

  // 1. Empresas (idempotente por razón social)
  const existentes = await empresaRepository.list();

  type DatosContacto = { cuit?: string; telefono?: string; direccion?: string };

  const findOrCreateEmpresa = async (razonSocial: string, rubro: Rubro, datos: DatosContacto = {}) => {
    const found = existentes.find((e) => e.razonSocial === razonSocial);
    if (found) {
      // Backfill: solo completa los campos que vinieron por env Y todavía
      // están vacíos — nunca pisa un valor ya cargado (a mano o en un seed
      // anterior).
      const faltantes: UpdateEmpresaInput = {};
      if (datos.cuit && !found.cuit) faltantes.cuit = datos.cuit;
      if (datos.telefono && !found.telefono) faltantes.telefono = datos.telefono;
      if (datos.direccion && !found.direccion) faltantes.direccion = datos.direccion;
      if (Object.keys(faltantes).length === 0) return found;

      const actualizado = await empresaRepository.update(found.id, faltantes);
      logger.info(
        { empresaId: found.id, razonSocial, campos: Object.keys(faltantes) },
        "Datos de contacto de la empresa completados desde env",
      );
      return actualizado;
    }

    const created = await empresaRepository.create({ razonSocial, rubro, ...datos });
    logger.info({ empresaId: created.id, razonSocial }, "Empresa creada");
    return created;
  };

  const bioestancia = await findOrCreateEmpresa("Bioestancia", Rubro.FRIGORIFICO, {
    cuit: process.env.SEED_BIOESTANCIA_CUIT,
    telefono: process.env.SEED_BIOESTANCIA_TELEFONO,
    direccion: process.env.SEED_BIOESTANCIA_DIRECCION,
  });
  const elMeridiano = await findOrCreateEmpresa("El Meridiano", Rubro.REVENDEDORA, {
    cuit: process.env.SEED_EL_MERIDIANO_CUIT,
    telefono: process.env.SEED_EL_MERIDIANO_TELEFONO,
    direccion: process.env.SEED_EL_MERIDIANO_DIRECCION,
  });

  // 2. Admin inicial (opcional, vía env)
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn(
      "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD no seteados: se omite la creación del admin inicial. " +
        "Las empresas ya están creadas; corré el seed de nuevo con esas variables para crear el admin.",
    );
    await db.close();
    return;
  }

  let admin = await userRepository.getByEmail(email);
  if (!admin) {
    const passwordHash = await hash(password, Env.bcryptSalt);
    admin = await userRepository.create({
      email,
      username: email.split("@")[0],
      passwordHash,
      firstName: "Admin",
      lastName: "Bioestancia",
      phoneNumber: null,
    });
    logger.info({ userId: admin.id, email }, "Usuario admin inicial creado");
  }

  await usuarioEmpresaRepository.grantAccess({
    usuarioId: admin.id,
    empresaId: bioestancia.id,
    rol: Roles.ADMIN,
  });
  await usuarioEmpresaRepository.grantAccess({
    usuarioId: admin.id,
    empresaId: elMeridiano.id,
    rol: Roles.ADMIN,
  });

  logger.info(
    { email },
    "Admin con acceso ADMIN a Bioestancia y El Meridiano. Seed completado.",
  );

  await db.close();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Error corriendo el seed:", err);
  process.exit(1);
});
