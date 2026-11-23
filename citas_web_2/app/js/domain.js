export const FILAS = 'ABCDEFGH'.split('');
export const ASIENTOS_POR_FILA = 10;
export const MAX_ASIENTOS = 10;
export const DURACION_RESERVA_SEGUNDOS = 300;
export const TARJETA_APROBADA = '4242424242424242';
export const TARJETA_RECHAZADA = '4000000000000002';
export const CODIGO_BOLETO_RE = /^[A-Z2-9]{12}$/;
export const FOLIO_RE = /^ORD-\d{6}$/;

export function etiquetaAsiento(asiento) {
  return asiento?.etiqueta || `${asiento?.fila || ''}${asiento?.numero || ''}`;
}

export function normalizarEstado(estado) {
  if (estado === 'comprado' || estado === 'vendida') return 'vendida';
  if (estado === 'apartado' || estado === 'apartada') return 'apartada';
  return 'disponible';
}

export function precioFuncion(funcion) {
  return Number(funcion?.zonas?.[0]?.precio ?? funcion?.precio ?? 0);
}

export function totalSeleccion(asientos, seleccion, precio = null) {
  const precioBase = precio ?? precioFuncion({ zonas: [{ precio: 0 }] });
  return asientos
    .filter((asiento) => seleccion.has(asiento.id))
    .reduce((total, asiento) => total + Number(asiento.precio ?? precioBase), 0);
}

export function agregarSeleccion(seleccion, asiento, asientos) {
  const nueva = new Set(seleccion);
  if (nueva.has(asiento.id)) {
    nueva.delete(asiento.id);
    return { seleccion: nueva, error: null };
  }
  if (normalizarEstado(asiento.estado) !== 'disponible') {
    return { seleccion: nueva, error: 'Esa butaca ya no está disponible.' };
  }
  if (nueva.size >= MAX_ASIENTOS) {
    return { seleccion: nueva, error: 'Puedes elegir hasta 10 butacas por reserva.' };
  }
  nueva.add(asiento.id);
  return { seleccion: nueva, error: null };
}

export function fechaCDMX(fecha = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(fecha);
}

export function fechaDeFuncion(inicio) {
  return String(inicio || '').slice(0, 10);
}

export function horaCDMX(inicio) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(inicio));
}

export function fechaLegible(inicio, opciones = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat('es-MX', { ...opciones, timeZone: 'America/Mexico_City' })
    .format(new Date(inicio));
}

export function dinero(monto, moneda = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda, maximumFractionDigits: 0 })
    .format(Number(monto) || 0);
}

export function escaparHtml(valor = '') {
  return String(valor).replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[caracter]);
}

export function crearFuncionesDemo() {
  const funciones = [];
  const inicio = new Date('2026-11-19T12:00:00-06:00');
  const horarios = [
    { formato: '2D', hora: ['13:00', '16:00', '20:00'], precio: 100 },
    { formato: '3D', hora: ['12:30', '15:30', '18:30'], precio: 150 },
  ];
  for (let dia = 0; dia < 30; dia += 1) {
    const fecha = new Date(inicio.getTime() + dia * 86400000).toISOString().slice(0, 10);
    for (let sala = 1; sala <= 10; sala += 1) {
      const formato = sala <= 5 ? horarios[0] : horarios[1];
      formato.hora.forEach((hora, horarioIndex) => {
        const [hh, mm] = hora.split(':').map(Number);
        funciones.push({
          id: `web2-${fecha}-s${sala}-${horarioIndex + 1}`,
          eventoId: 'evt-spiderman',
          eventoNombre: 'Spider-Man',
          sala: `Sala ${sala}`,
          inicio: `${fecha}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00-06:00`,
          formato: formato.formato,
          idioma: 'Por confirmar',
          clasificacion: 'Por confirmar',
          duracionMinutos: 120,
          zonas: [{ id: `sala-${sala}`, nombre: `Sala ${sala}`, precio: formato.precio, moneda: 'MXN' }],
        });
      });
    }
  }
  return funciones;
}

export function crearAsientosDemo(funcionId, ocupados = new Set()) {
  const hash = (texto) => {
    let valor = 2166136261;
    for (const caracter of texto) valor = Math.imul(valor ^ caracter.charCodeAt(0), 16777619);
    return valor >>> 0;
  };
  return FILAS.flatMap((fila) => Array.from({ length: ASIENTOS_POR_FILA }, (_, indice) => {
    const numero = indice + 1;
    const etiqueta = `${fila}${numero}`;
    const id = etiqueta;
    let estado = ocupados.has(id) ? 'comprado' : (hash(`${funcionId}|${id}`) % 100 < 12 ? 'comprado' : 'disponible');
    if (['A7', 'A8'].includes(id) && !ocupados.has(id)) estado = 'disponible';
    return { id, fila, numero, etiqueta, zonaId: 'sala', precio: null, estado };
  }));
}

export function validarTarjeta({ numeroTarjeta, titular, vencimiento, cvv }) {
  const numero = String(numeroTarjeta || '').replace(/\D/g, '');
  const errores = {};
  if (![TARJETA_APROBADA, TARJETA_RECHAZADA].includes(numero)) {
    errores.numeroTarjeta = 'Usa una de las tarjetas de prueba indicadas.';
  }
  if (String(titular || '').trim().length < 3) errores.titular = 'Escribe el nombre del titular.';
  const vence = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(String(vencimiento || '').trim());
  if (!vence) errores.vencimiento = 'Usa el formato MM/AA.';
  else {
    const mes = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', month: '2-digit' }).format(new Date()));
    const anio = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', year: '2-digit' }).format(new Date()));
    if ((Number(vence[2]) * 12 + Number(vence[1])) < (anio * 12 + mes)) errores.vencimiento = 'La tarjeta está vencida.';
  }
  if (!/^\d{3}$/.test(String(cvv || '').trim())) errores.cvv = 'El CVV debe tener tres dígitos.';
  return { valido: Object.keys(errores).length === 0, errores, resultado: numero === TARJETA_APROBADA ? 'aprobado' : 'rechazado' };
}
