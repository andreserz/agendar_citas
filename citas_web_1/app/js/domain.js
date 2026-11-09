/* Dominio puro de citas_web_1: catálogo, asientos, reservas, pago simulado y validaciones.
 * No toca el DOM ni el almacenamiento, para poder probarlo con Node. */

import {
  claveDia,
  codigoAleatorio,
  hash32,
  normalizarCorreo,
  normalizarTexto,
  validarCorreo,
} from './utils.js';

export const SITIO = 'web_1';
export const MONEDA = 'MXN';
export const MAX_ASIENTOS = 10;
export const DURACION_RESERVA_SEGUNDOS = 300;
export const PRIMER_MES = '2026-10';
export const ULTIMO_MES = '2026-12';

export const EVENTO = {
  id: 'evt-suegra',
  sitio: SITIO,
  nombre: '¡Que no se entere la suegra!',
  recinto: 'Teatro Aquí nadie actúa normal',
  descripcion:
    'Una comedia de enredos donde una visita inesperada, una cena mal planeada y una mentira piadosa ' +
    'amenazan con convertirse en el secreto peor guardado de la familia. Aquí nadie actúa normal… ' +
    'y la suegra tampoco.',
  sinopsis:
    'Cuando la suegra anuncia que llega a cenar, todo el plan se descompone: la pareja improvisa una ' +
    'versión perfecta de su vida, los vecinos se vuelven cómplices y la noche se llena de puertas que ' +
    'se abren, secretos que se escapan y risas que no se pueden contener.',
};

export const ZONAS = [
  {
    id: 'preferente',
    nombre: 'Preferente',
    filas: ['A', 'B', 'C'],
    precio: 800,
    descripcion: 'Las mejores vistas, cerca del escenario.',
  },
  {
    id: 'general',
    nombre: 'General',
    filas: ['D', 'E', 'F', 'G', 'H', 'I'],
    precio: 500,
    descripcion: 'Centro de la sala, comodidad y buena vista.',
  },
  {
    id: 'balcon',
    nombre: 'Balcón',
    filas: ['J', 'K', 'L'],
    precio: 300,
    descripcion: 'La perspectiva completa de la función.',
  },
];

export const HORARIOS = [15, 19, 21];
export const ASIENTOS_POR_FILA = 10;
export const DESFASE_CDMX = '-06:00';
const DIAS_CON_FUNCION = [4, 5, 6]; // jueves, viernes, sábado

export const TARJETA_APROBADA = '4242424242424242';
export const TARJETA_RECHAZADA = '4000000000000002';

const dosDigitos = (n) => String(n).padStart(2, '0');

function rangoFechas() {
  const fechas = [];
  const inicio = Date.UTC(2026, 9, 1, 12);
  const fin = Date.UTC(2026, 11, 31, 12);
  const unDia = 24 * 60 * 60 * 1000;
  for (let t = inicio; t <= fin; t += unDia) {
    const fecha = new Date(t);
    if (DIAS_CON_FUNCION.includes(fecha.getUTCDay())) {
      fechas.push({
        anio: fecha.getUTCFullYear(),
        mes: fecha.getUTCMonth() + 1,
        dia: fecha.getUTCDate(),
      });
    }
  }
  return fechas;
}

let funcionesCache = null;

/** 120 funciones: jueves, viernes y sábados de oct–dic 2026 a las 15:00, 19:00 y 21:00 (CDMX). */
export function generarFunciones() {
  if (funcionesCache) return funcionesCache.map((f) => ({ ...f }));
  const funciones = [];
  for (const { anio, mes, dia } of rangoFechas()) {
    for (const hora of HORARIOS) {
      const fechaLocal = `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}`;
      funciones.push({
        id: `fun-${fechaLocal}-${dosDigitos(hora)}00`,
        eventoId: EVENTO.id,
        inicio: `${fechaLocal}T${dosDigitos(hora)}:00:00${DESFASE_CDMX}`,
        activa: true,
      });
    }
  }
  funcionesCache = funciones;
  return funciones.map((f) => ({ ...f }));
}

let asientosCache = null;

/** 120 asientos: filas A–L con 10 butacas cada una. */
export function generarAsientos() {
  if (asientosCache) return asientosCache.map((a) => ({ ...a }));
  const asientos = [];
  for (const zona of ZONAS) {
    for (const fila of zona.filas) {
      for (let numero = 1; numero <= ASIENTOS_POR_FILA; numero += 1) {
        asientos.push({
          id: `${fila}${numero}`,
          zonaId: zona.id,
          fila,
          numero,
          etiqueta: `${fila}${numero}`,
          activo: true,
        });
      }
    }
  }
  asientosCache = asientos;
  return asientos.map((a) => ({ ...a }));
}

export function zonasPublicas() {
  return ZONAS.map(({ id, nombre, precio, descripcion }) => ({
    id,
    nombre,
    precio,
    descripcion,
    moneda: MONEDA,
  }));
}

export function buscarZona(zonaId) {
  return ZONAS.find((z) => z.id === zonaId) || null;
}

