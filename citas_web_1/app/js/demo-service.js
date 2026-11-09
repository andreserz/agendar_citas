/* Implementación de demostración del contrato de citas_service.
 * Persiste en localStorage (con respaldo en memoria) y recalcula estados con reloj real. */

import {
  DURACION_RESERVA_SEGUNDOS,
  EVENTO,
  MAX_ASIENTOS,
  MONEDA,
  ZONAS,
  buscarAsientoBase,
  buscarZona,
  calcularTotal,
  contarAsientosComprador,
  contarDisponibles,
  crearIndiceOcupacion,
  crearMapaAsientos,
  estadoAsiento,
  estadoReserva,
  generarCodigoBoleto,
  generarFunciones,
  generarNumeroOrden,
  ordenarFunciones,
  precioDeAsiento,
  reservaVigente,
  segundosRestantes,
  validarLogin,
  validarPago,
  validarRegistro,
} from './domain.js';
import { ErrorApp } from './errors.js';
import { leerSesion } from './session.js';
import { almacen, generarId, hash32, normalizarCorreo } from './utils.js';

const CLAVE = 'citas_web_1.demo.v1';
const VERSION = 2;
export const CUENTA_DEMO = { correo: 'demo@teatro.mx', contrasena: 'Demo1234!' };

let estado = null;
let inicializando = null;

function ahoraIso() {
  return new Date().toISOString();
}

export async function hashContrasena(contrasena, salt) {
  const texto = `${contrasena}::${salt}`;
  try {
    if (globalThis.crypto?.subtle && globalThis.TextEncoder) {
      const bytes = new TextEncoder().encode(texto);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    /* respaldo simple sólo para demo */
  }
  return `demo-${hash32(texto).toString(16)}`;
}

function estadoBase() {
  return {
    version: VERSION,
    usuarios: [],
    reservas: [],
    ordenes: [],
    intentos: [],
    contadores: { orden: 0 },
  };
}

function normalizarEstado(datos) {
  const base = estadoBase();
  if (!datos || typeof datos !== 'object') return base;
  return {
    ...base,
    ...datos,
    usuarios: Array.isArray(datos.usuarios) ? datos.usuarios : [],
    reservas: Array.isArray(datos.reservas) ? datos.reservas : [],
    ordenes: Array.isArray(datos.ordenes) ? datos.ordenes : [],
    intentos: Array.isArray(datos.intentos) ? datos.intentos : [],
    contadores: { orden: Number(datos.contadores?.orden) || 0 },
    version: VERSION,
  };
}

function guardar() {
  if (estado) almacen.guardar(CLAVE, estado);
}

async function crearUsuarioDemo() {
  const salt = 'teatro-demo';
  return {
    id: 'cmp-demo',
    nombre: 'Ana Demo',
    correo: CUENTA_DEMO.correo,
    salt,
    hash: await hashContrasena(CUENTA_DEMO.contrasena, salt),
    creadoEn: ahoraIso(),
  };
}

export async function iniciarDemo() {
  if (estado) return estado;
  if (inicializando) return inicializando;
  inicializando = (async () => {
    const guardado = almacen.leer(CLAVE, null);
    estado = normalizarEstado(guardado);
    if (!estado.usuarios.some((u) => normalizarCorreo(u.correo) === CUENTA_DEMO.correo)) {
      estado.usuarios.push(await crearUsuarioDemo());
    }
    // Sanea reservas antiguas sin dueño para no romper la demo.
    estado.reservas = estado.reservas.filter((r) => r && r.id && r.funcionId);
    guardar();
    return estado;
  })();
  return inicializando;
}

export async function reiniciarDemo() {
  estado = null;
  inicializando = null;
  almacen.borrar(CLAVE);
  return iniciarDemo();
}

function funcionPorId(funcionId) {
  return generarFunciones().find((f) => f.id === funcionId) || null;
}

function compradorActual() {
  const sesion = leerSesion();
  if (!sesion?.comprador?.id) {
    throw new ErrorApp('NO_AUTENTICADO', 'Inicia sesión para continuar.', 401);
  }
  return sesion.comprador;
}

function usuarioPorId(id) {
  return estado.usuarios.find((u) => u.id === id) || null;
}

function serializarReserva(reserva, ahora = new Date()) {
  if (!reserva) return null;
  return {
    ...reserva,
    estado: estadoReserva(reserva, ahora),
    segundosRestantes: segundosRestantes(reserva, ahora),
  };
}

function crearSesion(usuario) {
  const expira = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  return {
    token: `demo.${usuario.id}.${generarId('t', 8)}`,
    expiraEn: expira,
    comprador: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo },
  };
}

