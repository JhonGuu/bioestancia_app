CREATE TYPE "public"."estado_civil" AS ENUM('soltero', 'casado', 'divorciado', 'viudo', 'union_convivencial');--> statement-breakpoint
CREATE TYPE "public"."modalidad_trabajo" AS ENUM('presencial', 'teletrabajo', 'hibrido');--> statement-breakpoint
CREATE TYPE "public"."tipo_contrato" AS ENUM('tiempo_indeterminado', 'plazo_fijo', 'eventual', 'temporada', 'pasantia');--> statement-breakpoint
CREATE TABLE "cargos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"tolerancia_minutos" integer,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "empleados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"apellido" varchar(100) NOT NULL,
	"dni" varchar(20) NOT NULL,
	"dni_archivo_path" varchar(500),
	"cuil" varchar(20),
	"domicilio" varchar(255),
	"telefono" varchar(50),
	"fecha_nacimiento" date,
	"estado_civil" "estado_civil",
	"contacto_emergencia_nombre" varchar(150),
	"contacto_emergencia_telefono" varchar(50),
	"fecha_ingreso" date NOT NULL,
	"cargo_id" uuid,
	"categoria_profesional" varchar(150),
	"convenio_colectivo" varchar(100),
	"tipo_contrato" "tipo_contrato",
	"modalidad" "modalidad_trabajo",
	"lugar_prestacion_tareas" varchar(255),
	"datos_bancarios" varchar(100),
	"nombre_dispositivo" varchar(100),
	"tolerancia_minutos" integer,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "horarios_empleado" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empleado_id" uuid NOT NULL,
	"dia_semana" smallint NOT NULL,
	"hora_entrada" time,
	"hora_salida" time,
	CONSTRAINT "horarios_empleado_empleado_dia_unique" UNIQUE("empleado_id","dia_semana")
);
--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "tolerancia_tardanza_minutos" integer;--> statement-breakpoint
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_cargo_id_cargos_id_fk" FOREIGN KEY ("cargo_id") REFERENCES "public"."cargos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horarios_empleado" ADD CONSTRAINT "horarios_empleado_empleado_id_empleados_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."empleados"("id") ON DELETE cascade ON UPDATE no action;