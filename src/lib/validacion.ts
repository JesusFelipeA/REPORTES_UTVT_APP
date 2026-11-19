import { CATEGORIAS, NuevoReporte } from './tipos';

export const MAX_FOTO_BYTES = 5 * 1024 * 1024;
const TIPOS_FOTO = ['image/jpeg', 'image/png'];
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const limpiar = (t: string) =>
  t
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function validarLogin(
  correo: string,
  contrasena: string,
): string | null {
  if (!CORREO.test(correo.trim())) return 'Escribe un correo válido.';
  if (contrasena.length < 8)
    return 'La contraseña debe tener al menos 8 caracteres.';
  return null;
}

export type ErroresReporte = Partial<
  Record<'categoria' | 'ubicacion' | 'descripcion' | 'foto' | 'gps', string>
>;

/** Validaciones previas al envío (se repiten en el servidor con CHECK y RLS). */
export function validarReporte(r: NuevoReporte): ErroresReporte {
  const e: ErroresReporte = {};
  if (!r.categoria || !CATEGORIAS.some(c => c.id === r.categoria))
    e.categoria = 'Selecciona una categoría.';

  const ubic = limpiar(r.ubicacion);
  if (ubic.length < 3)
    e.ubicacion = 'Indica edificio y aula (mínimo 3 caracteres).';
  else if (ubic.length > 120) e.ubicacion = 'Máximo 120 caracteres.';

  const desc = limpiar(r.descripcion);
  if (desc.length < 10)
    e.descripcion = 'Describe el problema (mínimo 10 caracteres).';
  else if (desc.length > 500) e.descripcion = 'Máximo 500 caracteres.';

  if (r.foto) {
    if (!TIPOS_FOTO.includes(r.foto.mimeType))
      e.foto = 'Solo se aceptan imágenes JPG o PNG.';
    else if (r.foto.fileSize && r.foto.fileSize > MAX_FOTO_BYTES)
      e.foto = 'La foto supera 5 MB.';
  }
  if (r.gps) {
    const { lat, lng, precision } = r.gps;
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180 ||
      precision < 0
    )
      e.gps = 'Coordenadas inválidas.';
  }
  return e;
}
