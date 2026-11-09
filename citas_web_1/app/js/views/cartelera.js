/* Cartelera: calendario, horarios, mapa de asientos y resumen de compra. */

import {
  MAX_ASIENTOS,
  ZONAS,
  calcularTotal,
  funcionesVisibles,
  precioDeAsiento,
  buscarZona,
} from '../domain.js';
import { mensajeDeError } from '../errors.js';
import { abrirModal, avisoHtml, icono, skeletonMapa, toast } from '../ui.js';
import { renderizarMapaAsientos, leyendaAsientos } from '../seatmap.js';
import {
  claveDia,
  diasDelMes,
  diaSemanaLunes,
  escaparHtml,
  formatearMoneda,
  formatearFecha,
  formatearFechaLarga,
  formatearHora,
  mesClave,
  nombreMes,
  sumarMeses,
} from '../utils.js';

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export async function renderCartelera(app, { funcionId } = {}) {
  let catalogo;
  try {
    catalogo = await app.cargarCatalogo();
  } catch (error) {
    return {
      html: `<section class="section"><div class="contenedor">
        ${avisoHtml(`No se pudo cargar la cartelera. ${escaparHtml(mensajeDeError(error))}`, 'error')}
        <button class="btn btn--primary" type="button" data-reintentar>${icono('recargar')} Reintentar</button>
      </div></section>`,
      alMontar(raiz) {
        raiz.querySelector('[data-reintentar]')?.addEventListener('click', () => app.refrescarTodo());
      },
    };
  }

  const funciones = funcionesVisibles(catalogo.funciones).sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
  if (!funciones.length) {
    return {
      html: `<section class="section"><div class="contenedor">
        ${avisoHtml('No hay funciones disponibles por ahora. Vuelve a consultar pronto.', 'aviso')}
        <a class="btn btn--ghost" href="#/">Volver al inicio</a>
      </div></section>`,
    };
  }

  const porId = new Map(funciones.map((f) => [f.id, f]));
  let funcionActual =
    (funcionId && porId.get(funcionId)) ||
    (app.estadoCartelera?.funcionId && porId.get(app.estadoCartelera.funcionId)) ||
    funciones[0];
  let mesActual = mesClave(funcionActual.inicio);
  let fechaActual = claveDia(funcionActual.inicio);
  let mapa = null;
  let cargandoMapa = false;
  let generacion = 0;
  let seleccion = app.obtenerSeleccion(funcionActual.id);

  const mesesDisponibles = [...new Set(funciones.map((f) => mesClave(f.inicio)))].sort();
  const funcionesPorDia = new Map();
  for (const funcion of funciones) {
    const clave = claveDia(funcion.inicio);
    if (!funcionesPorDia.has(clave)) funcionesPorDia.set(clave, []);
    funcionesPorDia.get(clave).push(funcion);
  }

  const html = `
    <section class="page-head">
      <div class="contenedor page-head__inner">
        <div>
          <p class="eyebrow"><span class="eyebrow__line"></span>Cartelera · Temporada 2026</p>
          <h1>Elige tu función y <em>tu butaca</em></h1>
          <p class="page-head__lead">Jueves, viernes y sábados. Tres horarios, tres zonas y 120 butacas esperando por ti.</p>
        </div>
        <div class="page-head__meta">
          <span class="meta-chip">${icono('reloj')} Reserva 5 min</span>
          <span class="meta-chip">${icono('asiento')} Hasta 10 asientos</span>
        </div>
      </div>
    </section>

    <section class="section section--cartelera">
      <div class="contenedor cartelera__grid">
        <div class="cartelera__principal">
          <div class="panel glass panel--calendario">
            <div class="panel__head">
              <div>
                <p class="eyebrow">Paso 1 · Fecha y horario</p>
                <h2>¿Cuándo vienes al teatro?</h2>
              </div>
              <div class="cal-mes">
                <button class="icon-btn" type="button" data-mes="-1" aria-label="Mes anterior">${icono('izquierda')}</button>
                <strong data-mes-label>${nombreMes(mesActual)}</strong>
                <button class="icon-btn" type="button" data-mes="1" aria-label="Mes siguiente">${icono('derecha')}</button>
              </div>
            </div>
            <div class="cal" data-calendario></div>
            <div class="horarios" data-horarios role="group" aria-label="Horarios de la fecha seleccionada"></div>
          </div>

          <div class="panel glass panel--mapa" id="panel-mapa">
            <div class="panel__head panel__head--mapa">
              <div>
                <p class="eyebrow">Paso 2 · Butacas</p>
                <h2 data-funcion-titulo>Mapa de asientos</h2>
                <p class="panel__sub" data-funcion-sub></p>
              </div>
              <div class="mapa-acciones">
                <button class="btn btn--ghost btn--xs" type="button" data-recargar-mapa>${icono('recargar')} Actualizar</button>
              </div>
            </div>
            ${leyendaAsientos()}
            <div class="mapa-contenedor" data-mapa>${skeletonMapa()}</div>
            <p class="mapa__nota">${icono('info')} Los asientos apartados se liberan automáticamente al vencer el plazo de 5 minutos.</p>
          </div>
        </div>

        <aside class="resumen-wrap" aria-label="Resumen de selección">
          <div class="panel glass resumen" id="resumen">
            <div data-resumen-contenido></div>
          </div>
          <div class="panel glass resumen__nota">
            <span>${icono('escudo')}</span>
            <p><strong>Compra protegida por 5 minutos.</strong> Al continuar apartamos tus butacas; si no completas el pago, vuelven a estar disponibles.</p>
          </div>
        </aside>
      </div>
    </section>`;

  return {
    html,
    alMontar(raiz) {
      const nodoCalendario = raiz.querySelector('[data-calendario]');
      const nodoHorarios = raiz.querySelector('[data-horarios]');
      const nodoMapa = raiz.querySelector('[data-mapa]');
      const nodoResumen = raiz.querySelector('[data-resumen-contenido]');
      const etiquetaMes = raiz.querySelector('[data-mes-label]');
      const tituloFuncion = raiz.querySelector('[data-funcion-titulo]');
      const subFuncion = raiz.querySelector('[data-funcion-sub]');

      const indiceMes = () => mesesDisponibles.indexOf(mesActual);

      function dibujarCalendario() {
        if (etiquetaMes) etiquetaMes.textContent = nombreMes(mesActual);
        raiz.querySelector('[data-mes="-1"]')?.toggleAttribute('disabled', indiceMes() <= 0);
        raiz.querySelector('[data-mes="1"]')?.toggleAttribute('disabled', indiceMes() >= mesesDisponibles.length - 1);

        const totalDias = diasDelMes(mesActual);
        const primerDia = diaSemanaLunes(`${mesActual}-01`);
        const celdas = [];
        for (let i = 0; i < primerDia; i += 1) celdas.push('<span class="cal__vacia" aria-hidden="true"></span>');
        for (let dia = 1; dia <= totalDias; dia += 1) {
          const clave = `${mesActual}-${String(dia).padStart(2, '0')}`;
          const lista = funcionesPorDia.get(clave) || [];
          const activa = clave === fechaActual;
          const libre = lista.reduce((total, f) => total + (f.asientosDisponibles ?? 0), 0);
          celdas.push(`<button class="cal__dia ${activa ? 'activo' : ''} ${lista.length ? 'con-funcion' : ''}" type="button"
            data-dia="${clave}" ${lista.length ? '' : 'disabled'}
            aria-pressed="${activa}"
            aria-label="${escaparHtml(formatearFechaLarga(`${clave}T12:00:00-06:00`))}${lista.length ? `, ${lista.length} funciones, ${libre} lugares libres` : ', sin funciones'}">
            <span>${dia}</span>
            ${lista.length ? `<small>${lista.length}</small>` : ''}
          </button>`);
        }
        nodoCalendario.innerHTML = `
          <div class="cal__semana" aria-hidden="true">${DIAS_SEMANA.map((d) => `<span>${d}</span>`).join('')}</div>
          <div class="cal__grid">${celdas.join('')}</div>`;

        nodoCalendario.querySelectorAll('[data-dia]').forEach((boton) => {
          boton.addEventListener('click', () => {
            const clave = boton.dataset.dia;
            if (!clave) return;
            fechaActual = clave;
            const lista = funcionesPorDia.get(clave) || [];
            if (lista.length) elegirFuncion(lista[0]);
            else dibujarCalendario();
          });
        });
      }

      function dibujarHorarios() {
        const lista = funcionesPorDia.get(fechaActual) || [];
        nodoHorarios.innerHTML = lista.length
          ? lista
              .map((funcion) => {
                const activo = funcion.id === funcionActual.id;
                const agotado = (funcion.asientosDisponibles ?? 0) <= 0;
                return `<button class="hora-opcion ${activo ? 'activo' : ''}" type="button" data-hora="${escaparHtml(funcion.id)}"
                  aria-pressed="${activo}" ${agotado ? 'disabled' : ''}>
                  <strong>${escaparHtml(formatearHora(funcion.inicio))}</strong>
                  <small>${agotado ? 'Agotado' : `${funcion.asientosDisponibles ?? 0} libres`}</small>
                </button>`;
              })
              .join('')
          : '<p class="horarios__vacio">No hay funciones este día.</p>';
        nodoHorarios.querySelectorAll('[data-hora]').forEach((boton) => {
          boton.addEventListener('click', () => {
            const funcion = porId.get(boton.dataset.hora);
            if (funcion) elegirFuncion(funcion);
          });
        });
      }

      function pintarSeleccionEnMapa() {
        nodoMapa.querySelectorAll('[data-asiento]').forEach((boton) => {
          const elegido = seleccion.has(boton.dataset.asiento);
          boton.classList.toggle('is-selected', elegido);
          boton.setAttribute('aria-pressed', String(elegido));
        });
      }

      function actualizarResumen() {
        const asientos = [...seleccion].map((id) => {
          const asiento = mapa?.asientos?.find((a) => a.id === id);
          const zonaId = asiento?.zonaId || buscarZonaPorAsiento(id);
          return {
            id,
            etiqueta: asiento?.etiqueta || id,
            zonaId,
            zonaNombre: buscarZona(zonaId)?.nombre || zonaId,
            precio: precioDeAsiento(zonaId),
          };
        });
        asientos.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es', { numeric: true }));
        const total = calcularTotal(asientos);
        const restantes = MAX_ASIENTOS - asientos.length;

        nodoResumen.innerHTML = `
          <div class="resumen__head">
            <div>
              <p class="eyebrow">Paso 3 · Confirma</p>
              <h2>Tu selección</h2>
            </div>
            <span class="resumen__contador ${asientos.length ? 'activo' : ''}">${asientos.length}/${MAX_ASIENTOS}</span>
          </div>
          <div class="resumen__funcion">
            <span>${icono('calendario')}</span>
            <div>
              <strong>${escaparHtml(formatearFecha(funcionActual.inicio, { weekday: 'long', day: 'numeric', month: 'long' }))}</strong>
              <small>${escaparHtml(formatearHora(funcionActual.inicio))} h · Sala principal</small>
            </div>
          </div>
          ${
            asientos.length
              ? `<ul class="resumen__asientos">
                  ${asientos
                    .map(
                      (a) => `<li>
                        <span class="chip-asiento"><span>${escaparHtml(a.etiqueta)}</span><small>${escaparHtml(a.zonaNombre)}</small></span>
                        <span class="resumen__precio">${formatearMoneda(a.precio)}</span>
                        <button class="icon-btn icon-btn--xs" type="button" data-quitar="${escaparHtml(a.id)}" aria-label="Quitar asiento ${escaparHtml(a.etiqueta)}">${icono('equis')}</button>
                      </li>`
                    )
                    .join('')}
                </ul>
                <div class="resumen__total"><span>Total</span><strong>${formatearMoneda(total)}</strong></div>
                <p class="resumen__ahorro">${restantes > 0 ? `Puedes agregar ${restantes} ${restantes === 1 ? 'asiento más' : 'asientos más'}.` : 'Alcanzaste el máximo por función.'}</p>`
              : `<div class="resumen__vacio">
                  <span>${icono('asiento')}</span>
                  <p>Aún no eliges butacas.</p>
                  <small>Toca los asientos disponibles en el mapa. Puedes elegir hasta ${MAX_ASIENTOS}.</small>
                </div>`
          }
          <button class="btn btn--primary btn--block btn--lg" type="button" data-continuar ${asientos.length ? '' : 'disabled'}>
            ${icono('tarjeta')} ${asientos.length ? 'Reservar y pagar' : 'Elige tus asientos'}
          </button>
          <p class="resumen__legal">${icono('reloj')} Al continuar, tus asientos se apartan por 5 minutos.</p>`;

        nodoResumen.querySelectorAll('[data-quitar]').forEach((boton) => {
          boton.addEventListener('click', () => {
            seleccion.delete(boton.dataset.quitar);
            pintarSeleccionEnMapa();
            actualizarResumen();
          });
        });
        nodoResumen.querySelector('[data-continuar]')?.addEventListener('click', continuar);
      }

      function buscarZonaPorAsiento(asientoId) {
        const letra = String(asientoId).charAt(0).toUpperCase();
        return ZONAS.find((z) => z.filas.includes(letra))?.id || 'general';
      }

      async function cargarMapa() {
        generacion += 1;
        const miGeneracion = generacion;
        cargandoMapa = true;
        nodoMapa.innerHTML = skeletonMapa();
        if (tituloFuncion) tituloFuncion.textContent = `${formatearFecha(funcionActual.inicio, { weekday: 'long', day: 'numeric', month: 'long' })} · ${formatearHora(funcionActual.inicio)} h`;
        if (subFuncion) subFuncion.textContent = 'Toca un asiento para agregarlo a tu selección.';
        try {
          const resultado = await app.datos.listarAsientos(funcionActual.id);
          if (miGeneracion !== generacion) return;
          mapa = resultado;
          renderizarMapaAsientos(nodoMapa, {
            mapa,
            seleccion,
            alCambiar() {
              actualizarResumen();
            },
          });
          if (subFuncion) {
            const libres = mapa.asientos.filter((a) => a.estado === 'disponible').length;
            subFuncion.textContent = `${libres} de ${mapa.asientos.length} butacas disponibles. Toca un asiento para agregarlo.`;
          }
          actualizarResumen();
        } catch (error) {
          if (miGeneracion !== generacion) return;
          mapa = null;
          nodoMapa.innerHTML = avisoHtml(
            `No se pudo cargar el mapa. ${escaparHtml(mensajeDeError(error))}
             <button class="btn btn--ghost btn--xs" type="button" data-reintentar-mapa>${icono('recargar')} Reintentar</button>`,
            'error'
          );
          nodoMapa.querySelector('[data-reintentar-mapa]')?.addEventListener('click', () => cargarMapa());
          actualizarResumen();
        } finally {
          cargandoMapa = false;
        }
      }

      function elegirFuncion(funcion) {
        if (!funcion) return;
        funcionActual = funcion;
        fechaActual = claveDia(funcion.inicio);
        mesActual = mesClave(funcion.inicio);
        seleccion = app.obtenerSeleccion(funcion.id);
        app.estadoCartelera = { funcionId: funcion.id };
        dibujarCalendario();
        dibujarHorarios();
        cargarMapa();
      }

      async function continuar() {
        if (!seleccion.size) {
          toast('Elige al menos un asiento.', 'aviso');
          return;
        }
        if (!app.usuario) {
          app.pedirLogin({
            motivo: 'Inicia sesión o crea tu cuenta para apartar tus asientos. Tu selección se conserva.',
            alEntrar: () => {
              setTimeout(() => continuar(), 120);
            },
          });
          return;
        }
        const boton = nodoResumen.querySelector('[data-continuar]');
        const original = boton?.innerHTML;
        if (boton) {
          boton.disabled = true;
          boton.innerHTML = '<span class="spinner" aria-hidden="true"></span> Apartando butacas…';
        }
        try {
          const reserva = await app.datos.crearReserva({
            funcionId: funcionActual.id,
            asientoIds: [...seleccion],
          });
          app.limpiarSeleccion(funcionActual.id);
          toast('¡Butacas apartadas! Tienes 5 minutos para pagar.', 'exito');
          app.ir(`/checkout/${reserva.id}`);
        } catch (error) {
          if (error?.codigo === 'NO_AUTENTICADO') {
            app.cerrarSesionLocal();
            app.pedirLogin({ motivo: 'Tu sesión terminó. Vuelve a entrar para continuar.' });
          } else if (error?.codigo === 'ASIENTO_NO_DISPONIBLE') {
            const ids = Array.isArray(error.detalles?.asientoIds) ? error.detalles.asientoIds : [];
            ids.forEach((id) => seleccion.delete(id));
            abrirModal({
              titulo: 'Esas butacas ya volaron',
              etiqueta: 'Disponibilidad',
              contenido: `<p class="modal__text">${
                ids.length
                  ? `Estos asientos ya no están disponibles: <strong>${escaparHtml(ids.join(', '))}</strong>. Los quitamos de tu selección.`
                  : 'Algunos asientos ya no están disponibles. Actualizamos el mapa.'
              }</p><div class="modal__actions"><button class="btn btn--primary" type="button" data-cerrar>Elegir otros</button></div>`,
              alMontar(dialogo, cerrar) {
                dialogo.querySelector('[data-cerrar]')?.addEventListener('click', cerrar);
              },
            });
            await cargarMapa();
          } else if (error?.codigo === 'LIMITE_EXCEDIDO') {
            const detalles = error.detalles || {};
            toast(`Ya tienes ${detalles.actuales ?? 'varios'} asientos en esta función. El máximo es ${detalles.maximo ?? MAX_ASIENTOS}.`, 'aviso', 7000);
          } else {
            toast(mensajeDeError(error), 'error', 7000);
          }
          if (boton) {
            boton.disabled = false;
            boton.innerHTML = original;
          }
        }
      }

      raiz.querySelectorAll('[data-mes]').forEach((boton) => {
        boton.addEventListener('click', () => {
          const siguiente = sumarMeses(mesActual, Number(boton.dataset.mes));
          if (!mesesDisponibles.includes(siguiente)) return;
          mesActual = siguiente;
          const primeraDelMes = funciones.find((f) => mesClave(f.inicio) === mesActual);
          if (primeraDelMes) {
            fechaActual = claveDia(primeraDelMes.inicio);
            elegirFuncion(primeraDelMes);
          } else {
            dibujarCalendario();
          }
        });
      });
      raiz.querySelector('[data-recargar-mapa]')?.addEventListener('click', () => cargarMapa());

      dibujarCalendario();
      dibujarHorarios();
      cargarMapa();
    },
  };
}
