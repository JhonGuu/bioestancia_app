CREATE TYPE "public"."estado_cheque" AS ENUM('en_cartera', 'depositado', 'acreditado', 'rechazado', 'endosado_a_terceros');--> statement-breakpoint
CREATE TYPE "public"."medio_pago" AS ENUM('efectivo', 'transferencia_banco', 'billetera_virtual', 'cheque', 'echeq');--> statement-breakpoint
CREATE TABLE "cheques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"numero" varchar(50) NOT NULL,
	"banco" varchar(100) NOT NULL,
	"cuit_librador" varchar(20),
	"titular" varchar(150),
	"fecha_emision" timestamp NOT NULL,
	"fecha_pago" timestamp NOT NULL,
	"monto" numeric(14, 2) NOT NULL,
	"estado" "estado_cheque" DEFAULT 'en_cartera' NOT NULL,
	"fecha_ultimo_cambio_estado" timestamp DEFAULT now() NOT NULL,
	"motivo_rechazo" varchar(255),
	"comentarios" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aplicaciones_cobro" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cobro_id" uuid NOT NULL,
	"boleta_id" uuid NOT NULL,
	"monto" numeric(14, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cobros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"fecha" timestamp NOT NULL,
	"comentarios" varchar(255),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "lineas_cobro" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cobro_id" uuid NOT NULL,
	"medio_pago" "medio_pago" NOT NULL,
	"monto" numeric(14, 2) NOT NULL,
	"cheque_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cheques" ADD CONSTRAINT "cheques_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cheques" ADD CONSTRAINT "cheques_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aplicaciones_cobro" ADD CONSTRAINT "aplicaciones_cobro_cobro_id_cobros_id_fk" FOREIGN KEY ("cobro_id") REFERENCES "public"."cobros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aplicaciones_cobro" ADD CONSTRAINT "aplicaciones_cobro_boleta_id_boletas_id_fk" FOREIGN KEY ("boleta_id") REFERENCES "public"."boletas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobros" ADD CONSTRAINT "cobros_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobros" ADD CONSTRAINT "cobros_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineas_cobro" ADD CONSTRAINT "lineas_cobro_cobro_id_cobros_id_fk" FOREIGN KEY ("cobro_id") REFERENCES "public"."cobros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineas_cobro" ADD CONSTRAINT "lineas_cobro_cheque_id_cheques_id_fk" FOREIGN KEY ("cheque_id") REFERENCES "public"."cheques"("id") ON DELETE restrict ON UPDATE no action;