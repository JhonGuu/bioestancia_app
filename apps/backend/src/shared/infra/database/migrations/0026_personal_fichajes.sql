CREATE TYPE "public"."origen_fichaje" AS ENUM('importado', 'manual');--> statement-breakpoint
CREATE TYPE "public"."tipo_fichaje" AS ENUM('entrada', 'salida');--> statement-breakpoint
CREATE TABLE "fichajes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"empleado_id" uuid NOT NULL,
	"momento" timestamp NOT NULL,
	"tipo" "tipo_fichaje" NOT NULL,
	"origen" "origen_fichaje" DEFAULT 'importado' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fichajes" ADD CONSTRAINT "fichajes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fichajes" ADD CONSTRAINT "fichajes_empleado_id_empleados_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."empleados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fichajes_empleado_momento_idx" ON "fichajes" USING btree ("empleado_id","momento");