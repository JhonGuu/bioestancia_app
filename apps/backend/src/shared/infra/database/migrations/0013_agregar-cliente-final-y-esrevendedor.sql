CREATE TABLE "clientes_finales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "es_revendedor" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "cliente_final_id" uuid;--> statement-breakpoint
ALTER TABLE "clientes_finales" ADD CONSTRAINT "clientes_finales_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes_finales" ADD CONSTRAINT "clientes_finales_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_final_id_clientes_finales_id_fk" FOREIGN KEY ("cliente_final_id") REFERENCES "public"."clientes_finales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" DROP COLUMN "cliente_final_referencia";