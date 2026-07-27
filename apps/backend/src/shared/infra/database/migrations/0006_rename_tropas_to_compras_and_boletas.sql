CREATE TYPE "public"."especie_animal" AS ENUM('porcino', 'bovino', 'otro');--> statement-breakpoint
ALTER TABLE "tropas" RENAME TO "compras";--> statement-breakpoint
ALTER TABLE "compras" RENAME CONSTRAINT "tropas_pkey" TO "compras_pkey";--> statement-breakpoint
ALTER TABLE "compras" RENAME CONSTRAINT "tropas_empresa_id_empresas_id_fk" TO "compras_empresa_id_empresas_id_fk";--> statement-breakpoint
ALTER TABLE "compras" RENAME CONSTRAINT "tropas_proveedor_id_proveedores_id_fk" TO "compras_proveedor_id_proveedores_id_fk";--> statement-breakpoint
ALTER TABLE "compras" ADD COLUMN "especie" "especie_animal" DEFAULT 'porcino' NOT NULL;--> statement-breakpoint
ALTER TABLE "compras" ADD COLUMN "letra" varchar(5);--> statement-breakpoint
CREATE TABLE "boletas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"fecha" timestamp NOT NULL,
	"numero" varchar(50),
	"comentarios" varchar(255),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "boletas" ADD CONSTRAINT "boletas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boletas" ADD CONSTRAINT "boletas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" DROP CONSTRAINT "ventas_tropa_id_tropas_id_fk";--> statement-breakpoint
ALTER TABLE "ventas" RENAME COLUMN "tropa_id" TO "compra_id";--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "boleta_id" uuid;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_compra_id_compras_id_fk" FOREIGN KEY ("compra_id") REFERENCES "public"."compras"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_boleta_id_boletas_id_fk" FOREIGN KEY ("boleta_id") REFERENCES "public"."boletas"("id") ON DELETE set null ON UPDATE no action;
