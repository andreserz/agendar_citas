'use strict';

/**
 * Datos iniciales de web_2 (cineclub), iguales a la semilla del contrato compartido
 * (openspec impl-service, contrato-entre-capas, «Semilla de datos acordada»):
 * - 1 sitio sin cuenta (`requiereComprador = false`), 1 evento «Spider-Man».
 * - 10 zonas que representan las salas («Sala 1» a «Sala 10»), capacidad 80 cada una.
 * - 800 asientos: filas A–H, números 1–10, en cada sala.
 * - Salas 1–5 en 2D ($100) y 6–10 en 3D ($150).
 * - 30 funciones por día (10 salas × 3 horarios) del 19 nov al 18 dic 2026: 900 funciones.
 * - 900 precios: uno por función, sólo para la sala de esa función.
 * Cada función apunta a su sala con `zonaId` (equivale a `Funciones.IdZona` del backend).
 * Las horas se guardan en UTC. CDMX es UTC−6 todo el año.
 */

const SITIO = { id: 'web_2', nombre: 'Cineclub', requiereComprador: false };

const EVENTO = { id: 'evt-spiderman', sitio: 'web_2', nombre: 'Spider-Man' };

const MONEDA = 'MXN';
const NUM_SALAS = 10;
const FILAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ASIENTOS_POR_FILA = 10;
const POR_CONFIRMAR = 'Por confirmar'; // idioma y clasificación, hasta que el cineclub los entregue
const DURACION_MINUTOS = 120;

// Horarios en hora de CDMX: [hora, minuto].
const FORMATOS = {
  '2D': { precio: 100, horarios: [[13, 0], [16, 0], [20, 0]] },
  '3D': { precio: 150, horarios: [[12, 30], [15, 30], [18, 30]] },
};
const formatoDeSala = (numero) => (numero <= 5 ? '2D' : '3D');

const DESFASE_UTC_HORAS = 6; // CDMX = UTC−6
const PRIMER_DIA = Date.UTC(2026, 10, 19); // 19 nov 2026
const DIAS = 30; // hasta el 18 dic 2026
const UN_DIA_MS = 24 * 60 * 60 * 1000;

const dosDigitos = (n) => String(n).padStart(2, '0');
const idSala = (numero) => `sala-${numero}`;

function generarZonas() {
  return Array.from({ length: NUM_SALAS }, (_, i) => ({
    id: idSala(i + 1),
    nombre: `Sala ${i + 1}`,
    sitio: SITIO.id,
    moneda: MONEDA,
    capacidad: FILAS.length * ASIENTOS_POR_FILA,
  }));
}

function generarAsientos() {
  const asientos = [];
  for (let sala = 1; sala <= NUM_SALAS; sala += 1) {
    for (const fila of FILAS) {
      for (let numero = 1; numero <= ASIENTOS_POR_FILA; numero += 1) {
        asientos.push({
          id: `${idSala(sala)}-${fila}${numero}`,
          zonaId: idSala(sala),
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

function generarFunciones() {
  const funciones = [];
  for (let d = 0; d < DIAS; d += 1) {
    const dia = new Date(PRIMER_DIA + d * UN_DIA_MS);
    const anio = dia.getUTCFullYear();
    const mes = dia.getUTCMonth();
    const fecha = dia.getUTCDate();
    for (let sala = 1; sala <= NUM_SALAS; sala += 1) {
      const formato = formatoDeSala(sala);
      for (const [hora, minuto] of FORMATOS[formato].horarios) {
        funciones.push({
          id: `fun-${anio}-${dosDigitos(mes + 1)}-${dosDigitos(fecha)}-${dosDigitos(hora)}${dosDigitos(minuto)}-${idSala(sala)}`,
          eventoId: EVENTO.id,
          zonaId: idSala(sala),
          // Date.UTC pasa al día siguiente si la hora UTC supera 23 (20:00 y 18:30 locales).
          inicio: new Date(Date.UTC(anio, mes, fecha, hora + DESFASE_UTC_HORAS, minuto)),
          formato,
          idioma: POR_CONFIRMAR,
          clasificacion: POR_CONFIRMAR,
          duracionMinutos: DURACION_MINUTOS,
          activa: true,
        });
      }
    }
  }
  return funciones;
}

/** Devuelve una copia nueva de los datos iniciales de web_2 cada vez que se llama. */
function generarDatosWeb2() {
  const funciones = generarFunciones();
  return {
    sitios: [{ ...SITIO }],
    eventos: [{ ...EVENTO, activo: true }],
    zonas: generarZonas(),
    asientos: generarAsientos(),
    funciones,
    precios: funciones.map((f) => ({
      funcionId: f.id,
      zonaId: f.zonaId,
      precio: FORMATOS[f.formato].precio,
    })),
  };
}

module.exports = { generarDatosWeb2 };
