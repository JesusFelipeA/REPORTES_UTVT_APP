import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as Keychain from 'react-native-keychain';
import { AppState } from 'react-native';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';

// La app solo conoce la llave PÚBLICA (anon / publishable). Nunca la service_role.
export const configCompleta =
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('TU-PROYECTO') &&
  SUPABASE_ANON_KEY.length > 20;

/**
 * Adaptador de almacenamiento cifrado para la sesión:
 * iOS Keychain / Android Keystore mediante react-native-keychain.
 * Cada clave se guarda como un "servicio" independiente.
 */
const KeychainStorage = {
  async getItem(key: string) {
    const r = await Keychain.getGenericPassword({ service: key });
    return r ? r.password : null;
  },
  async setItem(key: string, value: string) {
    await Keychain.setGenericPassword('sesion', value, {
      service: key,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async removeItem(key: string) {
    await Keychain.resetGenericPassword({ service: key });
  },
};

export const supabase = createClient(
  configCompleta ? SUPABASE_URL : 'https://sin-configurar.supabase.co',
  configCompleta ? SUPABASE_ANON_KEY : 'sin-configurar',
  {
    auth: {
      storage: KeychainStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Renueva el token solo mientras la app está en primer plano
AppState.addEventListener('change', estado => {
  if (estado === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