export function buscarAsientoBase(asientoId) {
  return generarAsientos().find((a) => a.id === asientoId) || null;
}

/**
 * Ocupación de demostración: algunos asientos aparecen vendidos por otros compradores.
 * Es determinista por función y asiento para que el mapa sea estable al recargar.
 */
export function esVendidoDemo(funcionId, asientoId) {
  if (asientoId === 'A7' || asientoId === 'A8') return false;
  return hash32(`${funcionId}|${asientoId}|teatro`) % 100 < 14;
}

export function claveOcupacion(funcionId, asientoId) {
  return `${funcionId}|${asientoId}`;
}

/**
 * Índice de ocupación para calcular estados sin recorrer todas las reservas por asiento.
 * `reservas`: [{ funcionId, estado, expiraEn, asientos:[{asientoId}] }]
 * `ordenes`: [{ boletos:[{ funcionId, asientoId }] }] (los boletos usan `etiqueta` en la API)
 */
export function crearIndiceOcupacion({ reservas = [], ordenes = [], ahora = new Date() } = {}) {
  const comprados = new Set();
  const apartados = new Map();
  const instante = ahora instanceof Date ? ahora : new Date(ahora);

  for (const orden of ordenes) {
    for (const boleto of orden.boletos || []) {
      const asientoId = boleto.asientoId || boleto.etiqueta;
      if (asientoId) comprados.add(claveOcupacion(boleto.funcionId, asientoId));
    }
  }

  for (const reserva of reservas) {
    if (reserva.estado && reserva.estado !== 'activa') continue;
    if (!reservaVigente(reserva, instante)) continue;
    for (const asiento of reserva.asientos || []) {
      const asientoId = asiento.asientoId || asiento.etiqueta;
      if (asientoId) apartados.set(claveOcupacion(reserva.funcionId, asientoId), reserva);
    }
  }

  return { comprados, apartados };
}

export function estadoAsiento(funcionId, asientoId, indice, { semilla = true } = {}) {
  const clave = claveOcupacion(funcionId, asientoId);
  if (indice?.comprados?.has(clave)) return 'comprado';
  if (semilla && esVendidoDemo(funcionId, asientoId)) return 'comprado';
  if (indice?.apartados?.has(clave)) return 'apartado';
  return 'disponible';
}

export function crearMapaAsientos(funcion, indice, { ahora = new Date(), semilla = true } = {}) {
  const asientos = generarAsientos().map((asiento) => ({
    ...asiento,
    estado: estadoAsiento(funcion.id, asiento.id, indice, { semilla }),
  }));
  return {
    funcion,
    zonas: zonasPublicas(),
    asientos,
    consultadoEn: (ahora instanceof Date ? ahora : new Date(ahora)).toISOString(),
  };
}

export function contarDisponibles(funcionId, indice, { semilla = true } = {}) {
  let disponibles = 0;
  for (const asiento of generarAsientos()) {
    if (estadoAsiento(funcionId, asiento.id, indice, { semilla }) === 'disponible') disponibles += 1;
  }
  return disponibles;
}

export function precioDeAsiento(zonaId) {
  return buscarZona(zonaId)?.precio ?? 0;
}

export function calcularTotal(asientos) {
  return (asientos || []).reduce((total, asiento) => total + Number(asiento.precio || 0), 0);
}

export function reservaVigente(reserva, ahora = new Date()) {
  if (!reserva) return false;
  if (reserva.estado && reserva.estado !== 'activa') return false;
  const expira = new Date(reserva.expiraEn).getTime();
  return Number.isFinite(expira) && expira > (ahora instanceof Date ? ahora : new Date(ahora)).getTime();
}

export function estadoReserva(reserva, ahora = new Date()) {
  if (!reserva) return 'vencida';
  if (reserva.estado === 'pagada' || reserva.estado === 'liberada') return reserva.estado;
  const instante = ahora instanceof Date ? ahora : new Date(ahora);
  if (reservaVigente(reserva, instante)) return 'activa';
  if (reserva.estado === 'vencida') return 'vencida';
  return 'vencida';
}

export function segundosRestantes(reserva, ahora = new Date()) {
  if (!reserva || !reservaVigente(reserva, ahora)) return 0;
  const instante = ahora instanceof Date ? ahora : new Date(ahora);
  const diferencia = new Date(reserva.expiraEn).getTime() - instante.getTime();
  return Math.max(0, Math.floor(diferencia / 1000));
}

/** Cuenta boletos comprados + asientos en reservas vigentes del comprador para una función. */
export function contarAsientosComprador({ compradorId, funcionId, reservas = [], ordenes = [], ahora = new Date() }) {
  const instante = ahora instanceof Date ? ahora : new Date(ahora);
  let total = 0;
  for (const orden of ordenes) {
    if (orden.compradorId && orden.compradorId !== compradorId) continue;
    for (const boleto of orden.boletos || []) {
      if (boleto.funcionId === funcionId) total += 1;
    }
  }
  for (const reserva of reservas) {
    if (reserva.compradorId && reserva.compradorId !== compradorId) continue;
    if (reserva.funcionId !== funcionId) continue;
    if (!reservaVigente(reserva, instante)) continue;
    total += (reserva.asientos || []).length;
  }
  return total;
}

