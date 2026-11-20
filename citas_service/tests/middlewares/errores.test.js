'use strict';

const express = require('express');
const request = require('supertest');
const {
  crearManejadorErrores,
  traducirError,
  codigoDeBaseDatos,
} = require('../../app/middlewares/errores');
const { ErrorRepositorio, CODIGOS } = require('../../app/repos/errores');

// Tarea 2.3 — Requirement: Traducción de errores al formato del contrato.

describe('tabla de mapeo del contrato (códigos de la base de datos)', () => {
  test.each([
    [51001, 409, 'ASIENTO_NO_DISPONIBLE'],
    [51002, 409, 'CORREO_REGISTRADO'],
    [51003, 409, 'RESERVA_PAGADA'],
    [52001, 410, 'RESERVA_VENCIDA'],
    [52002, 410, 'RESERVA_LIBERADA'],
    [53001, 422, 'LIMITE_EXCEDIDO'],
    [53002, 400, 'SOLICITUD_INVALIDA'],
    [53003, 400, 'SOLICITUD_INVALIDA'],
    [53004, 500, 'ERROR_INTERNO'],
    [53005, 400, 'SOLICITUD_INVALIDA'],
    [53006, 400, 'SOLICITUD_INVALIDA'],
    [53007, 400, 'SOLICITUD_INVALIDA'],
    [53008, 400, 'SOLICITUD_INVALIDA'],
    [54001, 404, 'NO_ENCONTRADO'],
    [54003, 404, 'NO_ENCONTRADO'],
    [54005, 404, 'NO_ENCONTRADO'],
    [50000, 500, 'ERROR_INTERNO'],
    [53999, 500, 'ERROR_INTERNO'],
  ])('%i → %i %s', (numero, status, codigo) => {
    expect(traducirError(new ErrorRepositorio(numero, 'texto de la BD'))).toMatchObject({ status, codigo });
    expect(codigoDeBaseDatos(numero)).toBe(codigo);
  });

  test('no expone el mensaje original de la base de datos', () => {
    const r = traducirError(new ErrorRepositorio(52001, 'THROW 52001 spReservas_Pagar @ReservaId=7'));
    expect(r.mensaje).not.toMatch(/THROW|sp|@/);
  });

  test('RequestError de mssql con number se traduce con la misma tabla', () => {
    const err = Object.assign(new Error('detalle interno'), { name: 'RequestError', number: 51001 });
    expect(traducirError(err)).toMatchObject({ status: 409, codigo: 'ASIENTO_NO_DISPONIBLE' });
  });
});

describe('ErrorRepositorio del repositorio en memoria (códigos de API)', () => {
  test.each([
    [CODIGOS.SOLICITUD_INVALIDA, 400],
    [CODIGOS.NO_ENCONTRADO, 404],
    [CODIGOS.ASIENTO_NO_DISPONIBLE, 409],
    [CODIGOS.RESERVA_PAGADA, 409],
    [CODIGOS.RESERVA_VENCIDA, 410],
    [CODIGOS.RESERVA_LIBERADA, 410],
    [CODIGOS.LIMITE_EXCEDIDO, 422],
    ['CORREO_REGISTRADO', 409],
    ['NO_AUTENTICADO', 401],
  ])('%s → %i y conserva mensaje y detalles', (codigo, status) => {
    const r = traducirError(new ErrorRepositorio(codigo, 'Mensaje del dominio.', { campo: 'x' }));
    expect(r).toEqual({ status, codigo, mensaje: 'Mensaje del dominio.', detalles: { campo: 'x' } });
  });

  test('un código desconocido → 500 ERROR_INTERNO sin detalles', () => {
    const r = traducirError(new ErrorRepositorio('OTRA_COSA', 'secreto', { dato: 1 }));
    expect(r).toEqual({ status: 500, codigo: 'ERROR_INTERNO', mensaje: expect.any(String) });
    expect(r.mensaje).not.toMatch(/secreto/);
  });
});

describe('manejador de errores en Express', () => {
  function appQueFalla(err, registrar) {
    const app = express();
    app.use(express.json());
    app.post('/x', () => {
      throw err;
    });
    app.use(crearManejadorErrores({ entorno: 'development', registrar }));
    return app;
  }

  test('responde con el formato del esquema Error', async () => {
    const detalles = { asientoIds: ['A8'] };
    const res = await request(appQueFalla(new ErrorRepositorio(CODIGOS.ASIENTO_NO_DISPONIBLE, 'Ocupado.', detalles), jest.fn())).post('/x');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { codigo: 'ASIENTO_NO_DISPONIBLE', mensaje: 'Ocupado.', detalles } });
  });

  test('JSON mal formado → 400 SOLICITUD_INVALIDA', async () => {
    const res = await request(appQueFalla(new Error('no se usa'), jest.fn()))
      .post('/x')
      .set('Content-Type', 'application/json')
      .send('{"mal":');
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('SOLICITUD_INVALIDA');
  });

  test('error inesperado → 500 sin trazas y se registra sin el mensaje', async () => {
    const registrar = jest.fn();
    const res = await request(appQueFalla(new Error('contraseña=1234 en la traza'), registrar)).post('/x');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { codigo: 'ERROR_INTERNO', mensaje: expect.any(String) } });
    expect(JSON.stringify(res.body)).not.toMatch(/1234|traza/);
    expect(registrar).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(registrar.mock.calls[0])).not.toMatch(/1234/);
  });

  test('un error 4xx no se registra en log', async () => {
    const registrar = jest.fn();
    await request(appQueFalla(new ErrorRepositorio(CODIGOS.NO_ENCONTRADO, 'No.'), registrar)).post('/x');
    expect(registrar).not.toHaveBeenCalled();
  });
});
