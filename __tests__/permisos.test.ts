import { PermissionsAndroid, Platform } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  getCurrentPosition: jest.fn(),
  requestAuthorization: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  estadoPermiso,
  permitido,
  solicitarPermiso,
} from '../src/lib/permisos';

const R = PermissionsAndroid.RESULTS;
const check = jest.spyOn(PermissionsAndroid, 'check');
const request = jest.spyOn(PermissionsAndroid, 'request');
const requestMultiple = jest.spyOn(PermissionsAndroid, 'requestMultiple');

beforeAll(() => {
  Object.defineProperty(Platform, 'OS', { get: () => 'android' });
});
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  check.mockResolvedValue(false);
});

describe('cámara', () => {
  it('sin solicitar → solicitar → concedido', async () => {
    expect(await estadoPermiso('camara')).toBe('no_solicitado');
    request.mockResolvedValue(R.GRANTED);
    expect(await solicitarPermiso('camara')).toBe('concedido');
  });

  it('rechazo simple → denegado (se puede volver a pedir)', async () => {
    request.mockResolvedValue(R.DENIED);
    expect(await solicitarPermiso('camara')).toBe('denegado');
    expect(await estadoPermiso('camara')).toBe('denegado');
  });

  it('"No volver a preguntar" → bloqueado', async () => {
    request.mockResolvedValue(R.NEVER_ASK_AGAIN);
    await solicitarPermiso('camara');
    expect(await estadoPermiso('camara')).toBe('bloqueado');
  });

  it('concedido y luego quitado en Ajustes → revocado', async () => {
    request.mockResolvedValue(R.GRANTED);
    await solicitarPermiso('camara');
    check.mockResolvedValue(false); // el usuario lo quitó en Ajustes
    expect(await estadoPermiso('camara')).toBe('revocado');
  });
});

describe('ubicación', () => {
  const FINE = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const COARSE = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

  it('pide precisa y aproximada en la misma solicitud', async () => {
    requestMultiple.mockResolvedValue({
      [FINE]: R.GRANTED,
      [COARSE]: R.GRANTED,
    } as any);
    expect(await solicitarPermiso('ubicacion')).toBe('concedido');
    expect(requestMultiple).toHaveBeenCalledWith([FINE, COARSE]);
  });

  it('el usuario elige "aproximada" (Android 12+)', async () => {
    requestMultiple.mockResolvedValue({
      [FINE]: R.DENIED,
      [COARSE]: R.GRANTED,
    } as any);
    const e = await solicitarPermiso('ubicacion');
    expect(e).toBe('aproximada');
    expect(permitido(e)).toBe(true);
  });

  it('rechazo con "No volver a preguntar" → bloqueado', async () => {
    requestMultiple.mockResolvedValue({
      [FINE]: R.NEVER_ASK_AGAIN,
      [COARSE]: R.NEVER_ASK_AGAIN,
    } as any);
    expect(await solicitarPermiso('ubicacion')).toBe('bloqueado');
    expect(permitido('bloqueado')).toBe(false);
  });
});
