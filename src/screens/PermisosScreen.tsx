import {
  Camera,
  Globe,
  Images,
  LucideIcon,
  MapPin,
  MicOff,
  Settings,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aviso, C, Encabezado, sombra } from '../components/ui';
import {
  abrirAjustes,
  EstadoPermiso,
  estadoPermiso,
  Permiso,
  solicitarPermiso,
} from '../lib/permisos';

type Insignia = { texto: string; color: string; fondo: string };

const INSIGNIA: Record<EstadoPermiso, Insignia> = {
  concedido: { texto: 'Permitido', color: C.verde, fondo: C.verdeSuave },
  aproximada: { texto: 'Aproximada', color: C.azul, fondo: C.azulSuave },
  no_solicitado: { texto: 'Sin solicitar', color: C.suave, fondo: '#F3F4F6' },
  denegado: { texto: 'Denegado', color: C.ambar, fondo: C.ambarSuave },
  bloqueado: { texto: 'Bloqueado', color: C.rojo, fondo: C.rojoSuave },
  revocado: { texto: 'Revocado', color: C.rojo, fondo: C.rojoSuave },
};

const RUNTIME: {
  id: Permiso;
  Icono: LucideIcon;
  titulo: string;
  uso: string;
  android: string;
}[] = [
  {
    id: 'camara',
    Icono: Camera,
    titulo: 'Cámara',
    uso: 'Tomar la foto de evidencia al registrar un reporte.',
    android: 'android.permission.CAMERA',
  },
  {
    id: 'ubicacion',
    Icono: MapPin,
    titulo: 'Ubicación',
    uso: 'Agregar las coordenadas del lugar de la falla. Solo mientras usas la app.',
    android: 'ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION',
  },
];

const SIN_DIALOGO: {
  Icono: LucideIcon;
  titulo: string;
  uso: string;
  insignia: Insignia;
}[] = [
  {
    Icono: Images,
    titulo: 'Fotos de la galería',
    uso: 'Se usa el selector de fotos del sistema: la app solo recibe la imagen elegida, sin acceso a toda la galería.',
    insignia: { texto: 'No requerido', color: C.verde, fondo: C.verdeSuave },
  },
  {
    Icono: Globe,
    titulo: 'Internet',
    uso: 'Comunicación cifrada (HTTPS) con Supabase. Permiso normal concedido al instalar.',
    insignia: { texto: 'Al instalar', color: C.azul, fondo: C.azulSuave },
  },
  {
    Icono: MicOff,
    titulo: 'Micrófono',
    uso: 'La app no graba audio, por lo que no declara ni solicita este permiso.',
    insignia: { texto: 'No se usa', color: C.suave, fondo: '#F3F4F6' },
  },
];

export default function PermisosScreen({ onVolver }: { onVolver: () => void }) {
  const insets = useSafeAreaInsets();
  const [estados, setEstados] = useState<Record<Permiso, EstadoPermiso>>({
    camara: 'no_solicitado',
    ubicacion: 'no_solicitado',
  });

  const leer = useCallback(async () => {
    setEstados({
      camara: await estadoPermiso('camara'),
      ubicacion: await estadoPermiso('ubicacion'),
    });
  }, []);

  useEffect(() => {
    leer();
    // Al volver de Ajustes se vuelve a consultar (detecta permisos revocados)
    const sub = AppState.addEventListener('change', e => {
      if (e === 'active') leer();
    });
    return () => sub.remove();
  }, [leer]);

  async function pedir(p: Permiso) {
    const e = await solicitarPermiso(p);
    setEstados(x => ({ ...x, [p]: e }));
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.fondo }}>
      <Encabezado
        titulo="Permisos"
        subtitulo="Recursos del dispositivo que usa la app"
        onVolver={onVolver}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Aviso
          tipo="info"
          texto="Los permisos se piden solo cuando usas la función. Si rechazas uno, la app sigue funcionando sin ese recurso."
        />

        <Text style={s.grupo}>Requieren tu autorización</Text>
        {RUNTIME.map(r => {
          const e = estados[r.id];
          const ins = INSIGNIA[e];
          const aAjustes =
            e === 'bloqueado' ||
            e === 'revocado' ||
            e === 'concedido' ||
            e === 'aproximada';
          return (
            <View key={r.id} style={[s.card, sombra]}>
              <View style={s.fila}>
                <View style={s.icono}>
                  <r.Icono size={20} color={C.primario} strokeWidth={2.1} />
                </View>
                <Text style={s.titulo}>{r.titulo}</Text>
                <View style={[s.insignia, { backgroundColor: ins.fondo }]}>
                  <Text style={[s.insigniaTxt, { color: ins.color }]}>
                    {ins.texto}
                  </Text>
                </View>
              </View>
              <Text style={s.uso}>{r.uso}</Text>
              {Platform.OS === 'android' && (
                <Text style={s.tecnico}>{r.android}</Text>
              )}
              <Pressable
                onPress={() => (aAjustes ? abrirAjustes() : pedir(r.id))}
                style={({ pressed }) => [
                  s.boton,
                  aAjustes ? s.botonSec : s.botonPri,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {aAjustes && <Settings size={16} color={C.primario} />}
                <Text
                  style={[
                    s.botonTxt,
                    { color: aAjustes ? C.primario : '#fff' },
                  ]}
                >
                  {aAjustes
                    ? e === 'concedido' || e === 'aproximada'
                      ? 'Administrar en Ajustes'
                      : 'Activar en Ajustes'
                    : 'Solicitar permiso'}
                </Text>
              </Pressable>
            </View>
          );
        })}

        <Text style={s.grupo}>No requieren diálogo</Text>
        {SIN_DIALOGO.map(r => (
          <View key={r.titulo} style={[s.card, sombra]}>
            <View style={s.fila}>
              <View style={[s.icono, { backgroundColor: '#F3F4F6' }]}>
                <r.Icono size={20} color={C.suave} strokeWidth={2.1} />
              </View>
              <Text style={s.titulo}>{r.titulo}</Text>
              <View style={[s.insignia, { backgroundColor: r.insignia.fondo }]}>
                <Text style={[s.insigniaTxt, { color: r.insignia.color }]}>
                  {r.insignia.texto}
                </Text>
              </View>
            </View>
            <Text style={[s.uso, { marginBottom: 0 }]}>{r.uso}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  grupo: {
    color: C.suave,
    fontSize: 12.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 10,
    marginLeft: 2,
  },
  card: {
    backgroundColor: C.tarjeta,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icono: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: C.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { flex: 1, fontSize: 15.5, fontWeight: '700', color: C.texto },
  insignia: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  insigniaTxt: { fontSize: 11.5, fontWeight: '700' },
  uso: {
    color: '#374151',
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 10,
    marginBottom: 4,
  },
  tecnico: {
    color: C.tenue,
    fontSize: 11.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
  },
  boton: {
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  botonPri: { backgroundColor: C.primario },
  botonSec: { borderWidth: 1.5, borderColor: C.borde },
  botonTxt: { fontWeight: '700', fontSize: 14 },
});
