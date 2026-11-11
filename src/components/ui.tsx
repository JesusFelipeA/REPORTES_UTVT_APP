import {
  Armchair,
  CircleAlert,
  CircleCheck,
  ChevronLeft,
  Clock,
  Eye,
  EyeOff,
  Info,
  LoaderCircle,
  LucideIcon,
  Monitor,
  Lightbulb,
  TriangleAlert,
  Wifi,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Categoria, Estado } from '../lib/tipos';

// ------------------------------------------------------------------ Tema
export const C = {
  primario: '#1E4E9C',
  primarioOscuro: '#14376F',
  primarioSuave: '#E8EFFA',
  fondo: '#F3F5F9',
  tarjeta: '#FFFFFF',
  texto: '#111827',
  suave: '#6B7280',
  tenue: '#9CA3AF',
  borde: '#E5E7EB',
  rojo: '#DC2626',
  rojoSuave: '#FEF2F2',
  verde: '#059669',
  verdeSuave: '#ECFDF5',
  ambar: '#D97706',
  ambarSuave: '#FFFBEB',
  azul: '#2563EB',
  azulSuave: '#EFF6FF',
};

export const sombra: ViewStyle = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

// ------------------------------------------------------------------ Categorías
export const ESTILO_CATEGORIA: Record<
  Categoria,
  { Icono: LucideIcon; color: string; fondo: string }
> = {
  computo: { Icono: Monitor, color: '#4F46E5', fondo: '#EEF2FF' },
  iluminacion: { Icono: Lightbulb, color: '#CA8A04', fondo: '#FEFCE8' },
  mobiliario: { Icono: Armchair, color: '#9333EA', fondo: '#FAF5FF' },
  internet: { Icono: Wifi, color: '#0891B2', fondo: '#ECFEFF' },
  electrica: { Icono: Zap, color: '#EA580C', fondo: '#FFF7ED' },
};

