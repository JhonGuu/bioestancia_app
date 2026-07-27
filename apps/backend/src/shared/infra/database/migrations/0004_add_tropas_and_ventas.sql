CREATE TYPE "public"."forma_venta" AS ENUM('cabeza_capon', 'cabeza_chancha', 'media_res_capon', 'pulpa', 'compensacion_kg');--> statement-breakpoint
CREATE TABLE "tropas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"numero" varchar(50) NOT NULL,
	"fecha" timestamp NOT NULL,
	"comentarios" varchar(255),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ventas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"tropa_id" uuid,
	"garron" integer,
	"forma_venta" "forma_venta" NOT NULL,
	"kg" numeric(10, 2) NOT NULL,
	"precio_kg" numeric(12, 2) NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"fecha" timestamp NOT NULL,
	"cliente_final_referencia" varchar(255),
	"comentarios" varchar(255),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "ventas_tropa_garron_unique" UNIQUE("tropa_id","garron")
);
--> statement-breakpoint
ALTER TABLE "tropas" ADD CONSTRAINT "tropas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tropas" ADD CONSTRAINT "tropas_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_tropa_id_tropas_id_fk" FOREIGN KEY ("tropa_id") REFERENCES "public"."tropas"("id") ON DELETE restrict ON UPDATE no action;