/* ------------------------------- Catálogo ------------------------------- */

export async function listarEventos() {
  await iniciarDemo();
  return {
    eventos: [
      {
        id: EVENTO.id,
        nombre: EVENTO.nombre,
        descripcion: EVENTO.descripcion,
        recinto: EVENTO.recinto,
        sitio: EVENTO.sitio,
      },
    ],
  };
}

export async function obtenerEvento(eventoId) {
  await iniciarDemo();
  if (eventoId !== EVENTO.id) throw new ErrorApp('NO_ENCONTRADO', 'El evento no existe.', 404);
  return {
    id: EVENTO.id,
    nombre: EVENTO.nombre,
    descripcion: EVENTO.descripcion,
    recinto: EVENTO.recinto,
    sitio: EVENTO.sitio,
  };
}

export async function listarFunciones(eventoId) {
  await iniciarDemo();
  if (eventoId !== EVENTO.id) throw new ErrorApp('NO_ENCONTRADO', 'El evento no existe.', 404);
  const ahora = new Date();
  const indice = crearIndiceOcupacion({ reservas: estado.reservas, ordenes: estado.ordenes, ahora });
  return {
    funciones: ordenarFunciones(generarFunciones()).map((funcion) => ({
      ...funcion,
      asientosDisponibles: contarDisponibles(funcion.id, indice),
    })),
  };
}

export async function obtenerFuncion(funcionId) {
  await iniciarDemo();
  const funcion = funcionPorId(funcionId);
  if (!funcion) throw new ErrorApp('NO_ENCONTRADO', 'La función no existe.', 404);
  const ahora = new Date();
  const indice = crearIndiceOcupacion({ reservas: estado.reservas, ordenes: estado.ordenes, ahora });
  return { ...funcion, asientosDisponibles: contarDisponibles(funcion.id, indice) };
}

export async function listarAsientos(funcionId) {
  await iniciarDemo();
  const funcion = funcionPorId(funcionId);
  if (!funcion) throw new ErrorApp('NO_ENCONTRADO', 'La función no existe.', 404);
  const ahora = new Date();
  const indice = crearIndiceOcupacion({ reservas: estado.reservas, ordenes: estado.ordenes, ahora });
  return crearMapaAsientos(funcion, indice, { ahora });
}

/* ------------------------------- Reservas ------------------------------- */

function validarAsientosSolicitados(funcionId, asientoIds) {
  if (!funcionPorId(funcionId)) {
    throw new ErrorApp('NO_ENCONTRADO', 'La función no existe.', 404);
  }
  if (!Array.isArray(asientoIds) || asientoIds.length < 1 || asientoIds.length > MAX_ASIENTOS) {
    throw new ErrorApp('SOLICITUD_INVALIDA', `Selecciona entre 1 y ${MAX_ASIENTOS} asientos.`, 400, {
      campo: 'asientoIds',
    });
  }
  if (new Set(asientoIds).size !== asientoIds.length) {
    throw new ErrorApp('SOLICITUD_INVALIDA', 'Hay asientos repetidos en la selección.', 400, {
      campo: 'asientoIds',
    });
  }
  const base = asientoIds.map((id) => buscarAsientoBase(id));
  if (base.some((a) => !a)) {
    throw new ErrorApp('NO_ENCONTRADO', 'Uno de los asientos no existe.', 404);
  }
  return base;
}

export async function crearReserva({ funcionId, asientoIds } = {}) {
  await iniciarDemo();
  const comprador = compradorActual();
  const base = validarAsientosSolicitados(funcionId, asientoIds);
  const ahora = new Date();
  const funcion = funcionPorId(funcionId);

  const contados = contarAsientosComprador({
    compradorId: comprador.id,
    funcionId,
    reservas: estado.reservas,
    ordenes: estado.ordenes,
    ahora,
  });
  if (contados + base.length > MAX_ASIENTOS) {
    throw new ErrorApp(
      'LIMITE_EXCEDIDO',
      `Sólo puedes tener ${MAX_ASIENTOS} asientos en esta función.`,
      422,
      { maximo: MAX_ASIENTOS, actuales: contados, solicitados: base.length }
    );
  }

  const indice = crearIndiceOcupacion({ reservas: estado.reservas, ordenes: estado.ordenes, ahora });
  const noDisponibles = base
    .filter((asiento) => estadoAsiento(funcionId, asiento.id, indice) !== 'disponible')
    .map((asiento) => asiento.id);
  if (noDisponibles.length) {
    throw new ErrorApp(
      'ASIENTO_NO_DISPONIBLE',
      'Algunos asientos ya no están disponibles. Vuelve a elegir.',
      409,
      { asientoIds: noDisponibles }
    );
  }

  const asientos = base.map((asiento) => ({
    asientoId: asiento.id,
    etiqueta: asiento.etiqueta,
    zonaId: asiento.zonaId,
    precio: precioDeAsiento(asiento.zonaId),
  }));
  const creadaEn = ahora.toISOString();
  const expiraEn = new Date(ahora.getTime() + DURACION_RESERVA_SEGUNDOS * 1000).toISOString();
  const reserva = {
    id: generarId('res', 8),
    compradorId: comprador.id,
    sitio: EVENTO.sitio,
    funcionId,
    estado: 'activa',
    asientos,
    total: calcularTotal(asientos),
    moneda: MONEDA,
    creadaEn,
    expiraEn,
    funcionInicio: funcion.inicio,
  };
  estado.reservas.push(reserva);
  guardar();
  return serializarReserva(reserva, ahora);
}

