CREATE TABLE "liquidacion_faena" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"compra_id" uuid NOT NULL,
	"frigorifico_id" uuid,
	"fecha" timestamp NOT NULL,
	"comentarios" varchar(255),
	"total" numeric(14, 2) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "liquidacion_faena_compra_unique" UNIQUE("compra_id")
);
--> statement-breakpoint
ALTER TABLE "compra_categorias" ADD COLUMN "canon_faena_por_animal" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "compra_categorias" ADD COLUMN "canon_faena_subtotal" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "liquidacion_faena" ADD CONSTRAINT "liquidacion_faena_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquidacion_faena" ADD CONSTRAINT "liquidacion_faena_compra_id_compras_id_fk" FOREIGN KEY ("compra_id") REFERENCES "public"."compras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquidacion_faena" ADD CONSTRAINT "liquidacion_faena_frigorifico_id_frigorificos_id_fk" FOREIGN KEY ("frigorifico_id") REFERENCES "public"."frigorificos"("id") ON DELETE set null ON UPDATE no action;