import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

/**
 * Permisos peligrosos (runtime) que usa la app.
 * Solo se piden en el momento en que el usuario usa la función.
 */
export type Permiso = 'camara' | 'ubicacion';

export type EstadoPermiso =
  | 'no_solicitado' // nunca se ha pedido
  | 'concedido' // permitido (en ubicación: precisa)
  | 'aproximada' // ubicación: el usuario eligió "aproximada" (Android 12+)
  | 'denegado' // rechazado, se puede volver a pedir
  | 'bloqueado' // rechazado con "No volver a preguntar": solo desde Ajustes
  | 'revocado'; // estaba concedido y el usuario lo quitó en Ajustes

const P = PermissionsAndroid.PERMISSIONS;
const R = PermissionsAndroid.RESULTS;

const CLAVE = (p: Permiso) => `permiso_${p}`;

/** Texto que Android muestra si el usuario ya rechazó una vez. */
const EXPLICACION: Record<Permiso, { title: string; message: string }> = {
  camara: {
    title: 'Permitir uso de la cámara',
    message:
      'Reportes UTVT usa la cámara solo para tomar la foto de evidencia del reporte. Si no la permites, puedes adjuntar una foto desde la galería.',
  },
  ubicacion: {
    title: 'Permitir acceso a la ubicación',
    message:
      'Reportes UTVT usa tu ubicación solo al registrar un reporte, para que mantenimiento encuentre el lugar de la falla. No se rastrea en segundo plano.',
  },
};

// La app gestiona los permisos; la librería no debe pedirlos por su cuenta.
Geolocation.setRNConfiguration({
  skipPermissionRequests: true,
  authorizationLevel: 'whenInUse',
  locationProvider: 'android', // sin depender de Google Play Services
});

async function guardar(p: Permiso, e: EstadoPermiso) {
  try {
    await AsyncStorage.setItem(CLAVE(p), e);
  } catch {}
}

async function ultimo(p: Permiso): Promise<EstadoPermiso | null> {
  try {
    return (await AsyncStorage.getItem(CLAVE(p))) as EstadoPermiso | null;
  } catch {
    return null;
  }
}

/** Consulta el estado actual SIN mostrar ningún diálogo. */
export async function estadoPermiso(p: Permiso): Promise<EstadoPermiso> {
  const previo = await ultimo(p);
  if (Platform.OS !== 'android') return previo ?? 'no_solicitado';

  if (p === 'camara') {
    if (await PermissionsAndroid.check(P.CAMERA)) return 'concedido';
  } else {
    if (await PermissionsAndroid.check(P.ACCESS_FINE_LOCATION))
      return 'concedido';
    if (await PermissionsAndroid.check(P.ACCESS_COARSE_LOCATION))
      return 'aproximada';
  }
  // No está concedido: se distingue por lo que ocurrió la última vez
  if (previo === 'concedido' || previo === 'aproximada') return 'revocado';
  if (previo === 'bloqueado') return 'bloqueado';
  if (previo === 'denegado' || previo === 'revocado') return 'denegado';
  return 'no_solicitado';
}

/** Muestra el diálogo del sistema y devuelve el nuevo estado. */
export async function solicitarPermiso(p: Permiso): Promise<EstadoPermiso> {
  let estado: EstadoPermiso;

  if (Platform.OS === 'android') {
    if (p === 'camara') {
      const r = await PermissionsAndroid.request(P.CAMERA, {
        ...EXPLICACION.camara,
        buttonPositive: 'Continuar',
      });
      estado =
        r === R.GRANTED
          ? 'concedido'
          : r === R.NEVER_ASK_AGAIN
          ? 'bloqueado'
          : 'denegado';
    } else {
      // Se piden ambos: Android 12+ deja elegir "precisa" o "aproximada"
      const r = await PermissionsAndroid.requestMultiple([
        P.ACCESS_FINE_LOCATION,
        P.ACCESS_COARSE_LOCATION,
      ]);
      const fina = r[P.ACCESS_FINE_LOCATION];
      const gruesa = r[P.ACCESS_COARSE_LOCATION];
      estado =
        fina === R.GRANTED
          ? 'concedido'
          : gruesa === R.GRANTED
          ? 'aproximada'
          : fina === R.NEVER_ASK_AGAIN || gruesa === R.NEVER_ASK_AGAIN
          ? 'bloqueado'
          : 'denegado';
    }
  } else if (p === 'ubicacion') {
    // iOS: usa NSLocationWhenInUseUsageDescription de Info.plist
    estado = await new Promise<EstadoPermiso>(res =>
      Geolocation.requestAuthorization(
        () => res('concedido'),
        () => res('bloqueado'),
      ),
    );
  } else {
    // iOS cámara: el selector la pide con NSCameraUsageDescription
    estado = 'concedido';
  }

  await guardar(p, estado);
  return estado;
}

export const permitido = (e: EstadoPermiso) =>
  e === 'concedido' || e === 'aproximada';

export function abrirAjustes() {
  Linking.openSettings().catch(() =>
    Alert.alert('No se pudo abrir Ajustes', 'Ábrelos manualmente.'),
  );
}

/**
 * Flujo completo antes de usar un recurso:
 * concedido → continúa · bloqueado/revocado → ofrece ir a Ajustes · otro → pide permiso.
 */
export async function asegurarPermiso(p: Permiso): Promise<EstadoPermiso> {
  const actual = await estadoPermiso(p);
  if (permitido(actual)) return actual;

  if (actual === 'bloqueado') {
    Alert.alert(
      p === 'camara'
        ? 'Permiso de cámara desactivado'
        : 'Permiso de ubicación desactivado',
      'Lo rechazaste anteriormente. Para usar esta función, actívalo en Ajustes > Permisos de Reportes UTVT.',
      [
        { text: 'Ahora no', style: 'cancel' },
        { text: 'Abrir Ajustes', onPress: abrirAjustes },
      ],
    );
    return actual;
  }
  return solicitarPermiso(p);
}

// ---------------------------------------------------------------- Ubicación
export interface Coordenadas {
  lat: number;
  lng: number;
  precision: number; // metros
}

export function obtenerUbicacion(precisa: boolean): Promise<Coordenadas> {
  return new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(
      pos =>
        resolve({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          precision: Math.round(pos.coords.accuracy),
        }),
      err =>
        reject(
          new Error(
            err.code === 1
              ? 'No hay permiso de ubicación.'
              : err.code === 2
              ? 'Ubicación no disponible. Activa el GPS del teléfono.'
              : 'No se obtuvo la ubicación a tiempo. Intenta de nuevo.',
          ),
        ),
      { enableHighAccuracy: precisa, timeout: 20000, maximumAge: 60000 },
    ),
  );
}