export async function obtenerReserva(reservaId) {
  await iniciarDemo();
  const comprador = compradorActual();
  const reserva = estado.reservas.find((r) => r.id === reservaId && r.compradorId === comprador.id);
  if (!reserva) throw new ErrorApp('NO_ENCONTRADO', 'La reserva no existe.', 404);
  return serializarReserva(reserva);
}

export async function listarReservas({ estado: filtro = 'activa' } = {}) {
  await iniciarDemo();
  const comprador = compradorActual();
  const ahora = new Date();
  return {
    reservas: estado.reservas
      .filter((r) => r.compradorId === comprador.id)
      .map((r) => serializarReserva(r, ahora))
      .filter((r) => (filtro ? r.estado === filtro : true))
      .sort((a, b) => new Date(b.creadaEn) - new Date(a.creadaEn)),
  };
}

export async function liberarReserva(reservaId) {
  await iniciarDemo();
  const comprador = compradorActual();
  const reserva = estado.reservas.find((r) => r.id === reservaId && r.compradorId === comprador.id);
  if (!reserva) throw new ErrorApp('NO_ENCONTRADO', 'La reserva no existe.', 404);
  const ahora = new Date();
  const situacion = estadoReserva(reserva, ahora);
  if (situacion === 'pagada') throw new ErrorApp('RESERVA_PAGADA', 'La reserva ya fue pagada.', 409);
  if (situacion === 'liberada') throw new ErrorApp('RESERVA_LIBERADA', 'La reserva ya fue liberada.', 410);
  if (situacion === 'vencida') throw new ErrorApp('RESERVA_VENCIDA', 'La reserva venció.', 410, { expiraEn: reserva.expiraEn });
  reserva.estado = 'liberada';
  reserva.liberadaEn = ahora.toISOString();
  guardar();
  return null;
}

/* -------------------------------- Pagos -------------------------------- */

export async function pagarReserva(reservaId, datosPago = {}) {
  await iniciarDemo();
  const comprador = compradorActual();
  const reserva = estado.reservas.find((r) => r.id === reservaId && r.compradorId === comprador.id);
  if (!reserva) throw new ErrorApp('NO_ENCONTRADO', 'La reserva no existe.', 404);

  const ahora = new Date();
  const situacion = estadoReserva(reserva, ahora);
  if (situacion === 'pagada') throw new ErrorApp('RESERVA_PAGADA', 'La reserva ya fue pagada.', 409);
  if (situacion === 'liberada') throw new ErrorApp('RESERVA_LIBERADA', 'La reserva fue liberada.', 410);
  if (situacion === 'vencida' || !reservaVigente(reserva, ahora)) {
    throw new ErrorApp('RESERVA_VENCIDA', 'La reserva venció; vuelve a seleccionar tus asientos.', 410, {
      expiraEn: reserva.expiraEn,
    });
  }

  const validacion = validarPago(datosPago, ahora);
  if (!validacion.valido) {
    const campo = Object.keys(validacion.errores)[0];
    throw new ErrorApp('SOLICITUD_INVALIDA', validacion.errores[campo], 400, { campo });
  }

  const intento = {
    id: generarId('pag', 6),
    reservaId,
    compradorId: comprador.id,
    resultado: validacion.resultado,
    simulado: true,
    fecha: ahora.toISOString(),
    ultimosDigitos: validacion.ultimosDigitos,
  };
  estado.intentos.push(intento);

  if (validacion.resultado === 'rechazado') {
    guardar();
    return {
      ...intento,
      reserva: serializarReserva(reserva, ahora),
    };
  }

  const funcion = funcionPorId(reserva.funcionId);
  estado.contadores.orden += 1;
  const numero = generarNumeroOrden(estado.contadores.orden);
  const ordenId = generarId('ord', 8);
  const boletos = reserva.asientos.map((asiento) => ({
    id: generarId('bol', 6),
    codigo: generarCodigoBoleto(),
    eventoId: EVENTO.id,
    eventoNombre: EVENTO.nombre,
    funcionId: reserva.funcionId,
    inicio: funcion?.inicio || reserva.funcionInicio || ahora.toISOString(),
    zonaId: asiento.zonaId,
    etiqueta: asiento.etiqueta,
    asientoId: asiento.asientoId,
    precio: asiento.precio,
  }));
  const orden = {
    id: ordenId,
    numero,
    reservaId,
    compradorId: comprador.id,
    sitio: EVENTO.sitio,
    fecha: ahora.toISOString(),
    total: reserva.total,
    moneda: reserva.moneda,
    pagoSimulado: true,
    correoComprador: comprador.correo,
    boletos,
  };
  reserva.estado = 'pagada';
  reserva.ordenId = ordenId;
  reserva.pagadaEn = ahora.toISOString();
  estado.ordenes.push(orden);
  guardar();

  return {
    ...intento,
    resultado: 'aprobado',
    orden,
    reserva: serializarReserva(reserva, ahora),
  };
}

