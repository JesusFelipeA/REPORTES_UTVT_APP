export type Categoria =
  | 'computo'
  | 'iluminacion'
  | 'mobiliario'
  | 'internet'
  | 'electrica';
export type Estado = 'Pendiente' | 'En proceso' | 'Resuelto';
export type Rol = 'estudiante' | 'administrativo' | 'mantenimiento';

export const CATEGORIAS: { id: Categoria; nombre: string; corto: string }[] = [
  { id: 'computo', nombre: 'Equipo de cómputo', corto: 'Cómputo' },
  { id: 'iluminacion', nombre: 'Iluminación', corto: 'Iluminación' },
  { id: 'mobiliario', nombre: 'Mobiliario', corto: 'Mobiliario' },
  { id: 'internet', nombre: 'Conexión a internet', corto: 'Internet' },
  { id: 'electrica', nombre: 'Instalación eléctrica', corto: 'Eléctrica' },
];

export const ESTADOS: Estado[] = ['Pendiente', 'En proceso', 'Resuelto'];

export const nombreCategoria = (c: Categoria) =>
  CATEGORIAS.find(x => x.id === c)?.nombre ?? c;

export interface Reporte {
  id: number;
  usuario_id: string;
  categoria: Categoria;
  ubicacion: string;
  descripcion: string;
  foto_path: string | null;
  latitud?: number | null;
  longitud?: number | null;
  precision_m?: number | null;
  estado: Estado;
  creado_en: string;
  actualizado_en?: string;
}

export interface Foto {
  uri: string;
  base64: string;
  mimeType: string;
  fileSize?: number;
}

export interface NuevoReporte {
  categoria: Categoria | null;
  ubicacion: string;
  descripcion: string;
  foto: Foto | null;
  /** Coordenadas del dispositivo (solo si el usuario concede el permiso) */
  gps?: { lat: number; lng: number; precision: number } | null;
}

/** Reporte que no se pudo enviar y quedó guardado en el dispositivo */
export interface Borrador extends NuevoReporte {
  localId: string;
  guardadoEn: string;
}
