import { useRef } from "react";
import { Download, FileCheck2, FileX2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useDescargarDniEmpleado } from "@/modules/empleados/hooks/use-descargar-dni-empleado";
import { useSubirDniEmpleado } from "@/modules/empleados/hooks/use-subir-dni-empleado";
import { ApiError } from "@/shared/api/api-response";

const TIPOS_ACEPTADOS = "application/pdf,image/jpeg,image/png";

interface DniUploadProps {
  empleadoId: string;
  /** Si ya hay un archivo cargado — controla si se muestra "Ver documento" o solo "Subir". */
  tieneArchivo: boolean;
}

/** Sube/reemplaza y descarga la copia digitalizada del DNI (ver `SubirDniEmpleado`/`DescargarDniEmpleado` en el backend). */
export function DniUpload({ empleadoId, tieneArchivo }: DniUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const subirDni = useSubirDniEmpleado(empleadoId);
  const descargarDni = useDescargarDniEmpleado();

  function handleElegirArchivo() {
    inputRef.current?.click();
  }

  function handleArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    subirDni.mutate(archivo, {
      onSuccess: () => toast.success("Documento subido correctamente"),
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo subir el documento");
      },
    });
  }

  function handleVerDocumento() {
    descargarDni.mutate(empleadoId, {
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo descargar el documento");
      },
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        {tieneArchivo ? (
          <>
            <FileCheck2 className="text-primary size-4" />
            Documento cargado
          </>
        ) : (
          <>
            <FileX2 className="size-4" />
            Todavía no se cargó una copia del DNI
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={TIPOS_ACEPTADOS}
        className="hidden"
        onChange={handleArchivoSeleccionado}
      />

      {tieneArchivo && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleVerDocumento}
          disabled={descargarDni.isPending}
        >
          <Download className="size-4" />
          {descargarDni.isPending ? "Descargando..." : "Ver documento"}
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleElegirArchivo}
        disabled={subirDni.isPending}
      >
        <Upload className="size-4" />
        {subirDni.isPending ? "Subiendo..." : tieneArchivo ? "Reemplazar" : "Subir documento"}
      </Button>

      <span className="text-muted-foreground text-xs">PDF, JPG o PNG — máx. 10MB</span>
    </div>
  );
}
