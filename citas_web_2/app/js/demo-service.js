import {
  CODIGO_BOLETO_RE, crearAsientosDemo, crearFuncionesDemo, etiquetaAsiento,
  fechaCDMX, precioFuncion, TARJETA_APROBADA, TARJETA_RECHAZADA, validarTarjeta,
} from './domain.js';
import { ErrorApp } from './errors.js';

const LLAVE = 'citas-web2-demo-v1';
const evento = {
  id: 'evt-spiderman', sitio: 'web_2', nombre: 'Spider-Man',
  recinto: 'Cineclub', descripcion: 'Elige una función y disfruta la película en pantalla grande.',
};

function leerPersistencia() {
  try {
    const guardado = JSON.parse(localStorage.getItem(LLAVE) || '{}');
    return { reservas: guardado.reservas || [], ordenes: guardado.ordenes || [] };
  } catch {
    return { reservas: [], ordenes: [] };
  }
}

function guardarPersistencia(datos) {
  try { localStorage.setItem(LLAVE, JSON.stringify(datos)); } catch { /* la sesión sigue operativa sin persistencia */ }
}

function isoCDMX(fecha) {
  return `${new Date(fecha.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, -1)}-06:00`;
}

function copiar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

export class DemoService {
  constructor({ ahora = () => new Date(), almacenamiento = null } = {}) {
    this.ahora = ahora;
    this.funciones = crearFuncionesDemo();
    this.persistente = almacenamiento === null;
    this.datos = almacenamiento || leerPersistencia();
  }

  _guardar() { guardarPersistencia(this.datos); }
  _sincronizar() { if (this.persistente) this.datos = leerPersistencia(); }
  _buscarFuncion(id) { return this.funciones.find((funcion) => funcion.id === id); }
  _buscarReserva(id) { return this.datos.reservas.find((reserva) => reserva.id === id); }

  async listarEventos() { return [copiar(evento)]; }
  async listarFunciones(eventoId) { return copiar(this.funciones.filter((funcion) => funcion.eventoId === eventoId)); }
  async obtenerFuncion(funcionId) {
    const funcion = this._buscarFuncion(funcionId);
    if (!funcion) throw new ErrorApp('NO_ENCONTRADO', undefined, 404);
    return copiar(funcion);
  }

  async listarAsientos(funcionId) {
    this._sincronizar();
    const funcion = this._buscarFuncion(funcionId);
    if (!funcion) throw new ErrorApp('NO_ENCONTRADO', undefined, 404);
    const comprados = new Set();
    const apartados = new Set();
    for (const orden of this.datos.ordenes) {
      if (orden.funcionId === funcionId) for (const boleto of orden.boletos) comprados.add(boleto.etiqueta);
    }
    for (const reserva of this.datos.reservas) {
      if (reserva.funcionId !== funcionId || reserva.estado !== 'activa' || Date.parse(reserva.expiraEn) <= this.ahora().getTime()) continue;
      for (const asiento of reserva.asientos) apartados.add(asiento.etiqueta);
    }
    return crearAsientosDemo(funcionId, comprados).map((asiento) => ({
      ...asiento,
      precio: precioFuncion(funcion),
      estado: asiento.estado === 'comprado' || comprados.has(asiento.etiqueta)
        ? 'comprado'
        : (apartados.has(asiento.etiqueta) ? 'apartado' : 'disponible'),
    }));
  }

