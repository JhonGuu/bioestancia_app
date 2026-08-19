ALTER TABLE "compras" ADD COLUMN "precio_compra_kg" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "resultado_faena" ADD COLUMN "frigorifico_id" uuid;--> statement-breakpoint
ALTER TABLE "resultado_faena" ADD CONSTRAINT "resultado_faena_frigorifico_id_frigorificos_id_fk" FOREIGN KEY ("frigorifico_id") REFERENCES "public"."frigorificos"("id") ON DELETE set null ON UPDATE no action;