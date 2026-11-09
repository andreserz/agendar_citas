/* Utilidades compartidas: fechas, formato, almacenamiento seguro y validaciones básicas. */

export const ZONA_HORARIA = 'America/Mexico_City';

export function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatearMoneda(monto, moneda = 'MXN') {
  const valor = Number(monto);
  if (!Number.isFinite(valor)) return '$—';
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: moneda || 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(valor);
  } catch {
    return `$${valor.toFixed(2)}`;
  }
}

export function aFecha(valor) {
  if (valor instanceof Date) return valor;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Clave YYYY-MM-DD en la zona del teatro (CDMX), independiente del reloj del navegador. */
export function claveDia(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return '';
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(fecha);
  const obtener = (tipo) => partes.find((p) => p.type === tipo)?.value || '';
  return `${obtener('year')}-${obtener('month')}-${obtener('day')}`;
}

export function mesClave(valor) {
  return claveDia(valor).slice(0, 7);
}

export function formatearFecha(valor, opciones = {}) {
  const fecha = aFecha(valor);
  if (!fecha) return 'Fecha por confirmar';
  try {
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: ZONA_HORARIA,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      ...opciones,
    }).format(fecha);
  } catch {
    return fecha.toLocaleDateString();
  }
}

export function formatearFechaLarga(valor, opciones = {}) {
  const fecha = aFecha(valor);
  if (!fecha) return 'Fecha por confirmar';
  try {
    const texto = new Intl.DateTimeFormat('es-MX', {
      timeZone: ZONA_HORARIA,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...opciones,
    }).format(fecha);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  } catch {
    return fecha.toLocaleDateString();
  }
}

export function formatearHora(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return '--:--';
  try {
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: ZONA_HORARIA,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(fecha);
  } catch {
    return fecha.toLocaleTimeString();
  }
}

export function formatearFechaHora(valor) {
  return `${formatearFecha(valor)} · ${formatearHora(valor)} h`;
}

export function nombreMes(clave) {
  const [anio, mes] = String(clave).split('-').map(Number);
  if (!anio || !mes) return clave;
  const fecha = new Date(Date.UTC(anio, mes - 1, 15, 12));
  const texto = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function inicioDelMes(fecha = new Date()) {
  const clave = mesClave(fecha);
  return `${clave}-01`;
}

export function sumarDias(clave, dias) {
  const [anio, mes, dia] = String(clave).split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias, 12));
  return fecha.toISOString().slice(0, 10);
}

export function sumarMeses(claveMes, meses) {
  const [anio, mes] = String(claveMes).split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1 + meses, 1, 12));
  return fecha.toISOString().slice(0, 7);
}

export function diasDelMes(claveMes) {
  const [anio, mes] = String(claveMes).split('-').map(Number);
  return new Date(Date.UTC(anio, mes, 0, 12)).getUTCDate();
}

/** Día de la semana con lunes = 0 (para dibujar calendarios). */
export function diaSemanaLunes(claveDiaTexto) {
  const [anio, mes, dia] = String(claveDiaTexto).split('-').map(Number);
  const domingo = new Date(Date.UTC(anio, mes - 1, dia, 12)).getUTCDay();
  return (domingo + 6) % 7;
}

export function plural(cantidad, singular, pluralTexto) {
  return cantidad === 1 ? singular : pluralTexto;
}

export function minutosSegundos(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos) || 0));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

export function generarId(prefijo = 'id', bytes = 8) {
  const arreglo = new Uint8Array(bytes);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(arreglo);
  } else {
    for (let i = 0; i < arreglo.length; i += 1) arreglo[i] = Math.floor(Math.random() * 256);
  }
  return `${prefijo}-${Array.from(arreglo, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function codigoAleatorio(largo = 12) {
  const arreglo = new Uint8Array(largo);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(arreglo);
  } else {
    for (let i = 0; i < largo; i += 1) arreglo[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arreglo, (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join('');
}

export function hash32(texto) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function normalizarTexto(valor) {
  return String(valor ?? '').trim();
}

export function normalizarCorreo(valor) {
  return normalizarTexto(valor).toLowerCase();
}

export function validarCorreo(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizarCorreo(valor));
}

export function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function conTiempoLimite(promesa, ms, mensaje = 'La operación tardó demasiado.') {
  if (!ms || ms <= 0) return promesa;
  let temporizador;
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(() => {
      const error = new Error(mensaje);
      error.name = 'TimeoutError';
      rechazar(error);
    }, ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

/* Almacenamiento tolerante a fallos (modo privado, cuota llena o JSON corrupto). */
const memoria = new Map();

function obtenerAlmacen() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const prueba = '__cw1_prueba__';
    localStorage.setItem(prueba, '1');
    localStorage.removeItem(prueba);
    return localStorage;
  } catch {
    return null;
  }
}

const almacenNavegador = obtenerAlmacen();

export const almacen = {
  leer(clave, defecto = null) {
    try {
      const crudo = almacenNavegador ? almacenNavegador.getItem(clave) : memoria.get(clave);
      if (crudo == null) return defecto;
      return JSON.parse(crudo);
    } catch {
      try {
        almacenNavegador?.removeItem(clave);
      } catch {
        /* nada */
      }
      memoria.delete(clave);
      return defecto;
    }
  },
  guardar(clave, valor) {
    const crudo = JSON.stringify(valor);
    try {
      if (almacenNavegador) almacenNavegador.setItem(clave, crudo);
      else memoria.set(clave, crudo);
      return true;
    } catch {
      memoria.set(clave, crudo);
      return false;
    }
  },
  borrar(clave) {
    try {
      almacenNavegador?.removeItem(clave);
    } catch {
      /* nada */
    }
    memoria.delete(clave);
  },
};

export function anunciar(mensaje) {
  try {
    window.dispatchEvent(new CustomEvent('cw1:anuncio', { detail: { mensaje } }));
  } catch {
    /* entorno sin window */
  }
}

export function enfocar(selector) {
  requestAnimationFrame(() => {
    const elemento = document.querySelector(selector);
    if (elemento instanceof HTMLElement) {
      elemento.focus({ preventScroll: true });
      elemento.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });
}

export function fechaLegibleArchivo() {
  return claveDia(new Date()).replaceAll('-', '');
}
