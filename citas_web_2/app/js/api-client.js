import { ErrorApp, normalizarError } from './errors.js';

export class ApiCliente {
  constructor(config = {}, fetcher = (...args) => fetch(...args)) {
    this.config = config;
    this.fetcher = fetcher;
    this.base = String(config.apiBaseUrl || '').replace(/\/+$/, '');
  }

  _url(ruta, parametros) {
    const url = new URL(`${this.base}${ruta}`);
    for (const [clave, valor] of Object.entries(parametros || {})) {
      if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(clave, valor);
    }
    return url.toString();
  }

  async _request(ruta, { metodo = 'GET', cuerpo, parametros } = {}) {
    if (!this.base) throw new ErrorApp('ERROR_INTERNO', 'Falta configurar la URL del servicio.');
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), Number(this.config.tiempoEsperaMs) || 2200);
    const headers = { Accept: 'application/json', 'X-Sitio': this.config.sitio || 'web_2' };
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
    let respuesta;
    try {
      respuesta = await this.fetcher(this._url(ruta, parametros), {
        method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        signal: controlador.signal, mode: 'cors', credentials: 'omit',
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw new ErrorApp('ERROR_RED', 'El servicio tardó demasiado en responder.');
      throw new ErrorApp('ERROR_RED', 'No se pudo conectar con el servicio.');
    } finally {
      clearTimeout(temporizador);
    }
    if (respuesta.status === 204) return null;
    const texto = await respuesta.text().catch(() => '');
    let datos = null;
    try { datos = texto ? JSON.parse(texto) : null; } catch { datos = null; }
    if (!respuesta.ok) throw normalizarError(datos, respuesta.status);
    return datos;
  }

  async probarConexion() {
    const datos = await this._request('/eventos');
    return Array.isArray(datos?.eventos ?? datos);
  }

  async listarEventos() {
    const datos = await this._request('/eventos');
    return datos?.eventos ?? datos ?? [];
  }

  async listarFunciones(eventoId) {
    const datos = await this._request(`/eventos/${encodeURIComponent(eventoId)}/funciones`);
    return datos?.funciones ?? datos ?? [];
  }

  async obtenerFuncion(funcionId) {
    const datos = await this._request(`/funciones/${encodeURIComponent(funcionId)}`);
    return datos?.funcion ?? datos;
  }

  async listarAsientos(funcionId) {
    const datos = await this._request(`/funciones/${encodeURIComponent(funcionId)}/asientos`);
    return datos?.asientos ?? datos ?? [];
  }

  async crearReserva({ funcionId, asientoIds }) {
    const datos = await this._request('/reservas', { metodo: 'POST', cuerpo: { funcionId, asientoIds } });
    return datos?.reserva ?? datos;
  }

  async obtenerReserva(reservaId) {
    const datos = await this._request(`/reservas/${encodeURIComponent(reservaId)}`);
    return datos?.reserva ?? datos;
  }

  liberarReserva(reservaId) {
    return this._request(`/reservas/${encodeURIComponent(reservaId)}`, { metodo: 'DELETE' });
  }

  async pagarReserva(reservaId, datosPago) {
    const datos = await this._request(`/reservas/${encodeURIComponent(reservaId)}/pago`, { metodo: 'POST', cuerpo: datosPago });
    return datos?.pago ?? datos;
  }

  async obtenerOrden(ordenId) {
    const datos = await this._request(`/ordenes/${encodeURIComponent(ordenId)}`);
    return datos?.orden ?? datos;
  }

  async buscarOrden(folio) {
    const datos = await this._request('/ordenes/buscar', { parametros: { folio } });
    return datos?.orden ?? datos;
  }

  async reporteReservas({ desde, hasta }) {
    const datos = await this._request('/reportes/reservas-por-dia', { parametros: { desde, hasta } });
    return datos?.dias ?? datos?.reporte ?? datos?.reservas ?? datos ?? [];
  }
}
