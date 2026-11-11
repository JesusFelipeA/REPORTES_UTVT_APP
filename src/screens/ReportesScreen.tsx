import {
  ChevronRight,
  CloudUpload,
  Hash,
  Image as IconoImagen,
  Inbox,
  LogOut,
  MapPin,
  Plus,
  Search,
  WifiOff,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Aviso,
  BotonIcono,
  C,
  Encabezado,
  ESTILO_ESTADO,
  EtiquetaEstado,
  fechaCorta,
  IconoCategoria,
  sombra,
} from '../components/ui';
import {
  buscarReporte,
  enviarBorradores,
  ErrorConexion,
  leerBorradores,
  hayInternet,
  listarReportes,
} from '../lib/api';
import { Estado, ESTADOS, nombreCategoria, Reporte, Rol } from '../lib/tipos';

const NOMBRE_ROL: Record<Rol, string> = {
  estudiante: 'Estudiante',
  administrativo: 'Administrativo',
  mantenimiento: 'Mantenimiento',
};

interface Props {
  uid: string;
  correo: string;
  rol: Rol;
  mensaje?: string | null;
  onNuevo: () => void;
  onAbrir: (r: Reporte) => void;
  onSalir: () => void;
}

export default function ReportesScreen({
  uid,
  correo,
  rol,
  mensaje,
  onNuevo,
  onAbrir,
  onSalir,
}: Props) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [desactualizado, setDesactualizado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borradores, setBorradores] = useState(0);
  const [aviso, setAviso] = useState<string | null>(mensaje ?? null);
  const [folio, setFolio] = useState('');
  const [filtro, setFiltro] = useState<Estado | 'Todos'>('Todos');
  const insets = useSafeAreaInsets();
  const [resultadoFolio, setResultadoFolio] = useState<{
    tipo: 'error' | 'info';
    texto: string;
  } | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const r = await listarReportes(uid);
      setReportes(r.reportes);
      setDesactualizado(r.desactualizado);
    } catch (e: any) {
      setError(
        e instanceof ErrorConexion
          ? e.message
          : 'No se pudieron cargar los reportes.',
      );
    }
    setBorradores((await leerBorradores(uid)).length);
  }, [uid]);

  const reintentarBorradores = useCallback(async () => {
    const n = await enviarBorradores(uid);
    if (n > 0) setAviso(`Se enviaron ${n} reporte(s) que estaban pendientes.`);
    await cargar();
  }, [uid, cargar]);

  useEffect(() => {
    cargar().finally(() => setCargando(false));
    // Si hay borradores pendientes, revisa la conexión cada 20 s y al volver a la app
    let enCurso = false;
    const revisar = async () => {
      if (enCurso) return;
      enCurso = true;
      try {
        if ((await leerBorradores(uid)).length > 0 && (await hayInternet())) {
          await reintentarBorradores();
        }
      } finally {
        enCurso = false;
      }
    };
    const intervalo = setInterval(revisar, 20000);
    const sub = AppState.addEventListener('change', e => {
      if (e === 'active') revisar();
    });
    return () => {
      clearInterval(intervalo);
      sub.remove();
    };
  }, [uid, cargar, reintentarBorradores]);

  async function refrescar() {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }

  async function buscarFolio() {
    setResultadoFolio(null);
    const id = Number(folio);
    if (!Number.isInteger(id) || id <= 0)
      return setResultadoFolio({
        tipo: 'error',
        texto: 'Escribe un folio numérico.',
      });
    try {
      const r = await buscarReporte(id);
      if (r) onAbrir(r);
      else
        setResultadoFolio({
          tipo: 'error',
          texto: `Reporte #${id} no encontrado o sin permiso para verlo.`,
        });
    } catch (e: any) {
      setResultadoFolio({ tipo: 'error', texto: e.message });
    }
  }

  const conteo = useMemo(() => {
    const c: Record<string, number> = { Todos: reportes.length };
    for (const e of ESTADOS) c[e] = reportes.filter(r => r.estado === e).length;
    return c;
  }, [reportes]);

  const visibles =
    filtro === 'Todos' ? reportes : reportes.filter(r => r.estado === filtro);
  const nombre = correo.split('@')[0];

  return (
    <View style={{ flex: 1, backgroundColor: C.fondo }}>
      <Encabezado
        subtitulo={`Hola, ${nombre} · ${NOMBRE_ROL[rol]}`}
        titulo={rol === 'mantenimiento' ? 'Todos los reportes' : 'Mis reportes'}
        derecha={
          <BotonIcono
            Icono={LogOut}
            etiqueta="Cerrar sesión"
            onPress={onSalir}
          />
        }
      >
        <View style={s.stats}>
          {(['Todos', ...ESTADOS] as const).map(e => {
            const activo = filtro === e;
            return (
              <Pressable
                key={e}
                onPress={() => setFiltro(e)}
                style={[s.stat, activo && s.statActivo]}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
              >
                <Text style={[s.statNum, activo && { color: C.primario }]}>
                  {conteo[e]}
                </Text>
                <Text
                  style={[s.statTxt, activo && { color: C.primario }]}
                  numberOfLines={1}
                >
                  {e === 'Todos' ? 'Total' : e}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Encabezado>

      <FlatList
        data={visibles}
        keyExtractor={r => String(r.id)}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 110,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            colors={[C.primario]}
            tintColor={C.primario}
          />
        }
        ListHeaderComponent={
          <>
            {aviso && (
              <Aviso tipo="ok" texto={aviso} onCerrar={() => setAviso(null)} />
            )}
            {error && (
              <Aviso
                tipo="error"
                Icono={WifiOff}
                texto={error}
                accion="Reintentar"
                onAccion={refrescar}
              />
            )}
            {desactualizado && (
              <Aviso
                tipo="alerta"
                Icono={WifiOff}
                texto="Sin conexión: se muestra la última información descargada."
                accion="Reintentar"
                onAccion={refrescar}
              />
            )}
            {borradores > 0 && (
              <Aviso
                tipo="info"
                Icono={CloudUpload}
                texto={`${borradores} reporte(s) guardado(s) en el teléfono, pendientes de envío.`}
                accion="Enviar"
                onAccion={reintentarBorradores}
              />
            )}

            <View style={[s.buscador, sombra]}>
              <Search size={18} color={C.tenue} />
              <TextInput
                value={folio}
                onChangeText={t => setFolio(t.replace(/[^0-9]/g, ''))}
                placeholder="Buscar reporte por folio"
                keyboardType="number-pad"
                style={s.buscInput}
                placeholderTextColor={C.tenue}
                returnKeyType="search"
                onSubmitEditing={buscarFolio}
              />
              {folio.length > 0 && (
                <Pressable onPress={buscarFolio} style={s.buscBtn}>
                  <Text style={s.buscBtnTxt}>Buscar</Text>
                </Pressable>
              )}
            </View>
            {resultadoFolio && (
              <Aviso
                tipo={resultadoFolio.tipo}
                texto={resultadoFolio.texto}
                onCerrar={() => setResultadoFolio(null)}
              />
            )}

            {visibles.length > 0 && (
              <Text style={s.contador}>
                {visibles.length}{' '}
                {visibles.length === 1 ? 'reporte' : 'reportes'}
                {filtro !== 'Todos' ? ` · ${filtro}` : ''}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator style={{ marginTop: 48 }} color={C.primario} />
          ) : !error ? (
            <View style={s.vacio}>
              <View style={s.vacioIcono}>
                <Inbox size={34} color={C.primario} strokeWidth={1.8} />
              </View>
              <Text style={s.vacioTitulo}>
                {filtro === 'Todos'
                  ? 'Aún no hay reportes'
                  : `Sin reportes "${filtro}"`}
              </Text>
              <Text style={s.vacioTxt}>
                Cuando detectes una falla en el campus, regístrala con el botón
                "Nuevo reporte".
              </Text>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onAbrir(item)}
            style={({ pressed }) => [
              s.card,
              sombra,
              { borderLeftColor: ESTILO_ESTADO[item.estado].color },
              pressed && { opacity: 0.85 },
            ]}
          >
            <IconoCategoria categoria={item.categoria} />
            <View style={{ flex: 1 }}>
              <View style={s.fila}>
                <Text style={s.cat} numberOfLines={1}>
                  {nombreCategoria(item.categoria)}
                </Text>
                <EtiquetaEstado estado={item.estado} />
              </View>
              <View style={s.ubicFila}>
                <MapPin size={13} color={C.suave} />
                <Text style={s.ubic} numberOfLines={1}>
                  {item.ubicacion}
                </Text>
              </View>
              <Text style={s.desc} numberOfLines={2}>
                {item.descripcion}
              </Text>
              <View style={s.meta}>
                <View style={s.metaItem}>
                  <Hash size={12} color={C.tenue} />
                  <Text style={s.metaTxt}>{item.id}</Text>
                </View>
                <Text style={s.metaTxt}>{fechaCorta(item.creado_en)}</Text>
                {item.foto_path ? (
                  <View style={s.metaItem}>
                    <IconoImagen size={12} color={C.tenue} />
                    <Text style={s.metaTxt}>Foto</Text>
                  </View>
                ) : null}
                <View style={{ flex: 1 }} />
                <ChevronRight size={16} color={C.tenue} />
              </View>
            </View>
          </Pressable>
        )}
      />

      <Pressable
        onPress={onNuevo}
        style={({ pressed }) => [
          s.fab,
          { bottom: insets.bottom + 24 },
          pressed && { transform: [{ scale: 0.97 }] },
        ]}
        accessibilityRole="button"
      >
        <Plus size={20} color="#fff" strokeWidth={2.6} />
        <Text style={s.fabTxt}>Nuevo reporte</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8, marginTop: 18 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statActivo: { backgroundColor: '#fff' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statTxt: { color: '#C7D6EE', fontSize: 11, fontWeight: '600', marginTop: 1 },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.tarjeta,
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 6,
    height: 50,
    marginBottom: 12,
  },
  buscInput: { flex: 1, color: C.texto, fontSize: 15 },
  buscBtn: {
    backgroundColor: C.primario,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 38,
    justifyContent: 'center',
  },
  buscBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
  contador: {
    color: C.suave,
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: C.tarjeta,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cat: { fontSize: 15.5, fontWeight: '700', color: C.texto, flex: 1 },
  ubicFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ubic: { color: C.suave, fontSize: 13, flex: 1 },
  desc: { color: '#374151', marginTop: 6, fontSize: 13.5, lineHeight: 19 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F2F4',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt: { color: C.tenue, fontSize: 12, fontWeight: '600' },
  vacio: { alignItems: 'center', marginTop: 40, paddingHorizontal: 30 },
  vacioIcono: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: C.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  vacioTitulo: { fontSize: 17, fontWeight: '700', color: C.texto },
  vacioTxt: {
    color: C.suave,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13.5,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primario,
    paddingHorizontal: 24,
    height: 56,
    borderRadius: 28,
    shadowColor: C.primario,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
