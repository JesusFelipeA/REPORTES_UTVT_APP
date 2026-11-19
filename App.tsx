import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { BackHandler, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { cerrarSesion, obtenerRol } from './src/lib/api';
import { supabase } from './src/lib/supabase';
import { Reporte, Rol } from './src/lib/tipos';
import AcercaDeScreen from './src/screens/AcercaDeScreen';
import BienvenidaScreen from './src/screens/BienvenidaScreen';
import DetalleScreen from './src/screens/DetalleScreen';
import LoginScreen from './src/screens/LoginScreen';
import NuevoReporteScreen from './src/screens/NuevoReporteScreen';
import PermisosScreen from './src/screens/PermisosScreen';
import ReportesScreen from './src/screens/ReportesScreen';

type Pantalla =
  | { tipo: 'lista'; mensaje?: string }
  | { tipo: 'nuevo' }
  | { tipo: 'permisos' }
  | { tipo: 'detalle'; reporte: Reporte }
  | { tipo: 'acerca' };

function App() {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [rol, setRol] = useState<Rol>('estudiante');
  const [iniciando, setIniciando] = useState(true);
  const [pantalla, setPantalla] = useState<Pantalla>({ tipo: 'lista' });
  const [acercaSinSesion, setAcercaSinSesion] = useState(false);

  // 1. Al abrir la app: ¿existe una sesión válida guardada en SecureStore?
  //    La bienvenida se muestra al menos 1.2 s para que se alcance a ver
  useEffect(() => {
    const espera = new Promise<void>(r => setTimeout(() => r(), 1200));
    Promise.all([supabase.auth.getSession(), espera]).then(([{ data }]) => {
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
      if (acercaSinSesion) {
        setAcercaSinSesion(false);
        return true;
      }
      if (pantalla.tipo !== 'lista') {
        setPantalla({ tipo: 'lista' });
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [pantalla.tipo, acercaSinSesion]);

  if (iniciando) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <BienvenidaScreen />
      </>
    );
  }

  if (!sesion) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        {acercaSinSesion ? (
          <AcercaDeScreen onVolver={() => setAcercaSinSesion(false)} />
        ) : (
          <LoginScreen onAcercaDe={() => setAcercaSinSesion(true)} />
        )}
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
          onPermisos={() => setPantalla({ tipo: 'permisos' })}
          onAbrir={reporte => setPantalla({ tipo: 'detalle', reporte })}
          onSalir={() => cerrarSesion(uid)}
          onAcercaDe={() => setPantalla({ tipo: 'acerca' })}
        />
      )}
      {pantalla.tipo === 'permisos' && (
        <PermisosScreen onVolver={() => setPantalla({ tipo: 'lista' })} />
      )}
      {pantalla.tipo === 'acerca' && (
        <AcercaDeScreen onVolver={() => setPantalla({ tipo: 'lista' })} />
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
