/* Cuenta del comprador: reservas vigentes y compras con acceso a boletos. */

import { buscarZona, estadoReserva } from '../domain.js';
import { mensajeDeError } from '../errors.js';
import { confirmar, estadoVacio, icono, toast, avisoHtml } from '../ui.js';
import {
  escaparHtml,
  formatearFecha,
  formatearFechaHora,
  formatearHora,
  formatearMoneda,
  minutosSegundos,
} from '../utils.js';

export async function renderCuenta(app) {
  if (!app.usuario) {
    return {
      html: `<section class="section"><div class="contenedor">
        <div class="panel glass estado-panel">
          <span class="estado-panel__icon">${icono('usuario')}</span>
          <h1>Tu cuenta del teatro</h1>
          <p>Inicia sesión para consultar tus reservas vigentes y tus boletos comprados.</p>
          <div class="estado-panel__acciones">
            <button class="btn btn--primary" type="button" data-entrar>${icono('usuario')} Iniciar sesión</button>
            <button class="btn btn--ghost" type="button" data-registro>Crear una cuenta</button>
          </div>
        </div>
      </div></section>`,
      alMontar(raiz) {
        raiz.querySelector('[data-entrar]')?.addEventListener('click', () => app.pedirLogin());
        raiz.querySelector('[data-registro]')?.addEventListener('click', () => app.pedirLogin('registro'));
      },
    };
  }

  let reservas = [];
  let ordenes = [];
  let catalogo = null;
  let huboError = null;
  try {
    catalogo = await app.cargarCatalogo();
  } catch {
    /* la cuenta puede funcionar sin catálogo */
  }
  try {
    const [respuestaReservas, respuestaOrdenes] = await Promise.all([
      app.datos.listarReservas({ estado: 'activa' }),
      app.datos.listarOrdenes(),
    ]);
    reservas = (respuestaReservas?.reservas || []).filter((r) => estadoReserva(r) === 'activa');
    ordenes = respuestaOrdenes?.ordenes || [];
  } catch (error) {
    huboError = error;
  }

  if (huboError) {
    return {
      html: `<section class="section"><div class="contenedor">
        ${avisoHtml(`No pudimos cargar tu cuenta. ${escaparHtml(mensajeDeError(huboError))}`, 'error')}
        <button class="btn btn--primary" type="button" data-reintentar>${icono('recargar')} Reintentar</button>
      </div></section>`,
      alMontar(raiz) {
        raiz.querySelector('[data-reintentar]')?.addEventListener('click', () => app.refrescarTodo());
      },
    };
  }

  const funcionesPorId = new Map((catalogo?.funciones || []).map((f) => [f.id, f]));
  const inicial = (app.usuario.nombre || '?').charAt(0).toUpperCase();

  const html = `
    <section class="page-head page-head--compact">
      <div class="contenedor page-head__inner">
        <div>
          <p class="eyebrow"><span class="eyebrow__line"></span>Mi cuenta</p>
          <h1>Hola, <em>${escaparHtml((app.usuario.nombre || '').split(' ')[0] || 'teatrero')}</em></h1>
          <p class="page-head__lead">Aquí viven tus reservas y tus boletos. Nada de lo que elegiste se pierde.</p>
        </div>
        <a class="btn btn--primary btn--sm" href="#/cartelera">${icono('boleto')} Comprar boletos</a>
      </div>
    </section>

    <section class="section section--cuenta">
      <div class="contenedor cuenta__grid">
        <aside class="cuenta__perfil">
          <div class="panel glass perfil">
            <div class="perfil__avatar" aria-hidden="true">${escaparHtml(inicial)}</div>
            <h2>${escaparHtml(app.usuario.nombre)}</h2>
            <p class="perfil__correo">${icono('correo')} ${escaparHtml(app.usuario.correo)}</p>
            <div class="perfil__stats">
              <div><strong>${reservas.length}</strong><span>${reservas.length === 1 ? 'reserva activa' : 'reservas activas'}</span></div>
              <div><strong>${ordenes.length}</strong><span>${ordenes.length === 1 ? 'compra' : 'compras'}</span></div>
              <div><strong>${ordenes.reduce((total, o) => total + (o.boletos?.length || 0), 0)}</strong><span>boletos</span></div>
            </div>
            <div class="perfil__acciones">
              <a class="btn btn--ghost btn--block btn--sm" href="#/cartelera">${icono('calendario')} Ver cartelera</a>
              <button class="btn btn--ghost btn--block btn--sm" type="button" data-salir>${icono('salir')} Cerrar sesión</button>
            </div>
          </div>
          <div class="panel glass perfil__nota">
            ${icono('escudo')}
            <p><strong>Pago simulado.</strong> Las compras de esta demo no generan cargos ni envíos de correo.</p>
          </div>
        </aside>

        <div class="cuenta__contenido">
          <section class="cuenta__bloque" aria-labelledby="titulo-reservas">
            <div class="section__head section__head--small">
              <div>
                <p class="eyebrow">En curso</p>
                <h2 id="titulo-reservas">Reservas activas</h2>
              </div>
              <span class="pill-numero">${reservas.length}</span>
            </div>
            ${
              reservas.length
                ? `<div class="reservas-lista">${reservas
                    .map((reserva) => {
                      const funcion = funcionesPorId.get(reserva.funcionId);
                      const inicio = funcion?.inicio || reserva.funcionInicio || reserva.creadaEn;
                      const expira = new Date(reserva.expiraEn).getTime();
                      return `<article class="reserva-card panel glass" data-reserva="${escaparHtml(reserva.id)}">
                        <div class="reserva-card__fecha">
                          <span>${escaparHtml(formatearFecha(inicio, { weekday: 'short' }))}</span>
                          <strong>${escaparHtml(formatearFecha(inicio, { day: 'numeric', month: 'short' }))}</strong>
                          <small>${escaparHtml(formatearHora(inicio))} h</small>
                        </div>
                        <div class="reserva-card__info">
                          <h3>${escaparHtml(funcion ? '¡Que no se entere la suegra!' : 'Función reservada')}</h3>
                          <p>${(reserva.asientos || []).map((a) => `<span class="butaca-mini">${escaparHtml(a.etiqueta)}</span>`).join('')}</p>
                          <div class="reserva-card__meta">
                            <span>${icono('reloj')} <span data-cuenta-timer data-expira="${expira}">${minutosSegundos(Math.max(0, Math.round((expira - Date.now()) / 1000)))}</span> restantes</span>
                            <span>${formatearMoneda(reserva.total, reserva.moneda)}</span>
                          </div>
                        </div>
                        <div class="reserva-card__acciones">
                          <a class="btn btn--primary btn--sm" href="#/checkout/${encodeURIComponent(reserva.id)}">${icono('tarjeta')} Continuar pago</a>
                          <button class="btn btn--ghost btn--xs" type="button" data-liberar="${escaparHtml(reserva.id)}">Liberar</button>
                        </div>
                      </article>`;
                    })
                    .join('')}</div>`
                : estadoVacio({
                    icono: 'reloj',
                    titulo: 'No tienes reservas activas',
                    texto: 'Cuando apartes asientos, aparecerán aquí con su cuenta regresiva de 5 minutos.',
                    accion: '<a class="btn btn--ghost btn--sm" href="#/cartelera">Elegir función</a>',
                  })
            }
          </section>

          <section class="cuenta__bloque" aria-labelledby="titulo-compras">
            <div class="section__head section__head--small">
              <div>
                <p class="eyebrow">Historial</p>
                <h2 id="titulo-compras">Mis compras</h2>
              </div>
              <span class="pill-numero">${ordenes.length}</span>
            </div>
            ${
              ordenes.length
                ? `<div class="compras-lista">${ordenes
                    .map((orden) => {
                      const primera = orden.boletos?.[0];
                      const inicio = primera?.inicio || orden.fecha;
                      const butacas = (orden.boletos || []).map((b) => b.etiqueta).join(', ');
                      return `<article class="compra-card panel glass">
                        <div class="compra-card__icono">${icono('boleto')}</div>
                        <div class="compra-card__info">
                          <div class="compra-card__top">
                            <h3>${escaparHtml(orden.numero)}</h3>
                            <span class="tag-exito">${icono('check')} Pagada</span>
                          </div>
                          <p>${escaparHtml(formatearFecha(inicio, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${escaparHtml(formatearHora(inicio))} h</p>
                          <div class="compra-card__meta">
                            <span>${icono('asiento')} ${escaparHtml(butacas)}</span>
                            <span>${icono('calendario')} ${escaparHtml(formatearFechaHora(orden.fecha))}</span>
                            <strong>${formatearMoneda(orden.total, orden.moneda)}</strong>
                          </div>
                        </div>
                        <a class="btn btn--ghost btn--sm" href="#/orden/${encodeURIComponent(orden.id)}">Ver boletos ${icono('flecha')}</a>
                      </article>`;
                    })
                    .join('')}</div>`
                : estadoVacio({
                    icono: 'boleto',
                    titulo: 'Todavía no tienes compras',
                    texto: 'Cuando completes un pago simulado, tus boletos con código QR aparecerán aquí.',
                    accion: '<a class="btn btn--primary btn--sm" href="#/cartelera">Comprar mi primer boleto</a>',
                  })
            }
          </section>
        </div>
      </div>
    </section>`;

  return {
    html,
    alMontar(raiz) {
      raiz.querySelector('[data-salir]')?.addEventListener('click', async () => {
        const aceptar = await confirmar({
          titulo: 'Cerrar sesión',
          mensaje: '¿Quieres salir de tu cuenta? Tus datos siguen guardados en este navegador.',
          aceptar: 'Cerrar sesión',
          cancelar: 'Quedarme',
        });
        if (aceptar) app.cerrarSesion();
      });

      raiz.querySelectorAll('[data-liberar]').forEach((boton) => {
        boton.addEventListener('click', async () => {
          const aceptar = await confirmar({
            titulo: 'Liberar reserva',
            mensaje: 'Los asientos volverán a estar disponibles para otras personas. Esta acción no se puede deshacer.',
            aceptar: 'Liberar asientos',
            cancelar: 'Conservar',
            peligro: true,
          });
          if (!aceptar) return;
          boton.disabled = true;
          try {
            await app.datos.liberarReserva(boton.dataset.liberar);
            toast('Reserva liberada.', 'info');
            app.refrescarTodo();
          } catch (error) {
            toast(mensajeDeError(error), 'error');
            boton.disabled = false;
            app.refrescarTodo();
          }
        });
      });

      const temporizador = setInterval(() => {
        raiz.querySelectorAll('[data-cuenta-timer]').forEach((nodo) => {
          const expira = Number(nodo.dataset.expira);
          const restante = Math.max(0, Math.round((expira - Date.now()) / 1000));
          nodo.textContent = minutosSegundos(restante);
          if (restante <= 0) {
            nodo.textContent = 'vencida';
            const accion = nodo.closest('.reserva-card')?.querySelector('[data-continuar]');
            if (accion) accion.setAttribute('aria-disabled', 'true');
          }
        });
      }, 1000);
      return () => clearInterval(temporizador);
    },
  };
}
