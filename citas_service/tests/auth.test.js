'use strict';

const jwt = require('jsonwebtoken');
const { hashContrasena, verificarContrasena } = require('../app/auth/contrasenas');
const { emitirToken, verificarToken, DURACION_SEGUNDOS } = require('../app/auth/tokens');

const SECRETO = 'secreto-solo-para-pruebas';

describe('hashContrasena / verificarContrasena (scrypt)', () => {
  test('el hash no contiene la contraseña y cabe en VARCHAR(255)', async () => {
    const hash = await hashContrasena('MiClave#2026');
    expect(hash).toMatch(/^scrypt\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(hash).not.toContain('MiClave#2026');
    expect(hash.length).toBeLessThanOrEqual(255);
  });

  test('usa una sal distinta en cada hash', async () => {
    const a = await hashContrasena('igual');
    const b = await hashContrasena('igual');
    expect(a).not.toBe(b);
  });

  test('verifica la contraseña correcta y rechaza la incorrecta', async () => {
    const hash = await hashContrasena('correcta');
    await expect(verificarContrasena('correcta', hash)).resolves.toBe(true);
    await expect(verificarContrasena('incorrecta', hash)).resolves.toBe(false);
  });

  test.each([undefined, '', 'texto-plano', 'scrypt$abc', 'bcrypt$AAAA$BBBB', 'scrypt$AAAA$BBBB'])(
    'devuelve false con un hash guardado inválido: %s',
    async (hashGuardado) => {
      await expect(verificarContrasena('x', hashGuardado)).resolves.toBe(false);
    }
  );

  test.each([undefined, '', 123])('rechaza una contraseña vacía o que no es texto: %s', async (valor) => {
    await expect(hashContrasena(valor)).rejects.toThrow(TypeError);
  });
});

describe('emitirToken / verificarToken (JWT)', () => {
  const ahora = new Date('2026-11-19T18:00:00Z');

  test('emite un HS256 con sub = id del comprador y vigencia de 8 horas', () => {
    const token = emitirToken(42, SECRETO, ahora);
    const { header, payload } = jwt.decode(token, { complete: true });
    expect(header.alg).toBe('HS256');
    expect(payload.sub).toBe('42');
    expect(payload.exp - payload.iat).toBe(8 * 60 * 60);
    expect(DURACION_SEGUNDOS).toBe(28800);
  });

  test('valida el token y devuelve el id del comprador', () => {
    const token = emitirToken('c-1', SECRETO, ahora);
    expect(verificarToken(token, SECRETO, ahora)).toBe('c-1');
  });

  test('sigue vigente un segundo antes de las 8 horas y vence al cumplirlas', () => {
    const token = emitirToken('c-1', SECRETO, ahora);
    const casi = new Date(ahora.getTime() + (DURACION_SEGUNDOS - 1) * 1000);
    const vencido = new Date(ahora.getTime() + DURACION_SEGUNDOS * 1000);
    expect(verificarToken(token, SECRETO, casi)).toBe('c-1');
    expect(verificarToken(token, SECRETO, vencido)).toBeNull();
  });

  test('rechaza un token firmado con otro secreto', () => {
    const token = emitirToken('c-1', 'otro-secreto', ahora);
    expect(verificarToken(token, SECRETO, ahora)).toBeNull();
  });

  test('rechaza un token con otro algoritmo o sin firma', () => {
    const hs512 = jwt.sign({ sub: 'c-1' }, SECRETO, { algorithm: 'HS512' });
    const sinFirma = jwt.sign({ sub: 'c-1' }, null, { algorithm: 'none' });
    expect(verificarToken(hs512, SECRETO, ahora)).toBeNull();
    expect(verificarToken(sinFirma, SECRETO, ahora)).toBeNull();
  });

  test('rechaza un token sin sub o vacío', () => {
    const sinSub = jwt.sign({ foo: 'bar' }, SECRETO, { algorithm: 'HS256' });
    expect(verificarToken(sinSub, SECRETO, ahora)).toBeNull();
    expect(verificarToken('', SECRETO, ahora)).toBeNull();
    expect(verificarToken(undefined, SECRETO, ahora)).toBeNull();
    expect(verificarToken('no.es.jwt', SECRETO, ahora)).toBeNull();
  });

  test('exige secreto y id del comprador', () => {
    expect(() => emitirToken('c-1', '', ahora)).toThrow(/JWT_SECRET/);
    expect(() => emitirToken('', SECRETO, ahora)).toThrow(/id del comprador/);
    expect(() => verificarToken('x', undefined, ahora)).toThrow(/JWT_SECRET/);
  });
});
