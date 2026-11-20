'use strict';

/**
 * Tarea 7.1 — Contrato de autenticación (router `auth`, tarea 3.7 de S).
 * Operaciones: 'registrarComprador', 'iniciarSesion'.
 */
const { crearContexto, describeSiRouter } = require('./apoyo/app');
const { esperarContrato, esperarError } = require('./apoyo/esperar');

const NUEVO = { nombre: 'Ana López', correo: 'ana@ejemplo.com', contrasena: 'contrasena-segura' };

describeSiRouter('auth', 'Autenticación', () => {
  let ctx;
  beforeEach(() => {
    ctx = crearContexto();
  });

  const registrar = (cuerpo = NUEVO) => ctx.pedir('post', '/auth/registro', { sitio: 'web_1', cuerpo });
  const entrar = (cuerpo) => ctx.pedir('post', '/auth/login', { sitio: 'web_1', cuerpo });

  describe("'registrarComprador' POST /auth/registro", () => {
    test('201 con comprador y token, sin la contraseña', async () => {
      const res = await registrar();
      esperarContrato('registrarComprador', res, 201);
      expect(res.body.comprador).toMatchObject({ nombre: NUEVO.nombre, correo: NUEVO.correo });
      expect(JSON.stringify(res.body)).not.toContain(NUEVO.contrasena);
    });

    test('409 CORREO_REGISTRADO si el correo ya existe (escenario del contrato)', async () => {
      await registrar();
      esperarError('registrarComprador', await registrar(), 409, 'CORREO_REGISTRADO');
    });

    test.each([
      ['falta nombre', { correo: 'a@b.com', contrasena: 'contrasena-segura' }],
      ['correo inválido', { ...NUEVO, correo: 'no-es-correo' }],
      ['contraseña de menos de 8 caracteres', { ...NUEVO, contrasena: 'corta' }],
    ])('400 SOLICITUD_INVALIDA: %s', async (_, cuerpo) => {
      esperarError('registrarComprador', await registrar(cuerpo), 400, 'SOLICITUD_INVALIDA');
    });
  });

  describe("'iniciarSesion' POST /auth/login", () => {
    test('200 con comprador y token', async () => {
      await registrar();
      const res = await entrar({ correo: NUEVO.correo, contrasena: NUEVO.contrasena });
      esperarContrato('iniciarSesion', res, 200);
      expect(res.body.comprador.correo).toBe(NUEVO.correo);
    });

    test('401 con el mismo mensaje si la contraseña no coincide o el correo no existe', async () => {
      await registrar();
      const malaContrasena = await entrar({ correo: NUEVO.correo, contrasena: 'otra-contrasena' });
      const sinCorreo = await entrar({ correo: 'nadie@ejemplo.com', contrasena: NUEVO.contrasena });
      esperarError('iniciarSesion', malaContrasena, 401, 'NO_AUTENTICADO');
      esperarError('iniciarSesion', sinCorreo, 401, 'NO_AUTENTICADO');
      expect(malaContrasena.body.error.mensaje).toBe(sinCorreo.body.error.mensaje);
    });

    test('400 SOLICITUD_INVALIDA si faltan datos', async () => {
      esperarError('iniciarSesion', await entrar({ correo: NUEVO.correo }), 400, 'SOLICITUD_INVALIDA');
    });
  });
});

describeSiRouter(['auth', 'reservas'], 'Autenticación con reservas', () => {
  test("'iniciarSesion': el token emitido sirve para operar como comprador en web_1", async () => {
    const ctx = crearContexto();
    const registro = await ctx.pedir('post', '/auth/registro', { sitio: 'web_1', cuerpo: NUEVO });
    esperarContrato('registrarComprador', registro, 201);
    const res = await ctx.pedir('get', '/reservas', { sitio: 'web_1', token: registro.body.token });
    esperarContrato('listarMisReservas', res, 200);
  });
});
