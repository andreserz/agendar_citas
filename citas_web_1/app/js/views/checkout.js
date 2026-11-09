/* Pago simulado con cuenta regresiva, reintentos y liberación de la reserva. */

import {
  DURACION_RESERVA_SEGUNDOS,
  TARJETA_APROBADA,
  TARJETA_RECHAZADA,
  estadoReserva,
  formatearNumeroTarjeta,
  validarPago,
} from '../domain.js';
import { mensajeDeError } from '../errors.js';
import { abrirModal, avisoHtml, confirmar, icono, toast } from '../ui.js';
import {
  anunciar,
  escaparHtml,
  formatearFecha,
  formatearFechaHora,
  formatearHora,
  formatearMoneda,
  minutosSegundos,
} from '../utils.js';

export async function renderCheckout(app, { reservaId }) {
  if (!app.usuario) {
    return {
      html: `<section class="section"><div class="contenedor">
        <div class="panel glass estado-panel">
          <span class="estado-panel__icon">${icono('candado')}</span>
          <h1>Tu reserva te espera</h1>
          <p>Inicia sesión para pagar y recuperar tus asientos apartados.</p>
          <div class="estado-panel__acciones">
            <button class="btn btn--primary" type="button" data-entrar>${icono('usuario')} Iniciar sesión</button>
            <a class="btn btn--ghost" href="#/cartelera">Volver a la cartelera</a>
          </div>
        </div>
      </div></section>`,
      alMontar(raiz) {
        raiz.querySelector('[data-entrar]')?.addEventListener('click', () =>
          app.pedirLogin({ alEntrar: () => app.refrescarTodo() })
        );
      },
    };
  }

  let reserva;
  let funcion;
  try {
    reserva = await app.datos.obtenerReserva(reservaId);
    funcion = await app.datos.obtenerFuncion(reserva.funcionId);
  } catch (error) {
    return {
      html: `<section class="section"><div class="contenedor">
        <div class="panel glass estado-panel">
          <span class="estado-panel__icon estado-panel__icon--alerta">${icono('alerta')}</span>
          <h1>No encontramos esa reserva</h1>
          <p>${escaparHtml(mensajeDeError(error))} Pudo haber vencido o pertenecer a otra cuenta.</p>
          <div class="estado-panel__acciones">
            <a class="btn btn--primary" href="#/cartelera">Elegir asientos</a>
            <a class="btn btn--ghost" href="#/cuenta">Ir a mi cuenta</a>
          </div>
        </div>
      </div></section>`,
    };
  }

  if (reserva.estado === 'pagada' && reserva.ordenId) {
    app.ir(`/orden/${reserva.ordenId}`);
    return { html: '<div class="ruta-cargando"></div>' };
  }

  const ahora = Date.now();
  let deadline = ahora + Math.max(0, Number(reserva.segundosRestantes) || 0) * 1000;
  if (estadoReserva(reserva, new Date()) !== 'activa') deadline = ahora;
  let expirada = deadline <= ahora;
  let temporizador = null;
  let pagando = false;
  let avisoMinuto = false;

  const asientos = [...(reserva.asientos || [])].sort((a, b) => String(a.etiqueta).localeCompare(String(b.etiqueta), 'es', { numeric: true }));
  const resumenAsientos = asientos
    .map(
      (a) => `<li>
        <span class="chip-asiento"><span>${escaparHtml(a.etiqueta)}</span><small>${escaparHtml(a.zonaId)}</small></span>
        <span>${formatearMoneda(a.precio, reserva.moneda)}</span>
      </li>`
    )
    .join('');

  const html = `
    <section class="page-head page-head--compact">
      <div class="contenedor page-head__inner">
        <div>
          <p class="eyebrow"><span class="eyebrow__line"></span>Paso final</p>
          <h1>Completa tu <em>compra</em></h1>
          <p class="page-head__lead">Tu selección está apartada. Termina el pago simulado antes de que el telón vuelva a subir.</p>
        </div>
        <a class="btn btn--ghost btn--sm" href="#/cartelera">${icono('flechaIzq')} Volver a la cartelera</a>
      </div>
    </section>

    <section class="section section--checkout">
      <div class="contenedor checkout__grid">
        <div class="checkout__principal">
          <div class="panel glass checkout__timer-panel" id="timer-panel">
            <div class="timer" id="timer" role="group" aria-label="Tiempo restante de la reserva">
              <div class="timer__ring" data-timer-ring>
                <span class="timer__tiempo" data-timer-texto>${minutosSegundos(Math.max(0, Math.round((deadline - ahora) / 1000)))}</span>
                <small>min : seg</small>
              </div>
              <div class="timer__texto">
                <p class="eyebrow">Reserva en curso</p>
                <h2 data-timer-titulo>${expirada ? 'Tu reserva venció' : 'Tienes 5 minutos para pagar'}</h2>
                <p data-timer-nota>${expirada ? 'Los asientos se liberaron. Vuelve a elegir tus butacas.' : 'Si el tiempo termina, los asientos vuelven a estar disponibles para otras personas.'}</p>
                <div class="timer__barra"><span data-timer-barra style="width:${expirada ? 0 : Math.min(100, (Number(reserva.segundosRestantes) / DURACION_RESERVA_SEGUNDOS) * 100)}%"></span></div>
              </div>
            </div>
            <p class="sr-only" data-live-timer aria-live="polite"></p>
          </div>

          <div class="panel glass checkout__pago" id="panel-pago">
            <div class="panel__head">
              <div>
                <p class="eyebrow">Pago simulado</p>
                <h2>Datos de la tarjeta</h2>
              </div>
              <span class="pago-simulado">${icono('escudo')} Simulado · sin cargos</span>
            </div>
            <div class="demo-cards">
              <p>${icono('chispa')} <strong>Tarjetas de prueba:</strong> usa una para ver cada resultado.</p>
              <div class="demo-cards__botones">
                <button class="demo-card demo-card--ok" type="button" data-tarjeta="${TARJETA_APROBADA}">
                  <span>${icono('check')} Aprobada</span>
                  <code>4242 4242 4242 4242</code>
                </button>
                <button class="demo-card demo-card--no" type="button" data-tarjeta="${TARJETA_RECHAZADA}">
                  <span>${icono('equis')} Rechazada</span>
                  <code>4000 0000 0000 0002</code>
                </button>
              </div>
            </div>
            <form class="form form--pago" id="form-pago" novalidate autocomplete="off">
              <div class="field">
                <label for="pago-numero">Número de tarjeta</label>
                <div class="field__control field__control--card">
                  <span class="field__icon">${icono('tarjeta')}</span>
                  <input id="pago-numero" name="numeroTarjeta" type="text" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="19" required />
                </div>
                <p class="field__error" data-error="numeroTarjeta" role="alert"></p>
              </div>
              <div class="field">
                <label for="pago-titular">Nombre del titular</label>
                <div class="field__control">
                  <span class="field__icon">${icono('usuario')}</span>
                  <input id="pago-titular" name="titular" type="text" autocomplete="cc-name" placeholder="Como aparece en la tarjeta" required />
                </div>
                <p class="field__error" data-error="titular" role="alert"></p>
              </div>
              <div class="grid-2">
                <div class="field">
                  <label for="pago-vencimiento">Vencimiento</label>
                  <div class="field__control">
                    <span class="field__icon">${icono('calendario')}</span>
                    <input id="pago-vencimiento" name="vencimiento" type="text" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5" required />
                  </div>
                  <p class="field__error" data-error="vencimiento" role="alert"></p>
                </div>
                <div class="field">
                  <label for="pago-cvv">CVV</label>
                  <div class="field__control">
                    <span class="field__icon">${icono('candado')}</span>
                    <input id="pago-cvv" name="cvv" type="password" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="3" required />
                  </div>
                  <p class="field__error" data-error="cvv" role="alert"></p>
                </div>
              </div>
              <p class="form__general" data-general role="alert"></p>
              <div class="pago-acciones">
                <button class="btn btn--primary btn--block btn--lg" type="submit" data-pagar ${expirada ? 'disabled' : ''}>
                  ${icono('escudo')} Pagar ${formatearMoneda(reserva.total, reserva.moneda)}
                </button>
                <button class="btn btn--ghost btn--block" type="button" data-liberar>Liberar asientos y volver</button>
              </div>
              <p class="pago-legal">${icono('info')} Pago de demostración. No se guarda el número completo de la tarjeta ni el CVV.</p>
            </form>
          </div>
          <div data-expirada></div>
        </div>

        <aside class="checkout__aside" aria-label="Resumen de la compra">
          <div class="panel glass resumen resumen--checkout">
            <div class="resumen__head">
              <div>
                <p class="eyebrow">Tu función</p>
                <h2>Resumen</h2>
              </div>
              <span class="resumen__contador activo">${asientos.length}</span>
            </div>
            <div class="resumen__funcion">
              <span>${icono('calendario')}</span>
              <div>
                <strong>${escaparHtml(formatearFecha(funcion.inicio, { weekday: 'long', day: 'numeric', month: 'long' }))}</strong>
                <small>${escaparHtml(formatearHora(funcion.inicio))} h · ${escaparHtml(funcion.asientosDisponibles != null ? `${funcion.asientosDisponibles} lugares libres` : 'Sala principal')}</small>
              </div>
            </div>
            <ul class="resumen__asientos resumen__asientos--checkout">${resumenAsientos}</ul>
            <div class="resumen__total"><span>Total</span><strong>${formatearMoneda(reserva.total, reserva.moneda)}</strong></div>
            <dl class="resumen__datos">
              <div><dt>Reserva</dt><dd><code>${escaparHtml(reserva.id)}</code></dd></div>
              <div><dt>Creada</dt><dd>${escaparHtml(formatearFechaHora(reserva.creadaEn))}</dd></div>
              <div><dt>Expira</dt><dd>${escaparHtml(formatearFechaHora(reserva.expiraEn))}</dd></div>
            </dl>
            <div class="resumen__sello">${icono('escudo')}<p>Compra protegida<br/><small>El apartado se libera al terminar el tiempo.</small></p></div>
          </div>
        </aside>
      </div>
    </section>`;

  return {
    html,
    alMontar(raiz) {
      const form = raiz.querySelector('#form-pago');
      const panelPago = raiz.querySelector('#panel-pago');
      const panelTimer = raiz.querySelector('#timer-panel');
      const nodoTimer = raiz.querySelector('[data-timer-texto]');
      const nodoBarra = raiz.querySelector('[data-timer-barra]');
      const nodoRing = raiz.querySelector('[data-timer-ring]');
      const nodoTitulo = raiz.querySelector('[data-timer-titulo]');
      const nodoNota = raiz.querySelector('[data-timer-nota]');
      const live = raiz.querySelector('[data-live-timer]');
      let aviso30 = false;

      const mostrarErrores = (errores) => {
        raiz.querySelectorAll('[data-error]').forEach((nodo) => {
          nodo.textContent = '';
        });
        for (const [campo, mensaje] of Object.entries(errores || {})) {
          const nodo = raiz.querySelector(`[data-error="${campo}"]`);
          if (nodo) nodo.textContent = mensaje;
        }
        const primero = Object.keys(errores || {})[0];
        if (primero) raiz.querySelector(`[name="${primero}"]`)?.focus();
      };

      const ponerGeneral = (mensaje, tipo = 'error') => {
        const general = raiz.querySelector('[data-general]');
        if (!general) return;
        general.innerHTML = mensaje
          ? avisoHtml(escaparHtml(mensaje), tipo, 'aviso--compacto')
          : '';
      };

      const mostrarExpirada = () => {
        if (expirada && raiz.querySelector('[data-expirada]')?.dataset.mostrado === '1') return;
        expirada = true;
        clearInterval(temporizador);
        if (nodoTimer) nodoTimer.textContent = '00:00';
        if (nodoBarra) nodoBarra.style.width = '0%';
        if (nodoRing) nodoRing.classList.add('timer__ring--agotado');
        if (nodoTitulo) nodoTitulo.textContent = 'El tiempo terminó';
        if (nodoNota) nodoNota.textContent = 'Tus asientos se liberaron. Elige de nuevo para continuar.';
        if (live) live.textContent = 'El tiempo de la reserva terminó.';
        if (form) {
          form.querySelectorAll('input, button').forEach((elemento) => {
            elemento.disabled = true;
          });
        }
        const contenedor = raiz.querySelector('[data-expirada]');
        if (contenedor && contenedor.dataset.mostrado !== '1') {
          contenedor.dataset.mostrado = '1';
          contenedor.innerHTML = avisoHtml(
            `<strong>Tu reserva venció.</strong> Los asientos volvieron a estar disponibles.
             <div class="aviso__acciones">
               <a class="btn btn--primary btn--sm" href="#/cartelera">Elegir de nuevo</a>
               <a class="btn btn--ghost btn--sm" href="#/cuenta">Ver mi cuenta</a>
             </div>`,
            'aviso'
          );
        }
        anunciar('La reserva venció. Los asientos fueron liberados.');
      };

      const actualizarTimer = () => {
        const restante = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        if (nodoTimer) nodoTimer.textContent = minutosSegundos(restante);
        if (nodoBarra) nodoBarra.style.width = `${Math.min(100, (restante / DURACION_RESERVA_SEGUNDOS) * 100)}%`;
        if (nodoRing) {
          nodoRing.style.setProperty('--progreso', String(Math.min(1, restante / DURACION_RESERVA_SEGUNDOS)));
          nodoRing.classList.toggle('timer__ring--urgente', restante <= 60 && restante > 0);
        }
        if (restante <= 60 && restante > 0 && !avisoMinuto) {
          avisoMinuto = true;
          if (live) live.textContent = 'Queda menos de un minuto para completar el pago.';
          toast('Queda menos de un minuto para completar tu pago.', 'aviso', 6000);
        }
        if (restante <= 30 && !aviso30 && restante > 0) {
          aviso30 = true;
        }
        if (restante <= 0) mostrarExpirada();
      };

      if (!expirada) {
        actualizarTimer();
        temporizador = setInterval(actualizarTimer, 1000);
      } else {
        mostrarExpirada();
      }

      function mostrarPanelExpirada() {
        if (panelPago) panelPago.classList.add('panel--oculto');
        if (panelTimer) panelTimer.classList.add('panel--expirada');
      }
      if (expirada) mostrarPanelExpirada();

      /* Formato amable de tarjeta y vencimiento. */
      raiz.querySelector('#pago-numero')?.addEventListener('input', (evento) => {
        evento.target.value = formatearNumeroTarjeta(evento.target.value);
      });
      raiz.querySelector('#pago-vencimiento')?.addEventListener('input', (evento) => {
        const digitos = evento.target.value.replace(/\D/g, '').slice(0, 4);
        evento.target.value = digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
      });
      raiz.querySelector('#pago-cvv')?.addEventListener('input', (evento) => {
        evento.target.value = evento.target.value.replace(/\D/g, '').slice(0, 3);
      });

      raiz.querySelectorAll('[data-tarjeta]').forEach((boton) => {
        boton.addEventListener('click', () => {
          const numero = raiz.querySelector('#pago-numero');
          if (numero) numero.value = formatearNumeroTarjeta(boton.dataset.tarjeta);
          const titular = raiz.querySelector('#pago-titular');
          if (titular && !titular.value) titular.value = 'ANA PEREZ';
          const vencimiento = raiz.querySelector('#pago-vencimiento');
          if (vencimiento && !vencimiento.value) vencimiento.value = '12/28';
          const cvv = raiz.querySelector('#pago-cvv');
          if (cvv && !cvv.value) cvv.value = '123';
          ponerGeneral('');
          raiz.querySelector('#pago-titular')?.focus();
        });
      });

      const liberar = async () => {
        const aceptar = await confirmar({
          titulo: 'Liberar tus asientos',
          mensaje: 'La reserva se cancelará y tus butacas volverán a estar disponibles. ¿Quieres continuar?',
          aceptar: 'Sí, liberar',
          cancelar: 'Seguir con el pago',
          peligro: true,
        });
        if (!aceptar) return;
        try {
          await app.datos.liberarReserva(reserva.id);
          clearInterval(temporizador);
          toast('Reserva liberada. Puedes elegir otras butacas.', 'info');
          app.ir('/cartelera');
        } catch (error) {
          if (error?.codigo === 'RESERVA_VENCIDA' || error?.codigo === 'RESERVA_LIBERADA') {
            mostrarExpirada();
            mostrarPanelExpirada();
          } else {
            toast(mensajeDeError(error), 'error');
          }
        }
      };

      raiz.querySelector('[data-liberar]')?.addEventListener('click', liberar);

      form?.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (pagando || expirada) return;
        const datosFormulario = Object.fromEntries(new FormData(form).entries());
        const validacion = validarPago(datosFormulario, new Date());
        if (!validacion.valido) {
          mostrarErrores(validacion.errores);
          ponerGeneral('Revisa los datos marcados en rojo.', 'error');
          return;
        }
        mostrarErrores({});
        ponerGeneral('');
        pagando = true;
        const boton = form.querySelector('[data-pagar]');
        const original = boton?.innerHTML;
        if (boton) {
          boton.disabled = true;
          boton.innerHTML = '<span class="spinner" aria-hidden="true"></span> Procesando pago simulado…';
        }
        try {
          const pago = await app.datos.pagarReserva(reserva.id, datosFormulario);
          if (pago.resultado === 'aprobado') {
            clearInterval(temporizador);
            toast('¡Pago aprobado! Tus boletos están listos.', 'exito');
            app.ir(`/orden/${pago.orden.id}?nueva=1`);
            return;
          }
          if (boton) {
            boton.disabled = false;
            boton.innerHTML = original;
          }
          pagando = false;
          const restante = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
          ponerGeneral(
            `El pago fue <strong>rechazado</strong> por el banco simulado. La reserva sigue activa por ${minutosSegundos(restante)} más; puedes reintentar con otra tarjeta.`,
            'error'
          );
          toast('Pago rechazado. Intenta de nuevo antes de que venza la reserva.', 'aviso', 7000);
          form.querySelector('#pago-numero')?.focus();
        } catch (error) {
          if (boton) {
            boton.disabled = false;
            boton.innerHTML = original;
          }
          pagando = false;
          if (error?.codigo === 'RESERVA_VENCIDA' || error?.codigo === 'RESERVA_LIBERADA' || error?.status === 410) {
            mostrarExpirada();
            mostrarPanelExpirada();
          } else if (error?.codigo === 'RESERVA_PAGADA') {
            toast('Esta reserva ya fue pagada.', 'aviso');
            app.refrescarTodo();
          } else if (error?.codigo === 'SOLICITUD_INVALIDA') {
            const campo = error.detalles?.campo;
            if (campo) mostrarErrores({ [campo]: error.mensaje });
            ponerGeneral(error.mensaje || mensajeDeError(error), 'error');
          } else if (error?.codigo === 'NO_AUTENTICADO') {
            app.cerrarSesionLocal();
            app.pedirLogin({ motivo: 'Tu sesión terminó. Inicia sesión para pagar esta reserva.' });
          } else {
            ponerGeneral(mensajeDeError(error), 'error');
            toast(mensajeDeError(error), 'error', 7000);
          }
        }
      });

      return () => {
        clearInterval(temporizador);
      };
    },
  };
}
