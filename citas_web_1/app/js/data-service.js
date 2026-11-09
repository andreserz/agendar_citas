/* Fachada de datos: elige API real o demo local, con respaldo automático y errores claros. */

import { ApiCliente } from './api-client.js';
import * as demo from './demo-service.js';
import { esErrorRed } from './errors.js';
import { cerrarSesion, guardarSesion, leerSesion } from './session.js';

const valoresPorDefecto = {
  apiBaseUrl: 'http://localhost:3000/api/v1',
  swaggerUrl: 'http://localhost:3000/docs',
  sitio: 'web_1',
  modo: 'auto',
  tiempoEsperaMs: 2200,
  respaldoDemoAutomatico: true,
  maxAsientos: 10,
  duracionReservaSegundos: 300,
};

export const config = Object.freeze({
  ...valoresPorDefecto,
  ...(typeof window !== 'undefined' ? window.CITAS_CONFIG || {} : {}),
});

export const CUENTA_DEMO = demo.CUENTA_DEMO;

class ServicioDatos {
  constructor() {
    this.api = new ApiCliente(config);
    this.modo = 'demo';
    this.motivo = 'Datos locales de demostración.';
    this.iniciado = false;
    this.enLinea = false;
  }

  get estado() {
    return { modo: this.modo, motivo: this.motivo, enLinea: this.enLinea, apiBaseUrl: config.apiBaseUrl };
  }

  async iniciar() {
    if (this.iniciado) return this.estado;
    await demo.iniciarDemo();
    const modoSolicitado = String(config.modo || 'auto').toLowerCase();

    if (modoSolicitado === 'demo') {
      this.modo = 'demo';
      this.motivo = 'Modo demo forzado en la configuración.';
    } else if (modoSolicitado === 'api') {
      this.modo = 'api';
      try {
        await this.api.probarConexion();
        this.enLinea = true;
        this.motivo = 'Conectado a citas_service.';
      } catch {
        this.enLinea = false;
        this.motivo = 'No se pudo conectar con citas_service. Revisa que la API esté en línea.';
      }
    } else {
      try {
        await this.api.probarConexion();
        this.modo = 'api';
        this.enLinea = true;
        this.motivo = 'Conectado a citas_service.';
      } catch {
        this.modo = 'demo';
        this.enLinea = false;
        this.motivo = 'La API no respondió; la demo funciona con datos locales.';
      }
    }

    this.iniciado = true;
    this._limpiarSesionSiNoCorresponde();
    this._notificarModo();
    return this.estado;
  }

  _limpiarSesionSiNoCorresponde() {
    const sesion = leerSesion();
    if (!sesion) return;
    if (sesion.origen && sesion.origen !== this.modo) cerrarSesion();
  }

  _notificarModo() {
    try {
      window.dispatchEvent(new CustomEvent('cw1:modo', { detail: this.estado }));
    } catch {
      /* entorno sin window */
    }
  }

  cambiarModo(modo, motivo = '') {
    const siguiente = modo === 'api' ? 'api' : 'demo';
    if (siguiente === this.modo) return this.estado;
    this.modo = siguiente;
    this.enLinea = siguiente === 'api';
    this.motivo = motivo || (siguiente === 'demo' ? 'Modo demo activo.' : 'Modo API activo.');
    cerrarSesion();
    this._notificarModo();
    return this.estado;
  }

  async _llamar(nombre, args = []) {
    if (!this.iniciado) await this.iniciar();
    const ejecutarDemo = () => demo[nombre](...args);

    if (this.modo !== 'api') return ejecutarDemo();

    try {
      const resultado = await this.api[nombre](...args);
      this.enLinea = true;
      return resultado;
    } catch (error) {
      if (esErrorRed(error) && config.respaldoDemoAutomatico && String(config.modo).toLowerCase() === 'auto') {
        this.cambiarModo('demo', 'La API dejó de responder. Cambiamos a datos de demostración.');
        return ejecutarDemo();
      }
      if (esErrorRed(error)) this.enLinea = false;
      throw error;
    }
  }

  /* Catálogo */
  listarEventos() {
    return this._llamar('listarEventos');
  }

  obtenerEvento(eventoId) {
    return this._llamar('obtenerEvento', [eventoId]);
  }

  listarFunciones(eventoId) {
    return this._llamar('listarFunciones', [eventoId]);
  }

  obtenerFuncion(funcionId) {
    return this._llamar('obtenerFuncion', [funcionId]);
  }

  listarAsientos(funcionId) {
    return this._llamar('listarAsientos', [funcionId]);
  }

  /* Reservas */
  crearReserva(datos) {
    return this._llamar('crearReserva', [datos]);
  }

  obtenerReserva(reservaId) {
    return this._llamar('obtenerReserva', [reservaId]);
  }

  listarReservas(opciones = {}) {
    return this._llamar('listarReservas', [opciones]);
  }

  liberarReserva(reservaId) {
    return this._llamar('liberarReserva', [reservaId]);
  }

  pagarReserva(reservaId, datosPago) {
    return this._llamar('pagarReserva', [reservaId, datosPago]);
  }

  /* Órdenes */
  listarOrdenes() {
    return this._llamar('listarOrdenes');
  }

  obtenerOrden(ordenId) {
    return this._llamar('obtenerOrden', [ordenId]);
  }

  /* Cuenta */
  async registrar(datos) {
    const sesion = await this._llamar('registrar', [datos]);
    return this._guardarSesion(sesion);
  }

  async login(datos) {
    const sesion = await this._llamar('login', [datos]);
    return this._guardarSesion(sesion);
  }

  _guardarSesion(sesion) {
    const conOrigen = { ...sesion, origen: this.modo };
    guardarSesion(conOrigen);
    return conOrigen;
  }

  cerrarSesion() {
    cerrarSesion();
  }

  async reiniciarDemo() {
    if (this.modo !== 'demo') this.cambiarModo('demo', 'Datos de demostración reiniciados.');
    cerrarSesion();
    await demo.reiniciarDemo();
    this.motivo = 'Datos de demostración reiniciados.';
    this._notificarModo();
    return this.estado;
  }
}

export const datos = new ServicioDatos();
