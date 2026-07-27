ALTER TABLE "ventas" DROP CONSTRAINT "ventas_tropa_garron_unique";--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "porcentaje_desbaste" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "tropas" ADD COLUMN "dte" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "tropas" ADD COLUMN "remito" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "tropas" ADD COLUMN "cantidad_animales" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "tropas" ADD COLUMN "peso_bruto" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "tropas" ADD COLUMN "porcentaje_desbaste" numeric(5, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "tropas" ADD COLUMN "peso_neto" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "tropas" ADD COLUMN "cerrada" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tropas" ADD COLUMN "fecha_cierre" timestamp;--> statement-breakpoint
ALTER TABLE "tropas" ADD COLUMN "peso_final_venta" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "tropas" ADD COLUMN "rinde" numeric(5, 2);
