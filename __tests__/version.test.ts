// La versión que ve el usuario debe ser la misma que se compila (evita liberar con datos viejos)
import { APP } from '../src/version';

// Jest corre en Node; se declaran aquí para no mezclar los tipos de Node con los de React Native
declare const require: (m: string) => any;
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path');

const raiz = join(__dirname, '..');
const gradle = readFileSync(join(raiz, 'android/app/build.gradle'), 'utf8');
const pkg = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'));

describe('versión de distribución', () => {
  it('coincide con build.gradle', () => {
    expect(gradle).toContain(`versionName "${APP.version}"`);
    expect(gradle).toContain(`versionCode ${APP.versionCode}`);
    expect(gradle).toContain(`applicationId "${APP.identificador}"`);
  });
  it('coincide con package.json', () => {
    expect(pkg.version).toBe(APP.version);
  });
  it('la release no queda firmada siempre con la llave de depuración', () => {
    expect(gradle).toContain('signingConfig signingConfigs.release');
  });
});
