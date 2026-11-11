import { limpiar, validarLogin, validarReporte } from '../src/lib/validacion';

describe('validarLogin', () => {
  it('acepta credenciales con formato válido', () => {
    expect(validarLogin('alumno1@utvt.edu.mx', 'Segura123!')).toBeNull();
  });
  it('rechaza correo inválido y contraseña corta', () => {
    expect(validarLogin('alumno', 'Segura123!')).not.toBeNull();
    expect(validarLogin('alumno1@utvt.edu.mx', '123')).not.toBeNull();
  });
});

describe('validarReporte', () => {
  const base = {
    categoria: 'computo' as const,
    ubicacion: 'Edificio D, Lab 3',
    descripcion: 'La PC 12 no enciende',
    foto: null,
  };

  it('acepta un reporte válido', () => {
    expect(validarReporte(base)).toEqual({});
  });
  it('marca campos obligatorios vacíos', () => {
    const e = validarReporte({
      categoria: null,
      ubicacion: '',
      descripcion: 'corto',
      foto: null,
    });
    expect(e.categoria).toBeDefined();
    expect(e.ubicacion).toBeDefined();
    expect(e.descripcion).toBeDefined();
  });
  it('rechaza fotos de más de 5 MB o con formato no permitido', () => {
    const grande = {
      uri: 'x',
      base64: '',
      mimeType: 'image/jpeg',
      fileSize: 12 * 1024 * 1024,
    };
    expect(validarReporte({ ...base, foto: grande }).foto).toBeDefined();
    expect(
      validarReporte({
        ...base,
        foto: { ...grande, fileSize: 1000, mimeType: 'image/gif' },
      }).foto,
    ).toBeDefined();
  });
  it('elimina etiquetas HTML de los textos', () => {
    expect(limpiar('  <script>x</script> Foco   fundido ')).toBe(
      'x Foco fundido',
    );
  });
});
