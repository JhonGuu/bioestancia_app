ALTER TABLE "compra_categorias" ALTER COLUMN "peso_bruto" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "compra_categorias" ALTER COLUMN "peso_neto" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "compras" ADD COLUMN "peso_bruto" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "compras" ADD COLUMN "peso_neto" numeric(10, 2) NOT NULL;