import { Wrench } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { C } from '../components/ui';
import { APP } from '../version';

// Se muestra al abrir la app mientras se revisa si hay una sesión guardada
export default function BienvenidaScreen() {
  return (
    <View style={s.fondo}>
      <View style={s.logo}>
        <Wrench size={44} color={C.primario} strokeWidth={2.2} />
      </View>
      <Text style={s.titulo}>{APP.nombre}</Text>
      <Text style={s.sub}>
        Mantenimiento de la infraestructura universitaria
      </Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 28 }} />
      <Text style={s.version}>Versión {APP.version}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: C.primario,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  titulo: { fontSize: 30, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 14.5, color: '#C7D6EE', marginTop: 6, textAlign: 'center' },
  version: {
    position: 'absolute',
    bottom: 36,
    color: '#C7D6EE',
    fontSize: 12.5,
  },
});
