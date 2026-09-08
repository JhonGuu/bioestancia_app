CREATE TYPE "public"."evento_asiento" AS ENUM('boleta_facturada', 'cobro_registrado', 'cheque_depositado', 'cargo_recargo_cheque', 'cargo_rechazo_cheque', 'cargo_comision_rechazo', 'cargo_otro', 'compra_tropa', 'liquidacion_compra', 'liquidacion_faena');--> statement-breakpoint
CREATE TYPE "public"."lado_linea_regla" AS ENUM('debe', 'haber');--> statement-breakpoint
CREATE TABLE "reglas_asiento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"evento" "evento_asiento" NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"prioridad" integer DEFAULT 0 NOT NULL,
	"condicion" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reglas_asiento_lineas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regla_id" uuid NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"lado" "lado_linea_regla" NOT NULL,
	"cuenta_id" uuid NOT NULL,
	"expresion" varchar(30) NOT NULL,
	"auxiliar_resolver" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reglas_asiento" ADD CONSTRAINT "reglas_asiento_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reglas_asiento_lineas" ADD CONSTRAINT "reglas_asiento_lineas_regla_id_reglas_asiento_id_fk" FOREIGN KEY ("regla_id") REFERENCES "public"."reglas_asiento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reglas_asiento_lineas" ADD CONSTRAINT "reglas_asiento_lineas_cuenta_id_plan_cuentas_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."plan_cuentas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reglas_asiento_empresa_evento_idx" ON "reglas_asiento" USING btree ("empresa_id","evento");--> statement-breakpoint
CREATE INDEX "reglas_asiento_lineas_regla_idx" ON "reglas_asiento_lineas" USING btree ("regla_id");