CREATE TYPE "public"."estado_asiento" AS ENUM('borrador', 'confirmado', 'anulado');--> statement-breakpoint
CREATE TYPE "public"."estado_ejercicio" AS ENUM('abierto', 'cerrado');--> statement-breakpoint
CREATE TYPE "public"."estado_periodo" AS ENUM('abierto', 'cerrado');--> statement-breakpoint
CREATE TYPE "public"."respaldo_asiento" AS ENUM('con_comprobante', 'sin_comprobante', 'interno');--> statement-breakpoint
CREATE TYPE "public"."tipo_asiento" AS ENUM('manual', 'automatico', 'apertura', 'cierre', 'refundicion', 'ajuste_inflacion', 'reclasificacion');--> statement-breakpoint
CREATE TYPE "public"."tipo_auxiliar" AS ENUM('ninguno', 'cliente', 'proveedor', 'empleado', 'frigorifico', 'cuenta_fondos', 'cheque');--> statement-breakpoint
CREATE TYPE "public"."tipo_cuenta" AS ENUM('activo', 'pasivo', 'patrimonio_neto', 'resultado_positivo', 'resultado_negativo', 'orden');--> statement-breakpoint
CREATE TABLE "asiento_lineas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asiento_id" uuid NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"cuenta_id" uuid NOT NULL,
	"debe" numeric(16, 2) DEFAULT '0' NOT NULL,
	"haber" numeric(16, 2) DEFAULT '0' NOT NULL,
	"detalle" varchar(255),
	"auxiliar_tipo" varchar(30),
	"auxiliar_id" uuid,
	"fecha_origen" timestamp NOT NULL,
	"centro_costo_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asientos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"ejercicio_id" uuid NOT NULL,
	"periodo_id" uuid NOT NULL,
	"numero" integer,
	"fecha" timestamp NOT NULL,
	"tipo" "tipo_asiento" DEFAULT 'manual' NOT NULL,
	"estado" "estado_asiento" DEFAULT 'borrador' NOT NULL,
	"respaldo" "respaldo_asiento" DEFAULT 'sin_comprobante' NOT NULL,
	"descripcion" varchar(255) NOT NULL,
	"origen_tipo" varchar(50),
	"origen_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asientos_ejercicio_numero_unique" UNIQUE("ejercicio_id","numero")
);
--> statement-breakpoint
CREATE TABLE "centros_costo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "centros_costo_empresa_codigo_unique" UNIQUE("empresa_id","codigo")
);
--> statement-breakpoint
CREATE TABLE "ejercicios_contables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"numero" integer NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"fecha_inicio" timestamp NOT NULL,
	"fecha_fin" timestamp NOT NULL,
	"estado" "estado_ejercicio" DEFAULT 'abierto' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ejercicios_empresa_numero_unique" UNIQUE("empresa_id","numero")
);
--> statement-breakpoint
CREATE TABLE "periodos_contables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ejercicio_id" uuid NOT NULL,
	"anio" integer NOT NULL,
	"mes" integer NOT NULL,
	"estado" "estado_periodo" DEFAULT 'abierto' NOT NULL,
	"cerrado_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "periodos_ejercicio_anio_mes_unique" UNIQUE("ejercicio_id","anio","mes")
);
--> statement-breakpoint
CREATE TABLE "plan_cuentas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"tipo" "tipo_cuenta" NOT NULL,
	"parent_id" uuid,
	"imputable" boolean DEFAULT true NOT NULL,
	"monetaria" boolean DEFAULT false NOT NULL,
	"requiere_auxiliar" "tipo_auxiliar" DEFAULT 'ninguno' NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plan_cuentas_empresa_codigo_unique" UNIQUE("empresa_id","codigo")
);
--> statement-breakpoint
ALTER TABLE "asiento_lineas" ADD CONSTRAINT "asiento_lineas_asiento_id_asientos_id_fk" FOREIGN KEY ("asiento_id") REFERENCES "public"."asientos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asiento_lineas" ADD CONSTRAINT "asiento_lineas_cuenta_id_plan_cuentas_id_fk" FOREIGN KEY ("cuenta_id") REFERENCES "public"."plan_cuentas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asiento_lineas" ADD CONSTRAINT "asiento_lineas_centro_costo_id_centros_costo_id_fk" FOREIGN KEY ("centro_costo_id") REFERENCES "public"."centros_costo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asientos" ADD CONSTRAINT "asientos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asientos" ADD CONSTRAINT "asientos_ejercicio_id_ejercicios_contables_id_fk" FOREIGN KEY ("ejercicio_id") REFERENCES "public"."ejercicios_contables"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asientos" ADD CONSTRAINT "asientos_periodo_id_periodos_contables_id_fk" FOREIGN KEY ("periodo_id") REFERENCES "public"."periodos_contables"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centros_costo" ADD CONSTRAINT "centros_costo_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ejercicios_contables" ADD CONSTRAINT "ejercicios_contables_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periodos_contables" ADD CONSTRAINT "periodos_contables_ejercicio_id_ejercicios_contables_id_fk" FOREIGN KEY ("ejercicio_id") REFERENCES "public"."ejercicios_contables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_cuentas" ADD CONSTRAINT "plan_cuentas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asiento_lineas_asiento_idx" ON "asiento_lineas" USING btree ("asiento_id");--> statement-breakpoint
CREATE INDEX "asiento_lineas_cuenta_idx" ON "asiento_lineas" USING btree ("cuenta_id");--> statement-breakpoint
CREATE INDEX "asiento_lineas_auxiliar_idx" ON "asiento_lineas" USING btree ("auxiliar_tipo","auxiliar_id");--> statement-breakpoint
CREATE INDEX "asientos_empresa_fecha_idx" ON "asientos" USING btree ("empresa_id","fecha");--> statement-breakpoint
CREATE INDEX "asientos_periodo_idx" ON "asientos" USING btree ("periodo_id");--> statement-breakpoint
CREATE INDEX "asientos_origen_idx" ON "asientos" USING btree ("origen_tipo","origen_id");--> statement-breakpoint
CREATE INDEX "plan_cuentas_empresa_idx" ON "plan_cuentas" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX "plan_cuentas_parent_idx" ON "plan_cuentas" USING btree ("parent_id");