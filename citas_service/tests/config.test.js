'use strict';

const { cargarConfig, CORS_POR_DEFECTO } = require('../app/config');

describe('cargarConfig', () => {
  test('usa el puerto 3000 y los orígenes de web_1 y web_2 por defecto (PR8, PR9)', () => {
    const config = cargarConfig({});
    expect(config.puerto).toBe(3000);
    expect(config.corsOrigenes).toEqual(CORS_POR_DEFECTO);
    expect(config.corsOrigenes).toEqual(
      expect.arrayContaining(['http://localhost:5501', 'http://localhost:5502'])
    );
    expect(config.rutaBase).toBe('/api/v1');
  });

  test('lee PORT y CORS_ORIGINS de las variables de entorno', () => {
    const config = cargarConfig({
      PORT: '4000',
      CORS_ORIGINS: ' http://a.test , http://b.test ,',
    });
    expect(config.puerto).toBe(4000);
    expect(config.corsOrigenes).toEqual(['http://a.test', 'http://b.test']);
  });

  test.each(['abc', '-1', '70000', '3.5'])('rechaza PORT inválido: %s', (valor) => {
    expect(() => cargarConfig({ PORT: valor })).toThrow(/PORT inválido/);
  });
});