/* ------------------------------ Validaciones ------------------------------ */

export function validarRegistro({ nombre, correo, contrasena, confirmacion } = {}) {
  const errores = {};
  const nombreLimpio = normalizarTexto(nombre);
  const correoLimpio = normalizarCorreo(correo);
  const clave = String(contrasena ?? '');

  if (nombreLimpio.length < 2) errores.nombre = 'Escribe tu nombre (mínimo 2 caracteres).';
  if (nombreLimpio.length > 80) errores.nombre = 'El nombre es demasiado largo.';
  if (!validarCorreo(correoLimpio)) errores.correo = 'Escribe un correo válido.';
  if (clave.length < 8) errores.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
  if (confirmacion != null && clave !== String(confirmacion)) errores.confirmacion = 'Las contraseñas no coinciden.';

  return { valido: Object.keys(errores).length === 0, errores, datos: { nombre: nombreLimpio, correo: correoLimpio, contrasena: clave } };
}

export function validarLogin({ correo, contrasena } = {}) {
  const errores = {};
  const correoLimpio = normalizarCorreo(correo);
  if (!validarCorreo(correoLimpio)) errores.correo = 'Escribe un correo válido.';
  if (!String(contrasena ?? '')) errores.contrasena = 'Escribe tu contraseña.';
  return { valido: Object.keys(errores).length === 0, errores, datos: { correo: correoLimpio, contrasena: String(contrasena ?? '') } };
}

export function soloDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

export function formatearNumeroTarjeta(valor) {
  const digitos = soloDigitos(valor).slice(0, 16);
  return digitos.replace(/(.{4})/g, '$1 ').trim();
}

function vencimientoNumerico(vencimiento) {
  const coincidencia = /^(0[1-9]|1[0-2])\/?(\d{2})$/.exec(normalizarTexto(vencimiento));
  if (!coincidencia) return null;
  return { mes: Number(coincidencia[1]), anio: 2000 + Number(coincidencia[2]) };
}

/** Valida los datos de la tarjeta de prueba (D14). Devuelve errores por campo y resultado. */
export function validarPago({ numeroTarjeta, titular, vencimiento, cvv } = {}, ahora = new Date()) {
  const errores = {};
  const numero = soloDigitos(numeroTarjeta);
  const titularLimpio = normalizarTexto(titular);
  const cvvLimpio = soloDigitos(cvv);

  if (!numero) {
    errores.numeroTarjeta = 'Escribe el número de tarjeta.';
  } else if (numero !== TARJETA_APROBADA && numero !== TARJETA_RECHAZADA) {
    errores.numeroTarjeta = 'Usa una tarjeta de prueba: 4242 4242 4242 4242 o 4000 0000 0000 0002.';
  }

  if (titularLimpio.length < 3) {
    errores.titular = 'Escribe el nombre del titular.';
  } else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{3,60}$/.test(titularLimpio)) {
    errores.titular = 'El nombre del titular sólo puede tener letras y espacios.';
  }

  const vence = vencimientoNumerico(vencimiento);
  if (!vence) {
    errores.vencimiento = 'Usa el formato MM/AA.';
  } else {
    const diaActual = claveDia(ahora);
    const [anioActual, mesActual] = diaActual.split('-').map(Number);
    if (vence.anio * 12 + vence.mes < anioActual * 12 + mesActual) {
      errores.vencimiento = 'La tarjeta está vencida.';
    }
  }

  if (!/^\d{3}$/.test(cvvLimpio)) errores.cvv = 'El CVV debe tener 3 dígitos.';

  const resultado = numero === TARJETA_APROBADA ? 'aprobado' : numero === TARJETA_RECHAZADA ? 'rechazado' : null;
  return {
    valido: Object.keys(errores).length === 0,
    errores,
    resultado,
    ultimosDigitos: numero.slice(-4),
  };
}

/* ------------------------------ Generadores ------------------------------ */

export function generarNumeroOrden(consecutivo) {
  return `ORD-${String(Math.max(0, Number(consecutivo) || 0)).padStart(6, '0')}`;
}

export function generarCodigoBoleto() {
  return codigoAleatorio(12);
}

export function formatearEtiquetaAsientos(asientos) {
  return (asientos || []).map((a) => a.etiqueta || a.asientoId).join(', ');
}

/** Filtra funciones futuras; si el reloj quedó fuera de temporada, devuelve la cartelera completa. */
export function funcionesVisibles(funciones, ahora = new Date()) {
  const instante = ahora instanceof Date ? ahora : new Date(ahora);
  const futuras = funciones.filter((f) => new Date(f.inicio).getTime() > instante.getTime() - 30 * 60 * 1000);
  return futuras.length ? futuras : funciones;
}

export function ordenarFunciones(funciones) {
  return [...funciones].sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
}
