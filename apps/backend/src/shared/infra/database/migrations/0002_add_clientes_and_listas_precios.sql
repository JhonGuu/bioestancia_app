CREATE TYPE "public"."condicion_fiscal" AS ENUM('responsable_inscripto', 'monotributo', 'consumidor_final', 'exento');--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"lista_de_precios_id" uuid,
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
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "listas_de_precios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" varchar(255),
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_lista_de_precios_id_listas_de_precios_id_fk" FOREIGN KEY ("lista_de_precios_id") REFERENCES "public"."listas_de_precios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listas_de_precios" ADD CONSTRAINT "listas_de_precios_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;
