import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';
import { supabase } from './supabase';
import { Borrador, Estado, NuevoReporte, Reporte, Rol } from './tipos';
import { limpiar } from './validacion';

/** UUID v4 usando el generador seguro (react-native-get-random-values). */
function uuid(): string {
  const b = new Uint8Array(16);
  (globalThis as any).crypto.getRandomValues(b); // polyfill seguro de react-native-get-random-values
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(
    16,
    20,
  )}-${h.slice(20)}`;
}

const TIEMPO_MAX_MS = 15000;
const BUCKET = 'evidencias';

/** Error que indica que el servicio no está disponible (sin red, timeout o 5xx). */
export class ErrorConexion extends Error {
  constructor(
    msg = 'No fue posible conectar con el servicio. Revisa tu conexión e intenta de nuevo.',
  ) {
    super(msg);
    this.name = 'ErrorConexion';
  }
}

/**
 * Verifica conectividad con una solicitud ligera al servicio de autenticación.
 * Cualquier respuesta HTTP indica que hay red; un fallo o timeout indica que no.
 */
export async function hayInternet(ms = 5000): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      signal: ctrl.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function conTiempo<T>(p: PromiseLike<T>, ms = TIEMPO_MAX_MS): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rej) => {
    t = setTimeout(
      () => rej(new ErrorConexion('El servicio tardó demasiado en responder.')),
      ms,
    );
  });
  try {
    return await Promise.race([Promise.resolve(p), limite]);
  } finally {
    clearTimeout(t);
  }
}

function esErrorDeRed(err: any): boolean {
  const msg = String(err?.message ?? '').toLowerCase();
  const status = Number(err?.status ?? err?.statusCode ?? 0);
  return (
    err instanceof ErrorConexion ||
    msg.includes('network') ||
    msg.includes('fetch') ||
    status >= 500
  );
}

async function exigirConexion() {
  if (!(await hayInternet()))
    throw new ErrorConexion('Sin conexión a internet.');
}

// ---------------------------------------------------------------- Autenticación
let intentosFallidos = 0;
let bloqueadoHasta = 0;

export async function iniciarSesion(correo: string, contrasena: string) {
  if (Date.now() < bloqueadoHasta) {
    const seg = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
    throw new Error(
      `Demasiados intentos. Espera ${seg} s para volver a intentar.`,
    );
  }
  await exigirConexion();
  const { data, error } = await conTiempo(
    supabase.auth.signInWithPassword({
      email: correo.trim().toLowerCase(),
      password: contrasena,
    }),
  );
  if (error) {
    if (esErrorDeRed(error)) throw new ErrorConexion();
    if (error.status === 429)
      throw new Error('Demasiados intentos. Intenta más tarde.');
    intentosFallidos++;
    if (intentosFallidos >= 5) {
      bloqueadoHasta = Date.now() + 60_000;
      intentosFallidos = 0;
    }
    // Mensaje genérico: no revela si el correo existe
    throw new Error('Correo o contraseña incorrectos.');
  }
  intentosFallidos = 0;
  return data.session;
}

export async function cerrarSesion(uid?: string) {
  if (uid)
    await AsyncStorage.multiRemove([claveCache(uid), claveBorradores(uid)]);
  await supabase.auth.signOut();
}

export async function obtenerRol(uid: string): Promise<Rol> {
  const { data } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', uid)
    .maybeSingle();
  return (data?.rol as Rol) ?? 'estudiante';
}

// ---------------------------------------------------------------- Reportes
const claveCache = (uid: string) => `cache_reportes_${uid}`;
const claveBorradores = (uid: string) => `borradores_${uid}`;

/** GET /rest/v1/reportes — RLS devuelve solo los reportes autorizados para el token. */
export async function listarReportes(
  uid: string,
): Promise<{ reportes: Reporte[]; desactualizado: boolean }> {
  try {
    await exigirConexion();
    const { data, error } = await conTiempo(
      supabase
        .from('reportes')
        .select('*')
        .order('creado_en', { ascending: false }),
    );
    if (error) throw error;
    await AsyncStorage.setItem(claveCache(uid), JSON.stringify(data));
    return { reportes: data as Reporte[], desactualizado: false };
  } catch (err) {
    if (!esErrorDeRed(err)) throw err;
    const cache = await AsyncStorage.getItem(claveCache(uid));
    if (cache) return { reportes: JSON.parse(cache), desactualizado: true };
    throw err instanceof ErrorConexion ? err : new ErrorConexion();
  }
}

/** Busca un reporte por folio. Si pertenece a otro usuario, RLS no lo devuelve. */
export async function buscarReporte(id: number): Promise<Reporte | null> {
  await exigirConexion();
  const { data, error } = await conTiempo(
    supabase.from('reportes').select('*').eq('id', id).maybeSingle(),
  );
  if (error) throw esErrorDeRed(error) ? new ErrorConexion() : error;
  return data as Reporte | null;
}

async function subirFoto(
  uid: string,
  base64: string,
  mimeType: string,
): Promise<string> {
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const ruta = `${uid}/${uuid()}.${ext}`;
  const bytes = decode(base64);
  const { error } = await conTiempo(
    supabase.storage
      .from(BUCKET)
      .upload(ruta, bytes, { contentType: mimeType, upsert: false }),
    30000,
  );
  if (error)
    throw esErrorDeRed(error)
      ? new ErrorConexion()
      : new Error('No se pudo subir la fotografía.');
  return ruta;
}

/** Sube la foto (si hay) y luego POST /rest/v1/reportes. */
export async function registrarReporte(
  uid: string,
  r: NuevoReporte,
): Promise<Reporte> {
  await exigirConexion();
  const foto_path = r.foto
    ? await subirFoto(uid, r.foto.base64, r.foto.mimeType)
    : null;
  const { data, error } = await conTiempo(
    supabase
      .from('reportes')
      .insert({
        categoria: r.categoria,
        ubicacion: limpiar(r.ubicacion),
        descripcion: limpiar(r.descripcion),
        foto_path,
        // usuario_id, fecha y estado los asigna el servidor
      })
      .select()
      .single(),
  );
  if (error) {
    if (esErrorDeRed(error)) throw new ErrorConexion();
    if (error.code === '23514')
      throw new Error('El servidor rechazó los datos del reporte.');
    throw new Error('No se pudo registrar el reporte.');
  }
  return data as Reporte;
}

export async function cambiarEstado(id: number, estado: Estado) {
  await exigirConexion();
  const { data, error } = await conTiempo(
    supabase
      .from('reportes')
      .update({ estado })
      .eq('id', id)
      .select()
      .maybeSingle(),
  );
  if (error)
    throw esErrorDeRed(error)
      ? new ErrorConexion()
      : new Error('No se pudo actualizar.');
  if (!data)
    throw new Error(
      'No tienes permiso para cambiar el estado de este reporte.',
    );
  return data as Reporte;
}

/** URL temporal (60 min) para ver la foto de un bucket privado. */
export async function urlFoto(ruta: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(ruta, 3600);
  return error ? null : data.signedUrl;
}

// ---------------------------------------------------------------- Borradores sin conexión
export async function leerBorradores(uid: string): Promise<Borrador[]> {
  const raw = await AsyncStorage.getItem(claveBorradores(uid));
  return raw ? JSON.parse(raw) : [];
}

export async function guardarBorrador(uid: string, r: NuevoReporte) {
  const lista = await leerBorradores(uid);
  lista.push({ ...r, localId: uuid(), guardadoEn: new Date().toISOString() });
  await AsyncStorage.setItem(claveBorradores(uid), JSON.stringify(lista));
}

/** Reintenta enviar los borradores; devuelve cuántos se enviaron. */
export async function enviarBorradores(uid: string): Promise<number> {
  const lista = await leerBorradores(uid);
  const pendientes: Borrador[] = [];
  let enviados = 0;
  for (const b of lista) {
    try {
      await registrarReporte(uid, b);
      enviados++;
    } catch {
      pendientes.push(b);
    }
  }
  await AsyncStorage.setItem(claveBorradores(uid), JSON.stringify(pendientes));
  return enviados;
}

export { esErrorDeRed };
