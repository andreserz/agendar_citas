'use strict';

/**
 * Códigos que lanzan los repositorios. Son los mismos del esquema `Error` de
 * docs/specs/openapi.yaml, para que la capa de API sólo decida el status HTTP.
 *
 * Equivalencia prevista con los THROW del backend (BCK_DEFINICION.md §5.6), para ADR-004:
 *   ASIENTO_NO_DISPONIBLE ← 51001        RESERVA_VENCIDA   ← 52001
 *   RESERVA_PAGADA / RESERVA_LIBERADA ← 51003 (el backend no los distingue)
 *   LIMITE_EXCEDIDO       ← 53001        SOLICITUD_INVALIDA ← 53002, 53003, 53004
 *   NO_ENCONTRADO         ← 54001–54005  CORREO_REGISTRADO ← 51002
 */
const CODIGOS = Object.freeze({
  SOLICITUD_INVALIDA: 'SOLICITUD_INVALIDA',
  NO_ENCONTRADO: 'NO_ENCONTRADO',
  ASIENTO_NO_DISPONIBLE: 'ASIENTO_NO_DISPONIBLE',
  LIMITE_EXCEDIDO: 'LIMITE_EXCEDIDO',
  RESERVA_PAGADA: 'RESERVA_PAGADA',
  RESERVA_VENCIDA: 'RESERVA_VENCIDA',
  RESERVA_LIBERADA: 'RESERVA_LIBERADA',
});

class ErrorRepositorio extends Error {
  constructor(codigo, mensaje, detalles) {
    super(mensaje);
    this.name = 'ErrorRepositorio';
    this.codigo = codigo;
    if (detalles !== undefined) this.detalles = detalles;
  }
}

class NoImplementado extends Error {
  constructor(metodo) {
    super(`${metodo} no está implementado en este repositorio.`);
    this.name = 'NoImplementado';
  }
}

module.exports = { CODIGOS, ErrorRepositorio, NoImplementado };
