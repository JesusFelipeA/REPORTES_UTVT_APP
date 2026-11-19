import {
  Camera,
  ExternalLink,
  Globe,
  Info,
  Mail,
  MapPin,
  ShieldCheck,
  Wrench,
} from 'lucide-react-native';
import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, Encabezado, Seccion, sombra } from '../components/ui';
import { APP } from '../version';

// Versión instalada, contacto de soporte, permisos que usa la app y aviso de privacidad
export default function AcercaDeScreen({ onVolver }: { onVolver: () => void }) {
  const insets = useSafeAreaInsets();
  const abrir = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <View style={{ flex: 1, backgroundColor: C.fondo }}>
      <Encabezado
        titulo="Acerca de"
        subtitulo={APP.nombre}
        onVolver={onVolver}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={[s.cabeza, sombra]}>
          <View style={s.logo}>
            <Wrench size={30} color={C.primario} strokeWidth={2.2} />
          </View>
          <Text style={s.nombre}>{APP.nombre}</Text>
          <Text style={s.version} testID="version-instalada">
            Versión {APP.version} ({APP.versionCode})
          </Text>
          <Text style={s.id}>{APP.identificador}</Text>
        </View>

        <Seccion titulo="Soporte">
          <Fila
            Icono={Mail}
            texto={APP.soporte}
            nota="Reporta fallas de la app o dudas de tu cuenta"
            onPress={() =>
              abrir(
                `mailto:${APP.soporte}?subject=${encodeURIComponent(
                  `${APP.nombre} ${APP.version}`,
                )}`,
              )
            }
          />
        </Seccion>

        <Seccion titulo="Permisos que usa">
          <Fila
            Icono={Globe}
            texto="Internet"
            nota="Enviar y consultar reportes"
          />
          <Fila
            Icono={Camera}
            texto="Cámara (opcional)"
            nota="Solo cuando tomas la foto de evidencia; se pide en ese momento"
          />
          <Fila
            Icono={MapPin}
            texto="Ubicación (opcional)"
            nota="Solo al pulsar Usar mi ubicación actual; nunca en segundo plano"
          />
          <Text style={s.nota}>
            El estado de cada permiso se revisa y cambia en la pantalla Permisos
            (icono del escudo en Mis reportes).
          </Text>
        </Seccion>

        <Seccion titulo="Privacidad">
          <Text style={s.parrafo}>
            Se guardan tu correo institucional, los reportes que registras, sus
            fotos y, si la compartes, la ubicación del reporte. Solo los ves tú
            y el personal de mantenimiento. La sesión se guarda cifrada en el
            teléfono.
          </Text>
          <Fila
            Icono={ShieldCheck}
            texto="Aviso de privacidad completo"
            onPress={() => abrir(APP.privacidad)}
            externo
          />
        </Seccion>

        <View style={s.pie}>
          <Info size={14} color={C.tenue} />
          <Text style={s.pieTxt}>
            Universidad Tecnológica del Valle de Toluca · Desarrollo Móvil
            Integral
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Fila({
  Icono,
  texto,
  nota,
  onPress,
  externo,
}: {
  Icono: typeof Mail;
  texto: string;
  nota?: string;
  onPress?: () => void;
  externo?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [s.fila, pressed && { opacity: 0.6 }]}
      accessibilityRole={onPress ? 'link' : 'text'}
    >
      <View style={s.filaIcono}>
        <Icono size={18} color={C.primario} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.filaTxt, onPress && { color: C.primario }]}>
          {texto}
        </Text>
        {nota ? <Text style={s.filaNota}>{nota}</Text> : null}
      </View>
      {externo ? <ExternalLink size={16} color={C.tenue} /> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  cabeza: {
    backgroundColor: C.tarjeta,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: C.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  nombre: { fontSize: 20, fontWeight: '800', color: C.texto },
  version: { fontSize: 14, color: C.suave, marginTop: 4 },
  id: { fontSize: 12, color: C.tenue, marginTop: 2 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  filaIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaTxt: { fontSize: 14.5, color: C.texto, fontWeight: '600' },
  filaNota: { fontSize: 12.5, color: C.suave, marginTop: 1 },
  nota: { fontSize: 12, color: C.tenue, marginTop: 4 },
  parrafo: { fontSize: 13.5, color: C.suave, lineHeight: 19, marginBottom: 6 },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  pieTxt: { color: C.tenue, fontSize: 11.5, textAlign: 'center' },
});
