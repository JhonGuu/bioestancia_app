CREATE TABLE "compra_categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compra_id" uuid NOT NULL,
	"categoria" varchar(100) NOT NULL,
	"raza" varchar(100),
	"cabezas" integer NOT NULL,
	"peso_bruto" numeric(10, 2) NOT NULL,
	"peso_neto" numeric(10, 2) NOT NULL,
	"kg_vivo_faena" numeric(10, 2),
	"kg_carne" numeric(10, 2),
	"porcentaje_magro" numeric(5, 2),
	"destino_comercial" varchar(10),
	"cuartos_delantero" integer,
	"cuartos_trasero" integer,
	"precio_kg" numeric(12, 2),
	"importe_bruto" numeric(14, 2),
	"porcentaje_iva" numeric(5, 2),
	"importe_iva" numeric(14, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compra_categorias" ADD CONSTRAINT "compra_categorias_compra_id_compras_id_fk" FOREIGN KEY ("compra_id") REFERENCES "public"."compras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Migra los datos existentes de "compras" (escalares) a una línea única de
-- compra_categorias ANTES de dropear esas columnas — preserva compras que ya
-- se hayan cargado con las migraciones 0004/0005. Queda marcada "Sin
-- categorizar"; si hace falta separar por categoría real, se corrige a mano.
INSERT INTO "compra_categorias" ("compra_id", "categoria", "cabezas", "peso_bruto", "peso_neto")
SELECT "id", 'Sin categorizar', "cantidad_animales", "peso_bruto", "peso_neto" FROM "compras";
--> statement-breakpoint
ALTER TABLE "compras" DROP COLUMN "cantidad_animales";--> statement-breakpoint
ALTER TABLE "compras" DROP COLUMN "peso_bruto";--> statement-breakpoint
ALTER TABLE "compras" DROP COLUMN "peso_neto";--> statement-breakpoint
CREATE TABLE "resultado_faena" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"compra_id" uuid NOT NULL,
	"fecha_faena" timestamp NOT NULL,
	"numero" varchar(50),
	"numero_autorizacion" varchar(50),
	"kg_vivo_total" numeric(10, 2) NOT NULL,
	"kg_carne_total" numeric(10, 2) NOT NULL,
	"comisos_kg" numeric(10, 2) DEFAULT '0' NOT NULL,
	"comisos_cabezas" integer DEFAULT 0 NOT NULL,
	"rendimiento" numeric(5, 2) NOT NULL,
	"comentarios" varchar(255),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "resultado_faena_compra_unique" UNIQUE("compra_id")
);
--> statement-breakpoint
ALTER TABLE "resultado_faena" ADD CONSTRAINT "resultado_faena_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultado_faena" ADD CONSTRAINT "resultado_faena_compra_id_compras_id_fk" FOREIGN KEY ("compra_id") REFERENCES "public"."compras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "liquidacion_compra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"compra_id" uuid NOT NULL,
	"numero_comprobante" varchar(30) NOT NULL,
	"fecha" timestamp NOT NULL,
	"fecha_operacion" timestamp,
	"cae" varchar(20),
	"fecha_vencimiento_cae" timestamp,
	"importe_bruto" numeric(14, 2) NOT NULL,
	"iva_sobre_bruto" numeric(14, 2) NOT NULL,
	"total_gastos" numeric(14, 2),
	"iva_sobre_gastos" numeric(14, 2),
	"total_tributos" numeric(14, 2),
	"importe_neto" numeric(14, 2) NOT NULL,
	"comentarios" varchar(255),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "liquidacion_compra_compra_unique" UNIQUE("compra_id")
);
--> statement-breakpoint
ALTER TABLE "liquidacion_compra" ADD CONSTRAINT "liquidacion_compra_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquidacion_compra" ADD CONSTRAINT "liquidacion_compra_compra_id_compras_id_fk" FOREIGN KEY ("compra_id") REFERENCES "public"."compras"("id") ON DELETE cascade ON UPDATE no action;
