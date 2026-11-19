'use strict';

const { cargarConfig, CORS_POR_DEFECTO } = require('../app/config');

// Entorno mínimo de prueba: NODE_ENV=test no exige JWT_SECRET.
const ENV_TEST = { NODE_ENV: 'test' };

describe('cargarConfig', () => {
  test('usa el puerto 3000 y los orígenes de web_1 y web_2 por defecto (PR8, PR9)', () => {
    const config = cargarConfig({ ...ENV_TEST });
    expect(config.puerto).toBe(3000);
    expect(config.corsOrigenes).toEqual(CORS_POR_DEFECTO);
    expect(config.corsOrigenes).toEqual(
      expect.arrayContaining(['http://localhost:5501', 'http://localhost:5502'])
    );
    expect(config.rutaBase).toBe('/api/v1');
    expect(config.repositorio).toBe('memoria');
  });

  test('lee PORT y CORS_ORIGINS de las variables de entorno', () => {
    const config = cargarConfig({
      ...ENV_TEST,
      PORT: '4000',
      CORS_ORIGINS: ' http://a.test , http://b.test ,',
    });
    expect(config.puerto).toBe(4000);
    expect(config.corsOrigenes).toEqual(['http://a.test', 'http://b.test']);
  });

  test.each(['abc', '-1', '70000', '3.5'])('rechaza PORT inválido: %s', (valor) => {
    expect(() => cargarConfig({ ...ENV_TEST, PORT: valor })).toThrow(/PORT inválido/);
  });

  test('lee REPOSITORIO sin importar mayúsculas ni espacios', () => {
    expect(cargarConfig({ ...ENV_TEST, REPOSITORIO: ' SQL ' }).repositorio).toBe('sql');
  });
});

describe('cargarConfig: JWT_SECRET (Dueño de la autenticación)', () => {
  test.each([undefined, 'development', 'production'])(
    'no arranca sin JWT_SECRET con NODE_ENV=%s',
    (entorno) => {
      const env = entorno === undefined ? {} : { NODE_ENV: entorno };
      expect(() => cargarConfig(env)).toThrow(/Falta JWT_SECRET/);
      expect(() => cargarConfig({ ...env, JWT_SECRET: '   ' })).toThrow(/Falta JWT_SECRET/);
    }
  );

  test('usa JWT_SECRET cuando está definido', () => {
    const config = cargarConfig({ NODE_ENV: 'production', JWT_SECRET: 'secreto-de-prueba' });
    expect(config.jwtSecret).toBe('secreto-de-prueba');
  });

  test('en test genera un secreto aleatorio si falta', () => {
    const a = cargarConfig({ ...ENV_TEST }).jwtSecret;
    const b = cargarConfig({ ...ENV_TEST }).jwtSecret;
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe('cargarConfig: SQL_* (design §6)', () => {
  test('lee la conexión a SQL Server de las variables de entorno', () => {
    const config = cargarConfig({
      ...ENV_TEST,
      SQL_SERVER: 'localhost',
      SQL_DATABASE: 'CitasBD',
      SQL_USER: 'usuario',
      SQL_PASSWORD: 'clave-de-prueba',
    });
    expect(config.sql).toEqual({
      servidor: 'localhost',
      baseDatos: 'CitasBD',
      usuario: 'usuario',
      contrasena: 'clave-de-prueba',
    });
  });

  test('deja indefinidos los valores que no vienen', () => {
    expect(cargarConfig({ ...ENV_TEST }).sql).toEqual({
      servidor: undefined,
      baseDatos: undefined,
      usuario: undefined,
      contrasena: undefined,
    });
  });
});