export async function listarOrdenes() {
  await iniciarDemo();
  const comprador = compradorActual();
  return {
    ordenes: estado.ordenes
      .filter((o) => o.compradorId === comprador.id)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)),
  };
}

export async function obtenerOrden(ordenId) {
  await iniciarDemo();
  const comprador = compradorActual();
  const orden = estado.ordenes.find((o) => o.id === ordenId && o.compradorId === comprador.id);
  if (!orden) throw new ErrorApp('NO_ENCONTRADO', 'La orden no existe.', 404);
  return orden;
}

/* -------------------------------- Cuentas -------------------------------- */

export async function registrar(datos = {}) {
  await iniciarDemo();
  const resultado = validarRegistro(datos);
  if (!resultado.valido) {
    const campo = Object.keys(resultado.errores)[0];
    throw new ErrorApp('SOLICITUD_INVALIDA', resultado.errores[campo], 400, { campo });
  }
  const { nombre, correo, contrasena } = resultado.datos;
  if (estado.usuarios.some((u) => normalizarCorreo(u.correo) === correo)) {
    throw new ErrorApp('CORREO_REGISTRADO', 'Ese correo ya tiene una cuenta. Inicia sesión.', 409);
  }
  const salt = generarId('salt', 6);
  const usuario = {
    id: generarId('cmp', 6),
    nombre,
    correo,
    salt,
    hash: await hashContrasena(contrasena, salt),
    creadoEn: ahoraIso(),
  };
  estado.usuarios.push(usuario);
  guardar();
  return crearSesion(usuario);
}

export async function login({ correo, contrasena } = {}) {
  await iniciarDemo();
  const resultado = validarLogin({ correo, contrasena });
  if (!resultado.valido) {
    const campo = Object.keys(resultado.errores)[0];
    throw new ErrorApp('SOLICITUD_INVALIDA', resultado.errores[campo], 400, { campo });
  }
  const correoNormal = resultado.datos.correo;
  const usuario = estado.usuarios.find((u) => normalizarCorreo(u.correo) === correoNormal);
  if (!usuario) throw new ErrorApp('NO_AUTENTICADO', 'Correo o contraseña incorrectos.', 401);
  const hash = await hashContrasena(resultado.datos.contrasena, usuario.salt);
  if (hash !== usuario.hash) throw new ErrorApp('NO_AUTENTICADO', 'Correo o contraseña incorrectos.', 401);
  return crearSesion(usuario);
}

/** Datos sólo para la pantalla de cuenta (no se exponen hashes). */
export async function resumenCuenta() {
  await iniciarDemo();
  const comprador = compradorActual();
  const usuario = usuarioPorId(comprador.id);
  return {
    comprador: { id: comprador.id, nombre: comprador.nombre, correo: comprador.correo },
    creadoEn: usuario?.creadoEn || null,
  };
}

export function zonasDemo() {
  return ZONAS.map(({ id, nombre, precio, descripcion }) => ({ id, nombre, precio, descripcion, moneda: MONEDA }));
}

export function zonaDeAsiento(asientoId) {
  const base = buscarAsientoBase(asientoId);
  return base ? buscarZona(base.zonaId) : null;
}
