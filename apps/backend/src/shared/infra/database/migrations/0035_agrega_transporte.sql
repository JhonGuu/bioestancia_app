CREATE TYPE "public"."tipo_vehiculo" AS ENUM('camion', 'jaula', 'acoplado', 'semi', 'utilitario', 'otro');--> statement-breakpoint
CREATE TABLE "choferes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"transportista_id" uuid,
	"nombre" varchar(100) NOT NULL,
	"apellido" varchar(100) NOT NULL,
	"cuit" varchar(11) NOT NULL,
	"dni" varchar(20),
	"telefono" varchar(30),
	"licencia_vencimiento" date,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "choferes_empresa_cuit_unique" UNIQUE("empresa_id","cuit")
);
--> statement-breakpoint
CREATE TABLE "cliente_choferes" (
	"cliente_id" uuid NOT NULL,
	"chofer_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cliente_choferes_cliente_id_chofer_id_pk" PRIMARY KEY("cliente_id","chofer_id")
);
--> statement-breakpoint
CREATE TABLE "cliente_vehiculos" (
	"cliente_id" uuid NOT NULL,
	"vehiculo_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cliente_vehiculos_cliente_id_vehiculo_id_pk" PRIMARY KEY("cliente_id","vehiculo_id")
);
--> statement-breakpoint
CREATE TABLE "transportistas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"cuit" varchar(11) NOT NULL,
	"telefono" varchar(30),
	"es_propio" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "transportistas_empresa_cuit_unique" UNIQUE("empresa_id","cuit")
);
--> statement-breakpoint
CREATE TABLE "vehiculos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"transportista_id" uuid,
	"tipo" "tipo_vehiculo" NOT NULL,
	"patente" varchar(10) NOT NULL,
	"descripcion" varchar(255),
	"rto_vencimiento" date,
	"seguro_vencimiento" date,
	"habilitacion_animales_vencimiento" date,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "vehiculos_empresa_patente_unique" UNIQUE("empresa_id","patente")
);
--> statement-breakpoint
ALTER TABLE "choferes" ADD CONSTRAINT "choferes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "choferes" ADD CONSTRAINT "choferes_transportista_id_transportistas_id_fk" FOREIGN KEY ("transportista_id") REFERENCES "public"."transportistas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliente_choferes" ADD CONSTRAINT "cliente_choferes_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliente_choferes" ADD CONSTRAINT "cliente_choferes_chofer_id_choferes_id_fk" FOREIGN KEY ("chofer_id") REFERENCES "public"."choferes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliente_vehiculos" ADD CONSTRAINT "cliente_vehiculos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliente_vehiculos" ADD CONSTRAINT "cliente_vehiculos_vehiculo_id_vehiculos_id_fk" FOREIGN KEY ("vehiculo_id") REFERENCES "public"."vehiculos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transportistas" ADD CONSTRAINT "transportistas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_transportista_id_transportistas_id_fk" FOREIGN KEY ("transportista_id") REFERENCES "public"."transportistas"("id") ON DELETE set null ON UPDATE no action;