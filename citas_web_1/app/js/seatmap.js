/* Mapa de asientos accesible, con estados que no dependen sólo del color. */

import { MAX_ASIENTOS, buscarZona } from './domain.js';
import { icono, toast } from './ui.js';
import { escaparHtml, formatearMoneda } from './utils.js';

const NOMBRE_ESTADO = {
  disponible: 'disponible',
  apartado: 'apartado por otra persona',
  comprado: 'comprado',
};

export function renderizarMapaAsientos(contenedor, { mapa, seleccion = new Set(), max = MAX_ASIENTOS, alCambiar }) {
  if (!(contenedor instanceof HTMLElement)) return;
  if (!mapa?.asientos?.length) {
    contenedor.innerHTML = '<p class="mapa__vacio">No hay asientos para esta función.</p>';
    return;
  }

  const porFila = new Map();
  for (const asiento of mapa.asientos) {
    if (!porFila.has(asiento.fila)) porFila.set(asiento.fila, []);
    porFila.get(asiento.fila).push(asiento);
  }

  const zonasHtml = (mapa.zonas || []).map((zona) => {
    const definicion = buscarZona(zona.id);
    const filas = (definicion?.filas || []).filter((fila) => porFila.has(fila));
    if (!filas.length) return '';
    const filasHtml = filas
      .map((fila) => {
        const asientos = porFila.get(fila).sort((a, b) => a.numero - b.numero);
        const grupos = [asientos.slice(0, 5), asientos.slice(5)];
        const botones = grupos
          .map((grupo) => {
            const botonesGrupo = grupo
              .map((asiento) => {
                const seleccionado = seleccion.has(asiento.id);
                const disponible = asiento.estado === 'disponible';
                const clases = [
                  'seat',
                  `seat--${asiento.estado}`,
                  seleccionado ? 'is-selected' : '',
                  disponible ? '' : 'is-bloqueado',
                ]
                  .filter(Boolean)
                  .join(' ');
                const etiqueta = `Fila ${asiento.fila}, asiento ${asiento.numero}, ${zona.nombre}, ${formatearMoneda(zona.precio, zona.moneda)}, ${NOMBRE_ESTADO[asiento.estado] || asiento.estado}${seleccionado ? ', seleccionado' : ''}`;
                return `<button class="${clases}" type="button" data-asiento="${escaparHtml(asiento.id)}" data-zona="${escaparHtml(zona.id)}" data-precio="${zona.precio}" aria-pressed="${seleccionado}" aria-label="${escaparHtml(etiqueta)}" ${disponible ? '' : 'disabled'} title="${escaparHtml(etiqueta)}"><span class="seat__num">${asiento.numero}</span></button>`;
              })
              .join('');
            return `<div class="seat-group">${botonesGrupo}</div>`;
          })
          .join('<span class="pasillo" aria-hidden="true"></span>');
        return `<div class="seat-row"><span class="seat-row__label" aria-hidden="true">${escaparHtml(fila)}</span>${botones}<span class="seat-row__label" aria-hidden="true">${escaparHtml(fila)}</span></div>`;
      })
      .join('');

    return `<section class="zona-mapa" aria-labelledby="zona-${escaparHtml(zona.id)}">
      <header class="zona-mapa__head">
        <div>
          <h3 id="zona-${escaparHtml(zona.id)}">${escaparHtml(zona.nombre)}</h3>
          <p>${escaparHtml(zona.descripcion || '')}</p>
        </div>
        <span class="zona-mapa__precio">${formatearMoneda(zona.precio, zona.moneda)} <small>/ asiento</small></span>
      </header>
      <div class="zona-mapa__filas">${filasHtml}</div>
    </section>`;
  });

  contenedor.innerHTML = `
    <div class="mapa">
      <div class="escenario" aria-hidden="true"><span>Escenario</span></div>
      <div class="mapa__zonas">${zonasHtml.join('')}</div>
    </div>`;

  contenedor.querySelectorAll('[data-asiento]').forEach((boton) => {
    boton.addEventListener('click', () => {
      const asientoId = boton.dataset.asiento;
      const yaSeleccionado = seleccion.has(asientoId);
      if (yaSeleccionado) {
        seleccion.delete(asientoId);
        boton.classList.remove('is-selected');
        boton.setAttribute('aria-pressed', 'false');
        alCambiar?.(seleccion);
        return;
      }
      if (seleccion.size >= max) {
        toast(`Sólo puedes elegir ${max} asientos por función.`, 'aviso');
        return;
      }
      seleccion.add(asientoId);
      boton.classList.add('is-selected');
      boton.setAttribute('aria-pressed', 'true');
      alCambiar?.(seleccion);
    });
  });
}

export function leyendaAsientos() {
  return `<ul class="leyenda" aria-label="Leyenda del mapa de asientos">
    <li><span class="seat-demo seat-demo--disponible" aria-hidden="true"></span>Disponible</li>
    <li><span class="seat-demo seat-demo--seleccionado" aria-hidden="true">${icono('check')}</span>Tu selección</li>
    <li><span class="seat-demo seat-demo--apartado" aria-hidden="true"></span>Apartado</li>
    <li><span class="seat-demo seat-demo--comprado" aria-hidden="true"></span>Comprado</li>
  </ul>`;
}
