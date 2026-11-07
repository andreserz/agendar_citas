'use strict';

/**
 * Datos iniciales de web_1, iguales a los que cargará el backend en `05_datos_iniciales.sql`
 * (citas_backend/docs/BCK_DEFINICION.md §7):
 * - 1 sitio, 1 evento, 3 zonas y 120 asientos (filas A–L, 10 por fila).
 * - 120 funciones: jueves, viernes y sábados del 1 oct al 31 dic 2026 × 3 horarios.
 * - 360 precios: uno por zona y función (P14).
 * Las horas se guardan en UTC. CDMX es UTC−6 todo el año (E18).
 */

const SITIO = { id: 'web_1', nombre: 'Teatro Aquí nadie actúa normal' };

const EVENTO = {
  id: 'evt-suegra',
  sitio: 'web_1',
  nombre: '¡Que no se entere la suegra!',
  recinto: 'Teatro Aquí nadie actúa normal',
};

const MONEDA = 'MXN';

const ZONAS = [
  { id: 'preferente', nombre: 'Preferente', filas: ['A', 'B', 'C'], precio: 800 },
  { id: 'general', nombre: 'General', filas: ['D', 'E', 'F', 'G', 'H', 'I'], precio: 500 },
  { id: 'balcon', nombre: 'Balcón', filas: ['J', 'K', 'L'], precio: 300 },
];

const ASIENTOS_POR_FILA = 10;
const HORARIOS_LOCALES = [15, 19, 21]; // horas en CDMX
const DESFASE_UTC_HORAS = 6; // CDMX = UTC−6 (E18)
const DIAS_CON_FUNCION = [4, 5, 6]; // jueves, viernes y sábado (getUTCDay)
const PRIMER_DIA = Date.UTC(2026, 9, 1); // 1 oct 2026
const ULTIMO_DIA = Date.UTC(2026, 11, 31); // 31 dic 2026
const UN_DIA_MS = 24 * 60 * 60 * 1000;

const dosDigitos = (n) => String(n).padStart(2, '0');

function generarFunciones() {
  const funciones = [];
  for (let t = PRIMER_DIA; t <= ULTIMO_DIA; t += UN_DIA_MS) {
    const dia = new Date(t);
    if (!DIAS_CON_FUNCION.includes(dia.getUTCDay())) continue;
    const anio = dia.getUTCFullYear();
    const mes = dia.getUTCMonth();
    const fecha = dia.getUTCDate();
    for (const hora of HORARIOS_LOCALES) {
      funciones.push({
        id: `fun-${anio}-${dosDigitos(mes + 1)}-${dosDigitos(fecha)}-${dosDigitos(hora)}00`,
        eventoId: EVENTO.id,
        // Date.UTC pasa al día siguiente si la hora UTC supera 23 (19:00 y 21:00 locales).
        inicio: new Date(Date.UTC(anio, mes, fecha, hora + DESFASE_UTC_HORAS)),
        activa: true,
      });
    }
  }
  return funciones;
}

function generarAsientos() {
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
  return asientos;
}

/** Devuelve una copia nueva de los datos iniciales cada vez que se llama. */
function generarDatosIniciales() {
  const funciones = generarFunciones();
  return {
    sitios: [{ ...SITIO }],
    eventos: [{ ...EVENTO, activo: true }],
    zonas: ZONAS.map(({ id, nombre }) => ({ id, nombre, sitio: SITIO.id, moneda: MONEDA })),
    asientos: generarAsientos(),
    funciones,
    precios: funciones.flatMap((funcion) =>
      ZONAS.map((zona) => ({ funcionId: funcion.id, zonaId: zona.id, precio: zona.precio }))
    ),
  };
}

module.exports = { generarDatosIniciales };
