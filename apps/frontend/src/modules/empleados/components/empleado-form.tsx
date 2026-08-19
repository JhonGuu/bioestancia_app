import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCargos } from "@/modules/cargos/hooks/use-cargos";
import {
  createEmpleadoSchema,
  type CreateEmpleadoFormValues,
} from "@/modules/empleados/domain/empleado.schemas";
import {
  ESTADO_CIVIL_LABELS,
  MODALIDAD_TRABAJO_LABELS,
  TIPO_CONTRATO_LABELS,
} from "@/modules/empleados/domain/empleado-enum-labels";
import { EstadoCivil, ModalidadTrabajo, TipoContrato } from "@/modules/empleados/domain/empleado.types";
import type { Empleado } from "@/modules/empleados/domain/empleado.types";

interface EmpleadoFormProps {
  onSubmit: (values: CreateEmpleadoFormValues) => Promise<void>;
  isSubmitting?: boolean;
  /** Si viene, el form arranca precargado con sus datos (edición) en vez de vacío (alta). */
  empleado?: Empleado;
}

/** Sentinel para el `Select` de cargo/estado civil/etc — Radix no permite `value=""` en un `SelectItem`. */
const SIN_ASIGNAR = "sin-asignar";

export function EmpleadoForm({ onSubmit, isSubmitting, empleado }: EmpleadoFormProps) {
  const cargosQuery = useCargos();

  const form = useForm<CreateEmpleadoFormValues>({
    resolver: zodResolver(createEmpleadoSchema),
    defaultValues: {
      nombre: empleado?.nombre ?? "",
      apellido: empleado?.apellido ?? "",
      dni: empleado?.dni ?? "",
      cuil: empleado?.cuil ?? "",
      domicilio: empleado?.domicilio ?? "",
      telefono: empleado?.telefono ?? "",
      fechaNacimiento: empleado?.fechaNacimiento ?? "",
      estadoCivil: empleado?.estadoCivil ?? "",
      contactoEmergenciaNombre: empleado?.contactoEmergenciaNombre ?? "",
      contactoEmergenciaTelefono: empleado?.contactoEmergenciaTelefono ?? "",
      fechaIngreso: empleado?.fechaIngreso ?? "",
      cargoId: empleado?.cargoId ?? "",
      categoriaProfesional: empleado?.categoriaProfesional ?? "",
      convenioColectivo: empleado?.convenioColectivo ?? "",
      tipoContrato: empleado?.tipoContrato ?? "",
      modalidad: empleado?.modalidad ?? "",
      lugarPrestacionTareas: empleado?.lugarPrestacionTareas ?? "",
      datosBancarios: empleado?.datosBancarios ?? "",
      nombreDispositivo: empleado?.nombreDispositivo ?? "",
      toleranciaMinutos: empleado?.toleranciaMinutos != null ? String(empleado.toleranciaMinutos) : "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8">
        <div className="grid gap-4">
          <h3 className="text-sm font-semibold">Datos personales</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Juan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl>
                    <Input placeholder="30123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CUIL</FormLabel>
                  <FormControl>
                    <Input placeholder="20-30123456-3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fechaNacimiento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de nacimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="domicilio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domicilio</FormLabel>
                  <FormControl>
                    <Input placeholder="Calle 123, Tandil, Buenos Aires" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="011 4444-5555" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="estadoCivil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado civil</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === SIN_ASIGNAR ? "" : value)}
                  value={field.value || SIN_ASIGNAR}
                >
                  <FormControl>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={SIN_ASIGNAR}>Sin especificar</SelectItem>
                    {Object.values(EstadoCivil).map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {ESTADO_CIVIL_LABELS[valor]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contactoEmergenciaNombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contacto de emergencia</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre y apellido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactoEmergenciaTelefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono de emergencia</FormLabel>
                  <FormControl>
                    <Input placeholder="011 4444-5555" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <h3 className="text-sm font-semibold">Datos laborales</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fechaIngreso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de ingreso</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cargoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === SIN_ASIGNAR ? "" : value)}
                    value={field.value || SIN_ASIGNAR}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SIN_ASIGNAR}>Sin cargo asignado</SelectItem>
                      {(cargosQuery.data ?? []).map((cargo) => (
                        <SelectItem key={cargo.id} value={cargo.id}>
                          {cargo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="categoriaProfesional"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría profesional</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Operario calificado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="convenioColectivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Convenio colectivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. CCT 122/75" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="tipoContrato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de contrato</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === SIN_ASIGNAR ? "" : value)}
                    value={field.value || SIN_ASIGNAR}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SIN_ASIGNAR}>Sin especificar</SelectItem>
                      {Object.values(TipoContrato).map((valor) => (
                        <SelectItem key={valor} value={valor}>
                          {TIPO_CONTRATO_LABELS[valor]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modalidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidad</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === SIN_ASIGNAR ? "" : value)}
                    value={field.value || SIN_ASIGNAR}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SIN_ASIGNAR}>Sin especificar</SelectItem>
                      {Object.values(ModalidadTrabajo).map((valor) => (
                        <SelectItem key={valor} value={valor}>
                          {MODALIDAD_TRABAJO_LABELS[valor]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="lugarPrestacionTareas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lugar de prestación de tareas</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Establecimiento La Estancia, Tandil" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="datosBancarios"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Datos bancarios (CBU/alias)</FormLabel>
                <FormControl>
                  <Input placeholder="CBU o alias para el pago de haberes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4">
          <h3 className="text-sm font-semibold">Asistencia</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nombreDispositivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre en el dispositivo de fichaje</FormLabel>
                  <FormControl>
                    <Input placeholder="Tal como lo manda el lector de huellas" {...field} />
                  </FormControl>
                  <FormDescription>
                    Necesario para matchear los fichajes importados con este empleado.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toleranciaMinutos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tolerancia de tardanza (minutos)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={180}
                      placeholder="Ej. 10"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Opcional. Si no se completa, se usa la del cargo o, en su defecto, la de la empresa.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : empleado ? "Guardar cambios" : "Guardar empleado"}
        </Button>
      </form>
    </Form>
  );
}
