import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { C } from './src/components/ui';
import { cerrarSesion, obtenerRol } from './src/lib/api';
import { supabase } from './src/lib/supabase';
import { Reporte, Rol } from './src/lib/tipos';
import DetalleScreen from './src/screens/DetalleScreen';
import LoginScreen from './src/screens/LoginScreen';
import NuevoReporteScreen from './src/screens/NuevoReporteScreen';
import ReportesScreen from './src/screens/ReportesScreen';

type Pantalla =
  | { tipo: 'lista'; mensaje?: string }
  | { tipo: 'nuevo' }
  | { tipo: 'detalle'; reporte: Reporte };

function App() {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [rol, setRol] = useState<Rol>('estudiante');
  const [iniciando, setIniciando] = useState(true);
  const [pantalla, setPantalla] = useState<Pantalla>({ tipo: 'lista' });

  // 1. Al abrir la app: ¿existe una sesión válida guardada en SecureStore?
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setIniciando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSesion(s);
      if (!s) setPantalla({ tipo: 'lista' });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const uidSesion = sesion?.user.id;
  useEffect(() => {
    if (uidSesion)
      obtenerRol(uidSesion)
        .then(setRol)
        .catch(() => setRol('estudiante'));
  }, [uidSesion]);

  // Botón atrás de Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pantalla.tipo !== 'lista') {
        setPantalla({ tipo: 'lista' });
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [pantalla.tipo]);

  if (iniciando) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', backgroundColor: C.fondo }}
      >
        <ActivityIndicator size="large" color={C.primario} />
      </View>
    );
  }

  if (!sesion) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <LoginScreen />
      </>
    );
  }

  const uid = sesion.user.id;
  return (
    <>
      <StatusBar barStyle="light-content" />
      {pantalla.tipo === 'lista' && (
        <ReportesScreen
          uid={uid}
          correo={sesion.user.email ?? ''}
          rol={rol}
          mensaje={pantalla.mensaje}
          onNuevo={() => setPantalla({ tipo: 'nuevo' })}
          onAbrir={reporte => setPantalla({ tipo: 'detalle', reporte })}
          onSalir={() => cerrarSesion(uid)}
        />
      )}
      {pantalla.tipo === 'nuevo' && (
        <NuevoReporteScreen
          uid={uid}
          onListo={mensaje => setPantalla({ tipo: 'lista', mensaje })}
          onCancelar={() => setPantalla({ tipo: 'lista' })}
        />
      )}
      {pantalla.tipo === 'detalle' && (
        <DetalleScreen
          reporte={pantalla.reporte}
          rol={rol}
          onVolver={() => setPantalla({ tipo: 'lista' })}
        />
      )}
    </>
  );
}

export default function Root() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}
