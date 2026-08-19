ALTER TYPE "public"."tipo_cargo" ADD VALUE 'cheque_rechazado';--> statement-breakpoint
ALTER TABLE "lineas_cobro" ADD COLUMN "banco_o_billetera" varchar(100);--> statement-breakpoint
ALTER TABLE "lineas_cobro" ADD COLUMN "remitente" varchar(150);
