import path from "path";

/**
 * Isotipos de marca para usar en PDFs (encabezado de boleta, etc.). Son una
 * copia local de `apps/frontend/src/assets/brand/*-light.png` — el backend no
 * puede importar assets del frontend (son paquetes/bundlers distintos), así
 * que si el logo cambia en el frontend hay que volver a copiarlo acá.
 *
 * La variante "light" (fondo claro) es la que corresponde: el PDF imita el
 * papel físico, que es blanco.
 */
const ASSETS_DIR = path.resolve(__dirname, "assets");

interface BrandLogo {
  /** Ruta absoluta al PNG — para `doc.image(path, x, y, { width })`. */
  path: string;
  /** `width / height` del archivo original, para calcular el alto una vez fijado el ancho en el PDF. */
  aspectRatio: number;
}

const LOGOS: Record<"bioestancia" | "el-meridiano", BrandLogo> = {
  bioestancia: { path: path.join(ASSETS_DIR, "bioestancia-light.png"), aspectRatio: 828 / 210 },
  "el-meridiano": { path: path.join(ASSETS_DIR, "el-meridiano-light.png"), aspectRatio: 2047 / 965 },
};

/**
 * Elige el logo según la razón social de la empresa (mismo criterio que
 * `brandCompanyFromRazonSocial` en el frontend). Devuelve `null` si no
 * reconoce la empresa — el generador del PDF tiene que arreglárselas sin
 * logo en ese caso (empresa nueva sin isotipo cargado todavía).
 */
export function logoParaEmpresa(razonSocial: string): BrandLogo | null {
  const normalizado = razonSocial.toLowerCase();
  if (normalizado.includes("meridiano")) return LOGOS["el-meridiano"];
  if (normalizado.includes("bioestancia")) return LOGOS.bioestancia;
  return null;
}
