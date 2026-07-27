CREATE TABLE "proveedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nombre" varchar(100),
	"apellido" varchar(100),
	"razon_social" varchar(255),
	"cuit" varchar(20),
	"dni" varchar(20),
	"email" varchar(255),
	"domicilio" varchar(255),
	"pais" varchar(100),
	"provincia" varchar(100),
	"ubicacion" varchar(255),
	"condicion_fiscal" "condicion_fiscal" NOT NULL,
	"datos_bancarios" varchar(22),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;
