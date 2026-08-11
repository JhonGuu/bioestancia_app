ALTER TYPE "public"."user_role" ADD VALUE 'operario';--> statement-breakpoint
ALTER TABLE "ventas" ALTER COLUMN "precio_kg" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ventas" ALTER COLUMN "total" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "categoria" varchar(100);--> statement-breakpoint
ALTER TABLE "public"."ventas" ALTER COLUMN "forma_venta" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."forma_venta";--> statement-breakpoint
CREATE TYPE "public"."forma_venta" AS ENUM('cabeza', 'media_res', 'pulpa', 'compensacion_kg');--> statement-breakpoint
ALTER TABLE "public"."ventas" ALTER COLUMN "forma_venta" SET DATA TYPE "public"."forma_venta" USING "forma_venta"::"public"."forma_venta";