export function IconoCategoria({
  categoria,
  tam = 44,
}: {
  categoria: Categoria;
  tam?: number;
}) {
  const e = ESTILO_CATEGORIA[categoria];
  return (
    <View
      style={{
        width: tam,
        height: tam,
        borderRadius: tam * 0.3,
        backgroundColor: e.fondo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <e.Icono size={tam * 0.5} color={e.color} strokeWidth={2} />
    </View>
  );
}

// ------------------------------------------------------------------ Estados
export const ESTILO_ESTADO: Record<
  Estado,
  { Icono: LucideIcon; color: string; fondo: string }
> = {
  Pendiente: { Icono: Clock, color: C.ambar, fondo: C.ambarSuave },
  'En proceso': { Icono: LoaderCircle, color: C.azul, fondo: C.azulSuave },
  Resuelto: { Icono: CircleCheck, color: C.verde, fondo: C.verdeSuave },
};

export function EtiquetaEstado({ estado }: { estado: Estado }) {
  const e = ESTILO_ESTADO[estado];
  return (
    <View style={[s.etiqueta, { backgroundColor: e.fondo }]}>
      <e.Icono size={12} color={e.color} strokeWidth={2.5} />
      <Text style={[s.etiquetaTxt, { color: e.color }]}>{estado}</Text>
    </View>
  );
}

// ------------------------------------------------------------------ Botón
export function Boton(props: {
  titulo: string;
  onPress: () => void;
  cargando?: boolean;
  deshabilitado?: boolean;
  variante?: 'primario' | 'secundario' | 'peligro';
  Icono?: LucideIcon;
}) {
  const {
    titulo,
    onPress,
    cargando,
    deshabilitado,
    variante = 'primario',
    Icono,
  } = props;
  const inactivo = deshabilitado || cargando;
  const fondo =
    variante === 'primario'
      ? C.primario
      : variante === 'peligro'
      ? C.rojo
      : C.tarjeta;
  const color = variante === 'secundario' ? C.primario : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.boton,
        { backgroundColor: fondo, opacity: inactivo ? 0.6 : 1 },
        pressed && { transform: [{ scale: 0.98 }] },
        variante === 'secundario' && {
          borderWidth: 1.5,
          borderColor: C.borde,
        },
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {Icono && <Icono size={19} color={color} strokeWidth={2.2} />}
          <Text style={[s.botonTxt, { color }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

// ------------------------------------------------------------------ Campo de texto
export function Campo(
  props: TextInputProps & {
    etiqueta: string;
    error?: string;
    ayuda?: string;
    Icono?: LucideIcon;
    contrasena?: boolean;
  },
) {
  const { etiqueta, error, ayuda, Icono, contrasena, style, ...rest } = props;
  const [foco, setFoco] = useState(false);
  const [visible, setVisible] = useState(false);
  const colorBorde = error ? C.rojo : foco ? C.primario : C.borde;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>{etiqueta}</Text>
      <View
        style={[
          s.inputCaja,
          { borderColor: colorBorde },
          rest.multiline && { alignItems: 'flex-start', paddingTop: 12 },
        ]}
      >
        {Icono && (
          <Icono
            size={19}
            color={foco ? C.primario : C.tenue}
            strokeWidth={2}
            style={rest.multiline ? { marginTop: 2 } : undefined}
          />
        )}
        <TextInput
          {...rest}
          placeholderTextColor={C.tenue}
          style={[s.input, style]}
          secureTextEntry={contrasena && !visible}
          onFocus={e => {
            setFoco(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFoco(false);
            rest.onBlur?.(e);
          }}
        />
        {contrasena && (
          <Pressable
            onPress={() => setVisible(v => !v)}
            hitSlop={10}
            accessibilityLabel={
              visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
          >
            {visible ? (
              <EyeOff size={19} color={C.tenue} />
            ) : (
              <Eye size={19} color={C.tenue} />
            )}
          </Pressable>
        )}
      </View>
      {error ? (
        <View style={s.filaError}>
          <CircleAlert size={14} color={C.rojo} />
          <Text style={s.error}>{error}</Text>
        </View>
      ) : ayuda ? (
        <Text style={s.ayuda}>{ayuda}</Text>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ Avisos
const ESTILO_AVISO = {
  error: { Icono: CircleAlert, color: C.rojo, fondo: C.rojoSuave },
  info: { Icono: Info, color: C.azul, fondo: C.azulSuave },
  ok: { Icono: CircleCheck, color: C.verde, fondo: C.verdeSuave },
  alerta: { Icono: TriangleAlert, color: C.ambar, fondo: C.ambarSuave },
};

export function Aviso({
  tipo,
  texto,
  accion,
  onAccion,
  onCerrar,
  Icono,
}: {
  tipo: keyof typeof ESTILO_AVISO;
  texto: string;
  accion?: string;
  onAccion?: () => void;
  onCerrar?: () => void;
  Icono?: LucideIcon;
}) {
  const e = ESTILO_AVISO[tipo];
  const I = Icono ?? e.Icono;
  return (
    <View style={[s.aviso, { backgroundColor: e.fondo }]}>
      <I size={18} color={e.color} strokeWidth={2.2} />
      <Text style={[s.avisoTxt, { color: C.texto }]}>{texto}</Text>
      {accion && onAccion ? (
        <Pressable onPress={onAccion} hitSlop={8}>
          <Text style={[s.avisoAccion, { color: e.color }]}>{accion}</Text>
        </Pressable>
      ) : null}
      {onCerrar ? (
        <Pressable onPress={onCerrar} hitSlop={8} accessibilityLabel="Cerrar">
          <X size={16} color={C.suave} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ Encabezado
export function Encabezado({
  titulo,
  subtitulo,
  onVolver,
  derecha,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  onVolver?: () => void;
  derecha?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + 12 }]}>
      <View style={s.headerFila}>
        {onVolver && (
          <Pressable
            onPress={onVolver}
            hitSlop={10}
            style={s.headerBtn}
            accessibilityLabel="Volver"
          >
            <ChevronLeft size={22} color="#fff" strokeWidth={2.4} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          {subtitulo ? (
            <Text style={s.hSub} numberOfLines={1}>
              {subtitulo}
            </Text>
          ) : null}
          <Text style={s.hTitulo} numberOfLines={1}>
            {titulo}
          </Text>
        </View>
        {derecha}
      </View>
      {children}
    </View>
  );
}

export function BotonIcono({
  Icono,
  onPress,
  etiqueta,
}: {
  Icono: LucideIcon;
  onPress: () => void;
  etiqueta: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={s.headerBtn}
      accessibilityLabel={etiqueta}
    >
      <Icono size={20} color="#fff" strokeWidth={2.2} />
    </Pressable>
  );
}

// ------------------------------------------------------------------ Sección
export function Seccion({
  titulo,
  paso,
  children,
}: {
  titulo: string;
  paso?: number;
  children: React.ReactNode;
}) {
  return (
    <View style={[s.seccion, sombra]}>
      <View style={s.seccionHead}>
        {paso ? (
          <View style={s.paso}>
            <Text style={s.pasoTxt}>{paso}</Text>
          </View>
        ) : null}
        <Text style={s.seccionTitulo}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const s = StyleSheet.create({
  header: {
    backgroundColor: C.primario,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerFila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hTitulo: { color: '#fff', fontSize: 22, fontWeight: '700' },
  hSub: { color: '#BFD0EC', fontSize: 13, marginBottom: 2 },
  boton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
  },
  botonTxt: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: C.texto, marginBottom: 7 },
  inputCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: { flex: 1, fontSize: 15.5, color: C.texto, paddingVertical: 12 },
  filaError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  error: { color: C.rojo, fontSize: 12.5 },
  ayuda: { color: C.suave, fontSize: 12, marginTop: 6 },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  avisoTxt: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  avisoAccion: { fontWeight: '700', fontSize: 13.5 },
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
  },
  etiquetaTxt: { fontSize: 11.5, fontWeight: '700' },
  seccion: {
    backgroundColor: C.tarjeta,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  seccionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  paso: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoTxt: { color: C.primario, fontWeight: '800', fontSize: 12 },
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: C.texto },
});
