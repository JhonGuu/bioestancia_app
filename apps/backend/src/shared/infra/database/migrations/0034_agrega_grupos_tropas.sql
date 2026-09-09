CREATE TABLE "grupos_tropas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nombre" varchar(100),
	"peso_bruto_total" numeric(12, 2) NOT NULL,
	"peso_neto_total" numeric(12, 2) NOT NULL,
	"cerrado" boolean DEFAULT false NOT NULL,
	"fecha_cierre" timestamp,
	"peso_final_venta_total" numeric(12, 2),
	"rinde" numeric(5, 2),
	"alerta_superavit" boolean DEFAULT false NOT NULL,
	"comentarios" varchar(255),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "compras" ADD COLUMN "grupo_tropas_id" uuid;--> statement-breakpoint
ALTER TABLE "compras" ADD COLUMN "alerta_superavit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "grupos_tropas" ADD CONSTRAINT "grupos_tropas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compras" ADD CONSTRAINT "compras_grupo_tropas_id_grupos_tropas_id_fk" FOREIGN KEY ("grupo_tropas_id") REFERENCES "public"."grupos_tropas"("id") ON DELETE set null ON UPDATE no action;