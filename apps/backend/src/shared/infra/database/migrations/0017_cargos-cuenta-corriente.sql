CREATE TYPE "public"."tipo_cargo" AS ENUM('recargo_cheque', 'comision_rechazo', 'otro');--> statement-breakpoint
CREATE TABLE "cargos_cuenta_corriente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"tipo" "tipo_cargo" NOT NULL,
	"monto" numeric(14, 2) NOT NULL,
	"cheque_id" uuid,
	"motivo" varchar(255),
	"fecha" timestamp NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "cargos_cuenta_corriente" ADD CONSTRAINT "cargos_cuenta_corriente_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargos_cuenta_corriente" ADD CONSTRAINT "cargos_cuenta_corriente_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cargos_cuenta_corriente" ADD CONSTRAINT "cargos_cuenta_corriente_cheque_id_cheques_id_fk" FOREIGN KEY ("cheque_id") REFERENCES "public"."cheques"("id") ON DELETE restrict ON UPDATE no action;