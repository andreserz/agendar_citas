/* Adaptador HTTP del contrato `/api/v1` de citas_service. */

import { ErrorApp, ErrorRed, normalizarErrorApi } from './errors.js';
import { leerSesion } from './session.js';
import { normalizarCorreo } from './utils.js';

export class ApiCliente {
  constructor(config) {
    this.config = config;
    this.base = String(config.apiBaseUrl || '').replace(/\/+$/, '');
  }

  get disponible() {
    return Boolean(this.base);
  }

  _url(ruta, parametros = null) {
    const url = new URL(`${this.base}${ruta}`);
    if (parametros) {
      for (const [clave, valor] of Object.entries(parametros)) {
        if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(clave, valor);
      }
    }
    return url.toString();
  }

  async _peticion(ruta, { metodo = 'GET', cuerpo, autenticado = false, parametros, tiempoEspera } = {}) {
    if (!this.base) throw new ErrorRed('No hay URL de API configurada.');
    const sesion = leerSesion();
    if (autenticado && !sesion?.token) {
      throw new ErrorApp('NO_AUTENTICADO', 'Inicia sesión para continuar.', 401);
    }

    const controlador = new AbortController();
    const ms = tiempoEspera ?? this.config.tiempoEsperaMs ?? 2200;
    const temporizador = setTimeout(() => controlador.abort(), ms);

    const encabezados = {
      Accept: 'application/json',
      'X-Sitio': this.config.sitio || 'web_1',
    };
    if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
    if (autenticado && sesion?.token) encabezados.Authorization = `Bearer ${sesion.token}`;

    let respuesta;
    try {
      respuesta = await fetch(this._url(ruta, parametros), {
        method: metodo,
        headers: encabezados,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        signal: controlador.signal,
        mode: 'cors',
        credentials: 'omit',
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new ErrorRed('El servicio tardó demasiado en responder.');
      }
      throw new ErrorRed('No se pudo conectar con el servicio de citas.');
    } finally {
      clearTimeout(temporizador);
    }

    if (respuesta.status === 204) return null;

    let datos = null;
    const texto = await respuesta.text().catch(() => '');
    if (texto) {
      try {
        datos = JSON.parse(texto);
      } catch {
        datos = null;
      }
    }

    if (!respuesta.ok) {
      if (!datos) {
        throw new ErrorApp('ERROR_INTERNO', 'El servicio respondió de forma inesperada.', respuesta.status);
      }
      throw normalizarErrorApi(datos, respuesta.status);
    }
    return datos;
  }

  async probarConexion(tiempoEspera = 1200) {
    const datos = await this._peticion('/eventos', { tiempoEspera });
    return Array.isArray(datos?.eventos);
  }

  listarEventos() {
    return this._peticion('/eventos');
  }

  obtenerEvento(eventoId) {
    return this._peticion(`/eventos/${encodeURIComponent(eventoId)}`);
  }

  listarFunciones(eventoId) {
    return this._peticion(`/eventos/${encodeURIComponent(eventoId)}/funciones`);
  }

  obtenerFuncion(funcionId) {
    return this._peticion(`/funciones/${encodeURIComponent(funcionId)}`);
  }

  listarAsientos(funcionId) {
    return this._peticion(`/funciones/${encodeURIComponent(funcionId)}/asientos`);
  }

  crearReserva(datos) {
    return this._peticion('/reservas', { metodo: 'POST', cuerpo: datos, autenticado: true });
  }

  obtenerReserva(reservaId) {
    return this._peticion(`/reservas/${encodeURIComponent(reservaId)}`, { autenticado: true });
  }

  listarReservas({ estado = 'activa' } = {}) {
    return this._peticion('/reservas', { autenticado: true, parametros: { estado } });
  }

  liberarReserva(reservaId) {
    return this._peticion(`/reservas/${encodeURIComponent(reservaId)}`, {
      metodo: 'DELETE',
      autenticado: true,
    });
  }

  pagarReserva(reservaId, datosPago) {
    return this._peticion(`/reservas/${encodeURIComponent(reservaId)}/pago`, {
      metodo: 'POST',
      cuerpo: datosPago,
      autenticado: true,
    });
  }

  listarOrdenes() {
    return this._peticion('/ordenes', { autenticado: true });
  }

  obtenerOrden(ordenId) {
    return this._peticion(`/ordenes/${encodeURIComponent(ordenId)}`, { autenticado: true });
  }

  registrar({ nombre, correo, contrasena }) {
    return this._peticion('/auth/registro', {
      metodo: 'POST',
      cuerpo: { nombre, correo: normalizarCorreo(correo), contrasena },
    });
  }

  login({ correo, contrasena }) {
    return this._peticion('/auth/login', {
      metodo: 'POST',
      cuerpo: { correo: normalizarCorreo(correo), contrasena },
    });
  }
}
