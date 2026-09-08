CREATE TABLE "usuario_empresa_permisos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_empresa_id" uuid NOT NULL,
	"permiso" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuario_empresa_permisos_usuario_empresa_permiso_unique" UNIQUE("usuario_empresa_id","permiso")
);
--> statement-breakpoint
ALTER TABLE "usuario_empresa_permisos" ADD CONSTRAINT "usuario_empresa_permisos_usuario_empresa_id_usuario_empresas_id_fk" FOREIGN KEY ("usuario_empresa_id") REFERENCES "public"."usuario_empresas"("id") ON DELETE cascade ON UPDATE no action;