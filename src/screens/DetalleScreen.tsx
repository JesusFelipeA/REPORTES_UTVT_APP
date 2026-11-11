import {
  ArrowRight,
  Calendar,
  Check,
  FileText,
  Hash,
  ImageOff,
  Lock,
  MapPin,
  RefreshCw,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Aviso,
  Boton,
  C,
  Encabezado,
  ESTILO_ESTADO,
  EtiquetaEstado,
  fechaLarga,
  IconoCategoria,
  sombra,
} from '../components/ui';
import { cambiarEstado, urlFoto } from '../lib/api';
import { Estado, ESTADOS, nombreCategoria, Reporte, Rol } from '../lib/tipos';

interface Props {
  reporte: Reporte;
  rol: Rol;
  onVolver: () => void;
}

const SIGUIENTE: Record<Estado, Estado | null> = {
  Pendiente: 'En proceso',
  'En proceso': 'Resuelto',
  Resuelto: null,
};

export default function DetalleScreen({ reporte, rol, onVolver }: Props) {
  const [r, setR] = useState(reporte);
  const [url, setUrl] = useState<string | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState(!!reporte.foto_path);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!r.foto_path) return;
    urlFoto(r.foto_path)
      .then(setUrl)
      .finally(() => setCargandoFoto(false));
  }, [r.foto_path]);

  async function avanzar() {
    const sig = SIGUIENTE[r.estado];
    if (!sig) return;
    setGuardando(true);
    setError(null);
    try {
      setR(await cambiarEstado(r.id, sig));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  const sig = SIGUIENTE[r.estado];
  const indice = ESTADOS.indexOf(r.estado);

  return (
    <View style={{ flex: 1, backgroundColor: C.fondo }}>
      <Encabezado
        titulo={`Reporte #${r.id}`}
        subtitulo="Detalle y seguimiento"
        onVolver={onVolver}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {error && <Aviso tipo="error" texto={error} />}

        <View style={[s.card, sombra]}>
          <View style={s.titulo}>
            <IconoCategoria categoria={r.categoria} tam={52} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.cat}>{nombreCategoria(r.categoria)}</Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <EtiquetaEstado estado={r.estado} />
              </View>
            </View>
          </View>

          <Dato Icono={MapPin} k="Ubicación" v={r.ubicacion} />
          <Dato Icono={FileText} k="Descripción" v={r.descripcion} />
          <Dato
            Icono={Calendar}
            k="Fecha de registro"
            v={fechaLarga(r.creado_en)}
          />
          <Dato Icono={Hash} k="Folio" v={`#${r.id}`} ultimo />
        </View>

        <View style={[s.card, sombra]}>
          <Text style={s.cardTitulo}>Seguimiento</Text>
          {ESTADOS.map((e, i) => {
            const hecho = i <= indice;
            const actual = i === indice;
            const est = ESTILO_ESTADO[e];
            return (
              <View key={e} style={s.paso}>
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={[
                      s.punto,
                      hecho
                        ? { backgroundColor: est.color, borderColor: est.color }
                        : { backgroundColor: '#fff', borderColor: C.borde },
                    ]}
                  >
                    {hecho && <Check size={12} color="#fff" strokeWidth={3} />}
                  </View>
                  {i < ESTADOS.length - 1 && (
                    <View
                      style={[
                        s.linea,
                        { backgroundColor: i < indice ? est.color : C.borde },
                      ]}
                    />
                  )}
                </View>
                <View style={{ flex: 1, paddingBottom: 14 }}>
                  <Text
                    style={[
                      s.pasoTitulo,
                      !hecho && { color: C.tenue },
                      actual && { color: est.color },
                    ]}
                  >
                    {e}
                  </Text>
                  <Text style={s.pasoTxt}>
                    {e === 'Pendiente'
                      ? 'Reporte recibido por el servicio'
                      : e === 'En proceso'
                      ? 'Mantenimiento está atendiendo la falla'
                      : 'La falla fue solucionada'}
                  </Text>
                </View>
              </View>
            );
          })}
          {rol === 'mantenimiento' && sig && (
            <View style={{ marginTop: 4 }}>
              <Boton
                titulo={`Cambiar a "${sig}"`}
                Icono={sig === 'Resuelto' ? Check : ArrowRight}
                onPress={avanzar}
                cargando={guardando}
              />
            </View>
          )}
        </View>

        {r.foto_path && (
          <View style={[s.card, sombra, { padding: 0, overflow: 'hidden' }]}>
            <Text style={[s.cardTitulo, { padding: 16, paddingBottom: 12 }]}>
              Evidencia fotográfica
            </Text>
            {cargandoFoto ? (
              <View style={s.fotoCaja}>
                <ActivityIndicator color={C.primario} />
              </View>
            ) : url ? (
              <Image
                source={{ uri: url }}
                style={{ width: '100%', height: 260 }}
                resizeMode="cover"
              />
            ) : (
              <View style={s.fotoCaja}>
                <ImageOff size={28} color={C.tenue} />
                <Text style={{ color: C.suave, marginTop: 8 }}>
                  No se pudo cargar la fotografía
                </Text>
                <Pressable
                  onPress={() => {
                    setCargandoFoto(true);
                    urlFoto(r.foto_path!)
                      .then(setUrl)
                      .finally(() => setCargandoFoto(false));
                  }}
                  style={s.reintentar}
                >
                  <RefreshCw size={14} color={C.primario} />
                  <Text style={{ color: C.primario, fontWeight: '700' }}>
                    Reintentar
                  </Text>
                </Pressable>
              </View>
            )}
            <View style={s.nota}>
              <Lock size={13} color={C.suave} />
              <Text style={s.notaTxt}>
                Imagen privada · enlace temporal válido por 60 minutos
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Dato({
  Icono,
  k,
  v,
  ultimo,
}: {
  Icono: typeof MapPin;
  k: string;
  v: string;
  ultimo?: boolean;
}) {
  return (
    <View style={[s.dato, ultimo && { borderBottomWidth: 0 }]}>
      <View style={s.datoIcono}>
        <Icono size={17} color={C.primario} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.datoK}>{k}</Text>
        <Text style={s.datoV}>{v}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.tarjeta,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 14,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F4',
  },
  cat: { fontSize: 19, fontWeight: '800', color: C.texto },
  cardTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: C.texto,
    marginBottom: 14,
  },
  dato: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F4',
  },
  datoIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datoK: {
    fontSize: 11.5,
    color: C.suave,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  datoV: {
    fontSize: 15,
    color: C.texto,
    marginTop: 3,
    lineHeight: 21,
  },
  paso: { flexDirection: 'row', gap: 12 },
  punto: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linea: { width: 2, flex: 1, minHeight: 20, marginVertical: 2 },
  pasoTitulo: { fontSize: 14.5, fontWeight: '700', color: C.texto },
  pasoTxt: { fontSize: 12.5, color: C.suave, marginTop: 2 },
  fotoCaja: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  reintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  nota: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  notaTxt: { fontSize: 12, color: C.suave },
});
