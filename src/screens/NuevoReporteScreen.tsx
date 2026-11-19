import {
  Calendar,
  Camera,
  Check,
  FileText,
  Images,
  LocateFixed,
  MapPin,
  Navigation,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CameraOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Aviso,
  Boton,
  C,
  Campo,
  Encabezado,
  ESTILO_CATEGORIA,
  fechaLarga,
  Seccion,
  sombra,
} from '../components/ui';
import { ErrorConexion, guardarBorrador, registrarReporte } from '../lib/api';
import {
  abrirAjustes,
  asegurarPermiso,
  EstadoPermiso,
  obtenerUbicacion,
  permitido,
} from '../lib/permisos';
import { CATEGORIAS, Foto, NuevoReporte } from '../lib/tipos';
import { ErroresReporte, validarReporte } from '../lib/validacion';

interface Props {
  uid: string;
  onListo: (mensaje: string) => void;
  onCancelar: () => void;
}

export default function NuevoReporteScreen({
  uid,
  onListo,
  onCancelar,
}: Props) {
  const [form, setForm] = useState<NuevoReporte>({
    categoria: null,
    ubicacion: '',
    descripcion: '',
    foto: null,
    gps: null,
  });
  const [errores, setErrores] = useState<ErroresReporte>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [ahora] = useState(() => new Date().toISOString());
  const insets = useSafeAreaInsets();
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [avisoGps, setAvisoGps] = useState<{
    texto: string;
    estado?: EstadoPermiso;
  } | null>(null);
  const [avisoCamara, setAvisoCamara] = useState<EstadoPermiso | null>(null);

  const set = <K extends keyof NuevoReporte>(k: K, v: NuevoReporte[K]) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrores(e => ({ ...e, [k]: undefined }));
  };

  async function elegirFoto(origen: 'camara' | 'galeria') {
    if (origen === 'camara') {
      // Se pide justo antes de abrir la cámara, no al iniciar la app
      const estado = await asegurarPermiso('camara');
      if (!permitido(estado)) {
        setAvisoCamara(estado);
        return;
      }
      setAvisoCamara(null);
    }
    const opciones: CameraOptions = {
      mediaType: 'photo',
      includeBase64: true, // se sube como bytes a Supabase Storage
      quality: 0.6,
      maxWidth: 1600,
      maxHeight: 1600,
      saveToPhotos: false,
    };
    const res =
      origen === 'camara'
        ? await launchCamera(opciones)
        : await launchImageLibrary({ ...opciones, selectionLimit: 1 });
    if (res.didCancel) return;
    if (res.errorCode) {
      if (res.errorCode === 'permission') {
        setAvisoCamara('denegado');
        return;
      }
      Alert.alert(
        'No se pudo obtener la foto',
        res.errorCode === 'camera_unavailable'
          ? 'Cámara no disponible.'
          : 'Intenta de nuevo.',
      );
      return;
    }
    const a = res.assets?.[0];
    if (!a?.uri || !a.base64) return;
    const foto: Foto = {
      uri: a.uri,
      base64: a.base64,
      mimeType: a.type ?? 'image/jpeg',
      fileSize: a.fileSize,
    };
    set('foto', foto);
    const v = validarReporte({ ...form, foto });
    if (v.foto) setErrores(e => ({ ...e, foto: v.foto }));
  }

  async function usarUbicacion() {
    setAvisoGps(null);
    const estado = await asegurarPermiso('ubicacion');
    if (!permitido(estado)) {
      setAvisoGps({
        estado,
        texto:
          estado === 'bloqueado'
            ? 'El permiso de ubicación está desactivado. Puedes escribir la ubicación manualmente o activarlo en Ajustes.'
            : 'Sin permiso de ubicación. El reporte se puede enviar solo con la ubicación escrita.',
      });
      return;
    }
    setBuscandoGps(true);
    try {
      const c = await obtenerUbicacion(estado === 'concedido');
      set('gps', c);
      if (estado === 'aproximada')
        setAvisoGps({
          estado,
          texto:
            'Elegiste ubicación aproximada: las coordenadas tienen menor precisión.',
        });
    } catch (e: any) {
      setAvisoGps({ texto: e.message });
    } finally {
      setBuscandoGps(false);
    }
  }

  async function enviar() {
    if (enviando) return; // evita doble envío
    setErrorGeneral(null);
    const v = validarReporte(form);
    setErrores(v);
    if (Object.values(v).some(Boolean)) return;

    setEnviando(true);
    try {
      const r = await registrarReporte(uid, form);
      onListo(
        `Reporte #${r.id} registrado correctamente. Estado: ${r.estado}.`,
      );
    } catch (e: any) {
      if (e instanceof ErrorConexion) {
        await guardarBorrador(uid, form);
        onListo(
          'Sin conexión: tu reporte se guardó en el teléfono y se enviará al recuperar internet.',
        );
      } else {
        setErrorGeneral(e.message);
      }
    } finally {
      setEnviando(false);
    }
  }

  const kb = (n?: number) => (n ? `${(n / 1024 / 1024).toFixed(1)} MB` : '');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Encabezado
        titulo="Nuevo reporte"
        subtitulo="Describe la falla que encontraste"
        onVolver={onCancelar}
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {errorGeneral && <Aviso tipo="error" texto={errorGeneral} />}

        <Seccion paso={1} titulo="Tipo de problema">
          <View style={s.grid}>
            {CATEGORIAS.map(c => {
              const activo = form.categoria === c.id;
              const e = ESTILO_CATEGORIA[c.id];
              return (
                <Pressable
                  key={c.id}
                  onPress={() => set('categoria', c.id)}
                  style={[
                    s.cat,
                    activo && {
                      borderColor: e.color,
                      backgroundColor: e.fondo,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: activo }}
                >
                  <View
                    style={[
                      s.catIcono,
                      { backgroundColor: activo ? e.color : e.fondo },
                    ]}
                  >
                    <e.Icono
                      size={20}
                      color={activo ? '#fff' : e.color}
                      strokeWidth={2.2}
                    />
                  </View>
                  <Text
                    style={[s.catTxt, activo && { color: C.texto }]}
                    numberOfLines={2}
                  >
                    {c.nombre}
                  </Text>
                  {activo && (
                    <View style={[s.check, { backgroundColor: e.color }]}>
                      <Check size={11} color="#fff" strokeWidth={3.5} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          {errores.categoria && (
            <Text style={s.error}>{errores.categoria}</Text>
          )}
        </Seccion>

        <Seccion paso={2} titulo="Detalles">
          <Campo
            etiqueta="Ubicación"
            Icono={MapPin}
            placeholder="Ej. Edificio D, Laboratorio 3"
            value={form.ubicacion}
            onChangeText={t => set('ubicacion', t)}
            maxLength={120}
            error={errores.ubicacion}
          />
          <Text style={s.label}>Coordenadas GPS (opcional)</Text>
          {form.gps ? (
            <View style={s.gps}>
              <Navigation size={19} color={C.verde} />
              <View style={{ flex: 1 }}>
                <Text style={s.gpsTxt}>
                  {form.gps.lat}, {form.gps.lng}
                </Text>
                <Text style={s.fechaNota}>
                  Precisión aproximada: ±{form.gps.precision} m
                </Text>
              </View>
              <Pressable
                onPress={() => set('gps', null)}
                hitSlop={8}
                accessibilityLabel="Quitar coordenadas"
              >
                <Trash2 size={18} color={C.suave} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={usarUbicacion}
              disabled={buscandoGps}
              style={({ pressed }) => [s.gpsBtn, pressed && { opacity: 0.8 }]}
            >
              {buscandoGps ? (
                <ActivityIndicator color={C.primario} />
              ) : (
                <LocateFixed size={19} color={C.primario} />
              )}
              <Text style={s.gpsBtnTxt}>
                {buscandoGps
                  ? 'Obteniendo ubicación…'
                  : 'Usar mi ubicación actual'}
              </Text>
            </Pressable>
          )}
          {errores.gps ? <Text style={s.error}>{errores.gps}</Text> : null}
          {avisoGps && (
            <View style={{ marginTop: 10 }}>
              <Aviso
                tipo={avisoGps.estado === 'aproximada' ? 'info' : 'alerta'}
                texto={avisoGps.texto}
                accion={
                  avisoGps.estado === 'bloqueado' ||
                  avisoGps.estado === 'revocado'
                    ? 'Ajustes'
                    : undefined
                }
                onAccion={abrirAjustes}
              />
            </View>
          )}
          <View style={{ height: 16 }} />
          <Campo
            etiqueta="Descripción del problema"
            Icono={FileText}
            placeholder="¿Qué ocurre? ¿Desde cuándo? ¿A quién afecta?"
            value={form.descripcion}
            onChangeText={t => set('descripcion', t)}
            multiline
            maxLength={500}
            style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: 0 }}
            error={errores.descripcion}
            ayuda={`${
              form.descripcion.trim().length
            }/500 caracteres · mínimo 10`}
          />
          <Text style={s.label}>Fecha de registro</Text>
          <View style={s.fecha}>
            <Calendar size={19} color={C.primario} />
            <View style={{ flex: 1 }}>
              <Text style={s.fechaTxt}>
                {fechaLarga(ahora).replace(/^./, c => c.toUpperCase())}
              </Text>
              <Text style={s.fechaNota}>
                El servidor registra la fecha oficial al enviar
              </Text>
            </View>
          </View>
        </Seccion>

        <Seccion paso={3} titulo="Evidencia fotográfica (opcional)">
          {form.foto ? (
            <View style={s.fotoCaja}>
              <Image source={{ uri: form.foto.uri }} style={s.foto} />
              <View style={s.fotoBarra}>
                <Text style={s.fotoInfo}>
                  {form.foto.mimeType === 'image/png' ? 'PNG' : 'JPG'}{' '}
                  {kb(form.foto.fileSize)}
                </Text>
                <Pressable
                  onPress={() => set('foto', null)}
                  style={s.quitar}
                  hitSlop={6}
                >
                  <Trash2 size={15} color="#fff" />
                  <Text style={s.quitarTxt}>Quitar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={s.fotoVacia}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  style={s.fotoBtn}
                  onPress={() => elegirFoto('camara')}
                >
                  <Camera size={24} color={C.primario} strokeWidth={2} />
                  <Text style={s.fotoBtnTxt}>Tomar foto</Text>
                </Pressable>
                <Pressable
                  style={s.fotoBtn}
                  onPress={() => elegirFoto('galeria')}
                >
                  <Images size={24} color={C.primario} strokeWidth={2} />
                  <Text style={s.fotoBtnTxt}>Galería</Text>
                </Pressable>
              </View>
            </View>
          )}
          {avisoCamara && (
            <View style={{ marginTop: 12 }}>
              <Aviso
                tipo="alerta"
                texto={
                  avisoCamara === 'bloqueado'
                    ? 'El permiso de cámara está desactivado. Actívalo en Ajustes o adjunta una foto desde la galería.'
                    : 'Sin permiso de cámara. Puedes adjuntar una foto desde la galería, que no requiere permiso.'
                }
                accion={avisoCamara === 'bloqueado' ? 'Ajustes' : undefined}
                onAccion={abrirAjustes}
              />
            </View>
          )}
          {errores.foto ? (
            <Text style={s.error}>{errores.foto}</Text>
          ) : (
            <View style={s.nota}>
              <ShieldCheck size={14} color={C.verde} />
              <Text style={s.notaTxt}>
                JPG o PNG hasta 5 MB · se guarda en almacenamiento privado
              </Text>
            </View>
          )}
        </Seccion>
      </ScrollView>

      <View style={[s.barra, sombra, { paddingBottom: insets.bottom + 12 }]}>
        <Boton
          titulo="Enviar reporte"
          Icono={Send}
          onPress={enviar}
          cargando={enviando}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cat: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: C.borde,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    backgroundColor: '#fff',
  },
  catIcono: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTxt: { fontSize: 13.5, fontWeight: '600', color: '#374151' },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: C.texto, marginBottom: 7 },
  fecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.primarioSuave,
    borderRadius: 14,
    padding: 12,
  },
  fechaTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: C.texto,
  },
  fechaNota: { fontSize: 12, color: C.suave, marginTop: 2 },
  error: { color: C.rojo, fontSize: 12.5, marginTop: 10 },
  gps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.verdeSuave,
    borderRadius: 14,
    padding: 12,
  },
  gpsTxt: { fontSize: 14.5, fontWeight: '700', color: C.texto },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C9D5EA',
    backgroundColor: '#FAFBFE',
  },
  gpsBtnTxt: { color: C.primario, fontWeight: '700', fontSize: 14.5 },
  fotoVacia: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C9D5EA',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#FAFBFE',
  },
  fotoBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.borde,
  },
  fotoBtnTxt: { color: C.primario, fontWeight: '700', fontSize: 13.5 },
  fotoCaja: { borderRadius: 16, overflow: 'hidden' },
  foto: { width: '100%', height: 220, backgroundColor: C.borde },
  fotoBarra: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(17,24,39,0.55)',
  },
  fotoInfo: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
  quitar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(220,38,38,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  quitarTxt: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  nota: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  notaTxt: { color: C.suave, fontSize: 12, flex: 1 },
  barra: {
    backgroundColor: C.tarjeta,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