  async crearReserva({ funcionId, asientoIds }) {
    this._sincronizar();
    const funcion = this._buscarFuncion(funcionId);
    if (!funcion) throw new ErrorApp('NO_ENCONTRADO', undefined, 404);
    if (!Array.isArray(asientoIds) || !asientoIds.length || asientoIds.length > 10 || new Set(asientoIds).size !== asientoIds.length) {
      throw new ErrorApp('SOLICITUD_INVALIDA', 'Elige entre una y diez butacas distintas.', 400);
    }
    const asientos = await this.listarAsientos(funcionId);
    const enConflicto = asientoIds.filter((id) => asientos.find((asiento) => asiento.id === id)?.estado !== 'disponible');
    if (enConflicto.length) throw new ErrorApp('ASIENTO_NO_DISPONIBLE', undefined, 409, { asientoIds: enConflicto });
    const creada = this.ahora();
    const reserva = {
      id: globalThis.crypto?.randomUUID?.() || `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sitio: 'web_2', funcionId, estado: 'activa',
      asientos: asientoIds.map((id) => {
        const asiento = asientos.find((item) => item.id === id);
        return { asientoId: asiento.id, etiqueta: asiento.etiqueta, zonaId: asiento.zonaId, precio: precioFuncion(funcion) };
      }),
      total: asientoIds.length * precioFuncion(funcion), moneda: 'MXN',
      creadaEn: isoCDMX(creada), expiraEn: isoCDMX(new Date(creada.getTime() + 300000)), segundosRestantes: 300,
    };
    this.datos.reservas.push(reserva);
    this._guardar();
    return copiar(reserva);
  }

  async obtenerReserva(reservaId) {
    this._sincronizar();
    const reserva = this._buscarReserva(reservaId);
    if (!reserva) throw new ErrorApp('NO_ENCONTRADO', undefined, 404);
    const segundosRestantes = Math.max(0, Math.floor((Date.parse(reserva.expiraEn) - this.ahora().getTime()) / 1000));
    if (reserva.estado === 'activa' && segundosRestantes === 0) reserva.estado = 'vencida';
    reserva.segundosRestantes = segundosRestantes;
    this._guardar();
    return copiar(reserva);
  }

  async liberarReserva(reservaId) {
    this._sincronizar();
    const reserva = this._buscarReserva(reservaId);
    if (!reserva) throw new ErrorApp('NO_ENCONTRADO', undefined, 404);
    if (Date.parse(reserva.expiraEn) <= this.ahora().getTime() || reserva.estado === 'vencida') {
      reserva.estado = 'vencida'; this._guardar();
      throw new ErrorApp('RESERVA_VENCIDA', undefined, 410);
    }
    if (reserva.estado === 'pagada') throw new ErrorApp('RESERVA_PAGADA', undefined, 409);
    if (reserva.estado === 'liberada') throw new ErrorApp('RESERVA_LIBERADA', undefined, 410);
    reserva.estado = 'liberada'; this._guardar();
    return null;
  }

  async pagarReserva(reservaId, datosPago) {
    this._sincronizar();
    const reserva = this._buscarReserva(reservaId);
    if (!reserva) throw new ErrorApp('NO_ENCONTRADO', undefined, 404);
    const actual = await this.obtenerReserva(reservaId);
    if (actual.estado === 'vencida') throw new ErrorApp('RESERVA_VENCIDA', undefined, 410);
    if (actual.estado === 'liberada') throw new ErrorApp('RESERVA_LIBERADA', undefined, 410);
    if (actual.estado === 'pagada') throw new ErrorApp('RESERVA_PAGADA', undefined, 409);
    const validacion = validarTarjeta(datosPago);
    if (!validacion.valido) throw new ErrorApp('SOLICITUD_INVALIDA', 'Revisa los datos de la tarjeta.', 400, { campos: validacion.errores });
    const aprobada = String(datosPago.numeroTarjeta).replace(/\D/g, '') === TARJETA_APROBADA;
    if (!aprobada && String(datosPago.numeroTarjeta).replace(/\D/g, '') !== TARJETA_RECHAZADA) {
      throw new ErrorApp('SOLICITUD_INVALIDA', 'Usa una tarjeta de prueba válida.', 400, { campo: 'numeroTarjeta' });
    }
    if (!aprobada) return { resultado: 'rechazado', simulado: true, reserva: actual };

    reserva.estado = 'pagada';
    const funcion = this._buscarFuncion(reserva.funcionId);
    const orden = {
      id: globalThis.crypto?.randomUUID?.() || `orden-${Date.now()}`,
      folio: `ORD-${String(this.datos.ordenes.length + 1).padStart(6, '0')}`,
      reservaId: reserva.id, sitio: 'web_2', fecha: isoCDMX(this.ahora()),
      funcionId: reserva.funcionId, funcionInicio: funcion.inicio, sala: funcion.sala,
      formato: funcion.formato, total: reserva.total, moneda: 'MXN',
      boletos: reserva.asientos.map((asiento) => ({
        codigo: this._codigoBoleto(), etiqueta: asiento.etiqueta, asientoId: asiento.asientoId,
        zonaId: asiento.zonaId, precio: asiento.precio, eventoNombre: evento.nombre,
        inicio: funcion.inicio, sala: funcion.sala, formato: funcion.formato,
      })),
    };
    reserva.ordenId = orden.id;
    this.datos.ordenes.push(orden);
    this._guardar();
    return { resultado: 'aprobado', simulado: true, reserva: copiar(reserva), orden: copiar(orden) };
  }

  _codigoBoleto() {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 12 }, () => caracteres[Math.floor(Math.random() * caracteres.length)]).join('');
  }

  async obtenerOrden(ordenId) {
    this._sincronizar();
    const orden = this.datos.ordenes.find((item) => item.id === ordenId || item.folio === ordenId);
    if (!orden) throw new ErrorApp('NO_ENCONTRADO', undefined, 404);
    return copiar(orden);
  }

  async buscarOrden(folio) {
    this._sincronizar();
    const orden = this.datos.ordenes.find((item) => item.folio === folio);
    if (!orden) throw new ErrorApp('NO_ENCONTRADO', 'No encontramos una compra con ese folio.', 404);
    return copiar(orden);
  }

  async reporteReservas({ desde, hasta }) {
    this._sincronizar();
    if (!desde || !hasta || desde > hasta || (Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86400000 > 91) {
      throw new ErrorApp('SOLICITUD_INVALIDA', 'Elige un rango válido de hasta 92 días.', 400);
    }
    const reales = new Map();
    for (const reserva of this.datos.reservas) {
      const dia = fechaCDMX(new Date(reserva.creadaEn));
      reales.set(dia, (reales.get(dia) || 0) + 1);
    }
    const resultado = [];
    for (let instante = Date.parse(`${desde}T12:00:00Z`); instante <= Date.parse(`${hasta}T12:00:00Z`); instante += 86400000) {
      const fecha = new Date(instante).toISOString().slice(0, 10);
      const hash = [...fecha].reduce((acc, caracter) => (acc * 31 + caracter.charCodeAt(0)) >>> 0, 7);
      resultado.push({ dia: fecha, total: reales.get(fecha) || (hash % 18) + 4 });
    }
    return resultado;
  }
}

export function crearDemoService(opciones) {
  return new DemoService(opciones);
}
