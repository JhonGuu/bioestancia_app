import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { totalCabezas, type CompraCategoria } from "@/modules/compras/domain/compra.types";

/**
 * `pesoBruto`/`pesoNeto` por línea recién se completan al armar la
 * liquidación de compra (todavía sin frontend propio) — el peso de la
 * tropa entera, mientras tanto, se ve en la card "Datos generales" de la
 * página de detalle (`Compra.pesoBruto`/`pesoNeto`). Acá se muestra "—"
 * hasta que se discrimine por categoría. Las columnas de fase 2 (faena) y
 * fase 3 (liquidación) — kg vivo de faena, precio — tampoco tienen frontend
 * propio todavía: se muestran si ya vinieron cargadas (por API/Postman).
 */
export function CompraCategoriasTable({ categorias }: { categorias: CompraCategoria[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Categoría</TableHead>
          <TableHead>Raza</TableHead>
          <TableHead className="text-right">Cabezas</TableHead>
          <TableHead className="text-right">Peso bruto (kg)</TableHead>
          <TableHead className="text-right">Peso neto (kg)</TableHead>
          <TableHead className="text-right">Kg vivo faena</TableHead>
          <TableHead className="text-right">Precio/kg</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categorias.map((categoria) => (
          <TableRow key={categoria.id}>
            <TableCell className="font-medium">{categoria.categoria}</TableCell>
            <TableCell>{categoria.raza ?? "—"}</TableCell>
            <TableCell className="text-right">{categoria.cabezas}</TableCell>
            <TableCell className="text-right">{categoria.pesoBruto ?? "—"}</TableCell>
            <TableCell className="text-right">{categoria.pesoNeto ?? "—"}</TableCell>
            <TableCell className="text-right">{categoria.kgVivoFaena ?? "—"}</TableCell>
            <TableCell className="text-right">{categoria.precioKg ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell />
          <TableCell className="text-right">{totalCabezas(categorias)}</TableCell>
          <TableCell />
          <TableCell />
          <TableCell />
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
