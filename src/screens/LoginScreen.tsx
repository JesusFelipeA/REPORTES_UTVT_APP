import { Lock, LogIn, Mail, ShieldCheck, Wrench } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aviso, Boton, C, Campo, sombra } from '../components/ui';
import { iniciarSesion } from '../lib/api';
import { configCompleta } from '../lib/supabase';
import { validarLogin } from '../lib/validacion';
import { APP } from '../version';

export default function LoginScreen({
  onAcercaDe,
}: {
  onAcercaDe: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    setError(null);
    const v = validarLogin(correo, contrasena);
    if (v) return setError(v);
    setCargando(true);
    try {
      await iniciarSesion(correo, contrasena);
      // App.tsx detecta la nueva sesión y cambia de pantalla
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.hero, { paddingTop: insets.top + 48 }]}>
          <View style={s.logo}>
            <Wrench size={34} color={C.primario} strokeWidth={2.2} />
          </View>
          <Text style={s.titulo}>Reportes UTVT</Text>
          <Text style={s.sub}>
            Reporta fallas de infraestructura y da seguimiento a su atención
          </Text>
        </View>

        <View style={[s.tarjeta, sombra]}>
          <Text style={s.tarjetaTitulo}>Iniciar sesión</Text>
          <Text style={s.tarjetaSub}>Usa tu cuenta institucional</Text>

          {!configCompleta && (
            <Aviso
              tipo="alerta"
              texto="Falta configurar la URL y la llave anon de Supabase en src/config.ts"
            />
          )}
          {error && <Aviso tipo="error" texto={error} />}

          <Campo
            etiqueta="Correo institucional"
            Icono={Mail}
            placeholder="alumno@utvt.edu.mx"
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <Campo
            etiqueta="Contraseña"
            Icono={Lock}
            contrasena
            placeholder="Tu contraseña"
            value={contrasena}
            onChangeText={setContrasena}
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={entrar}
          />
          <View style={{ height: 4 }} />
          <Boton
            titulo="Entrar"
            Icono={LogIn}
            onPress={entrar}
            cargando={cargando}
          />
        </View>

        <View style={s.pie}>
          <ShieldCheck size={15} color={C.verde} />
          <Text style={s.pieTxt}>
            Conexión cifrada (HTTPS) · Sesión protegida en el dispositivo
          </Text>
        </View>
        <Pressable onPress={onAcercaDe} hitSlop={8} style={s.acerca}>
          <Text style={s.acercaTxt}>
            Versión {APP.version} · Soporte y aviso de privacidad
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  hero: {
    backgroundColor: C.primario,
    paddingHorizontal: 28,
    paddingBottom: 72,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  titulo: { fontSize: 28, fontWeight: '800', color: '#fff' },
  sub: {
    fontSize: 14.5,
    color: '#C7D6EE',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 290,
  },
  tarjeta: {
    backgroundColor: C.tarjeta,
    borderRadius: 22,
    padding: 22,
    marginHorizontal: 20,
    marginTop: -44,
  },
  tarjetaTitulo: { fontSize: 20, fontWeight: '800', color: C.texto },
  tarjetaSub: {
    fontSize: 13.5,
    color: C.suave,
    marginTop: 3,
    marginBottom: 20,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
    paddingHorizontal: 20,
  },
  pieTxt: { color: C.suave, fontSize: 12 },
  acerca: { alignSelf: 'center', marginTop: 14, padding: 6 },
  acercaTxt: { color: C.primario, fontSize: 12.5, fontWeight: '600' },
});
