CREATE TYPE "public"."empresa_rubro" AS ENUM('frigorifico', 'revendedora');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'contable';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'veterinario';--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"razon_social" varchar(255) NOT NULL,
	"cuit" varchar(20),
	"rubro" "empresa_rubro" NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuario_empresas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"empresa_id" uuid NOT NULL,
	"rol" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuario_empresas_usuario_empresa_unique" UNIQUE("usuario_id","empresa_id")
);
--> statement-breakpoint
ALTER TABLE "usuario_empresas" ADD CONSTRAINT "usuario_empresas_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_empresas" ADD CONSTRAINT "usuario_empresas_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";