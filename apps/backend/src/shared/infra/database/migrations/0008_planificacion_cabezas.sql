CREATE TABLE "planificacion_cabezas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"fecha" timestamp NOT NULL,
	"cabezas_planificadas" integer NOT NULL,
	"comentarios" varchar(255),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "planificacion_cabezas_cliente_fecha_unique" UNIQUE("cliente_id","fecha")
);
--> statement-breakpoint
ALTER TABLE "planificacion_cabezas" ADD CONSTRAINT "planificacion_cabezas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planificacion_cabezas" ADD CONSTRAINT "planificacion_cabezas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;
