/* Portada: obra, sinopsis, próximas funciones y cómo comprar. */

import { EVENTO, ZONAS, formatearEtiquetaAsientos, funcionesVisibles } from '../domain.js';
import { escaparHtml, formatearFecha, formatearHora, formatearMoneda, claveDia, plural } from '../utils.js';
import { icono, avisoHtml } from '../ui.js';

const POSTER = `
  <div class="poster" aria-hidden="true">
    <div class="poster__spot poster__spot--1"></div>
    <div class="poster__spot poster__spot--2"></div>
    <div class="poster__telon poster__telon--izq"></div>
    <div class="poster__telon poster__telon--der"></div>
    <div class="poster__escenario">
      <svg viewBox="0 0 240 210" fill="none" focusable="false">
        <ellipse cx="120" cy="188" rx="78" ry="12" fill="rgba(0,0,0,.28)"/>
        <path d="M52 34h136v30c-25 0-34 12-34 25s9 25 34 25v47H52V114c25 0 34-12 34-25S77 64 52 64V34Z" fill="url(#posterTelon)" stroke="rgba(255,248,242,.28)" stroke-width="1.6"/>
        <path d="M68 54c0 8 8 14 18 14M172 54c0 8-8 14-18 14" stroke="rgba(23,15,36,.35)" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="96" cy="94" r="4.5" fill="#170F24"/>
        <circle cx="144" cy="94" r="4.5" fill="#170F24"/>
        <path d="M93 112c7 8 47 8 54 0" stroke="#170F24" stroke-width="5" stroke-linecap="round"/>
        <path d="M70 150h100" stroke="rgba(255,248,242,.35)" stroke-width="2" stroke-linecap="round"/>
        <text x="120" y="176" text-anchor="middle" fill="#F5C77A" font-size="13" font-family="Georgia, serif" letter-spacing="2">COMEDIA</text>
        <defs>
          <linearGradient id="posterTelon" x1="52" y1="34" x2="188" y2="161" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FF6B5E"/><stop offset=".55" stop-color="#B53A55"/><stop offset="1" stop-color="#3B174C"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div class="poster__marco"></div>
    <span class="poster__sticker">¡Sólo 120 butacas!</span>
  </div>`;

function tarjetaFunciones(funciones, limiteDias = 3) {
  const futuras = funcionesVisibles(funciones);
  const porDia = new Map();
  for (const funcion of futuras) {
    const clave = claveDia(funcion.inicio);
    if (!porDia.has(clave)) porDia.set(clave, []);
    porDia.get(clave).push(funcion);
  }
  const dias = [...porDia.entries()].slice(0, limiteDias);
  if (!dias.length) {
    return avisoHtml('Aún no hay funciones programadas. Consulta más tarde.', 'aviso');
  }
  return `<div class="mini-funciones">
    ${dias
      .map(
        ([clave, lista]) => `<div class="mini-funcion">
          <div class="mini-funcion__fecha">
            <span class="mini-funcion__dia">${escaparHtml(formatearFecha(lista[0].inicio, { weekday: 'short' }))}</span>
            <strong>${escaparHtml(formatearFecha(lista[0].inicio, { day: 'numeric', month: 'long' }))}</strong>
            <small>${lista.reduce((total, f) => total + (f.asientosDisponibles ?? 0), 0)} lugares libres</small>
          </div>
          <div class="mini-funcion__horas">
            ${lista
              .map(
                (funcion) => `<a class="hora-pill" href="#/cartelera?funcion=${encodeURIComponent(funcion.id)}">
                  <span>${escaparHtml(formatearHora(funcion.inicio))}</span>
                  <small>${funcion.asientosDisponibles != null ? `${funcion.asientosDisponibles} libres` : 'Elegir'}</small>
                </a>`
              )
              .join('')}
          </div>
        </div>`
      )
      .join('')}
  </div>`;
}

export async function renderHome(app) {
  let catalogo;
  try {
    catalogo = await app.cargarCatalogo();
  } catch (error) {
    return {
      html: `<section class="section">
        <div class="contenedor">${avisoHtml(
          `No pudimos cargar la cartelera. ${escaparHtml(error?.mensaje || 'Intenta de nuevo.')}`,
          'error'
        )}<button class="btn btn--primary" type="button" data-reintentar>${icono('recargar')} Reintentar</button></div>
      </section>`,
      alMontar(raiz) {
        raiz.querySelector('[data-reintentar]')?.addEventListener('click', () => app.refrescarTodo());
      },
    };
  }

  const { funciones } = catalogo;
  const futuras = funcionesVisibles(funciones);
  const proxima = futuras[0];
  const totalLibres = futuras.slice(0, 9).reduce((total, f) => total + (f.asientosDisponibles || 0), 0);

  return {
    html: `
      <section class="hero">
        <div class="contenedor hero__grid">
          <div class="hero__copy">
            <p class="eyebrow"><span class="eyebrow__line"></span>Teatro Aquí nadie actúa normal</p>
            <h1 class="hero__title">¡Que no se<br/><em>entere</em> la<br/>suegra!</h1>
            <p class="hero__lead">${escaparHtml(EVENTO.descripcion)}</p>
            <div class="hero__meta">
              <span class="meta-chip">${icono('calendario')} Oct — Dic 2026</span>
              <span class="meta-chip">${icono('reloj')} Jue · Vie · Sáb</span>
              <span class="meta-chip">${icono('teatro')} 120 butacas</span>
            </div>
            <div class="hero__cta">
              <a class="btn btn--primary btn--lg" href="#/cartelera">${icono('boleto')} Elegir función y asientos</a>
              <a class="btn btn--ghost btn--lg" href="#la-obra">Conocer la obra</a>
            </div>
            <p class="hero__nota">${icono('escudo')} Reserva por 5 minutos · Pago simulado · Sin cargos reales</p>
          </div>
          <div class="hero__visual">
            ${POSTER}
            <div class="hero__flotante glass">
              <span class="hero__flotante-icon">${icono('chispa')}</span>
              <div>
                <strong>${totalLibres.toLocaleString('es-MX')} lugares libres</strong>
                <small>en las próximas funciones</small>
              </div>
            </div>
            ${proxima ? `<a class="hero__proxima glass" href="#/cartelera?funcion=${encodeURIComponent(proxima.id)}">
              <span>Próxima función</span>
              <strong>${escaparHtml(formatearFecha(proxima.inicio, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${escaparHtml(formatearHora(proxima.inicio))} h</strong>
              <em>Reservar ${icono('flecha')}</em>
            </a>` : ''}
          </div>
        </div>
        <div class="hero__curtain" aria-hidden="true"></div>
      </section>

      <section class="section section--proximas" aria-labelledby="titulo-proximas">
        <div class="contenedor">
          <div class="section__head">
            <div>
              <p class="eyebrow"><span class="eyebrow__line"></span>Cartelera</p>
              <h2 id="titulo-proximas">Próximas funciones</h2>
            </div>
            <a class="btn btn--ghost btn--sm" href="#/cartelera">Ver toda la cartelera ${icono('flecha')}</a>
          </div>
          ${tarjetaFunciones(funciones, 3)}
        </div>
      </section>

      <section class="section" id="la-obra" aria-labelledby="titulo-obra">
        <div class="contenedor obra__grid">
          <div class="obra__texto">
            <p class="eyebrow"><span class="eyebrow__line"></span>La obra</p>
            <h2 id="titulo-obra">Una cena. Una mentira.<br/><em>Demasiadas puertas.</em></h2>
            <p class="obra__lead">${escaparHtml(EVENTO.sinopsis)}</p>
            <div class="obra__datos">
              <div class="dato glass"><span>${icono('reloj')}</span><div><strong>1 h 50 min</strong><small>Con intermedio</small></div></div>
              <div class="dato glass"><span>${icono('usuario')}</span><div><strong>Comedia familiar</strong><small>Todo público</small></div></div>
              <div class="dato glass"><span>${icono('ubicacion')}</span><div><strong>Teatro Aquí nadie actúa normal</strong><small>Sala principal · 120 butacas</small></div></div>
            </div>
            <blockquote class="cita glass">
              <span class="cita__comilla">“</span>
              <p>La suegra llega a las ocho. A las ocho y cinco, la familia ya tiene tres versiones distintas de la verdad.</p>
            </blockquote>
          </div>
          <aside class="obra__aside glass" aria-label="Zonas y precios">
            <h3>Zonas y precios</h3>
            <p class="obra__aside-sub">Precio por asiento y función</p>
            <ul class="zonas-lista">
              ${ZONAS.map(
                (zona) => `<li>
                  <span class="zonas-lista__punto zonas-lista__punto--${zona.id}" aria-hidden="true"></span>
                  <div><strong>${escaparHtml(zona.nombre)}</strong><small>Filas ${zona.filas[0]}–${zona.filas[zona.filas.length - 1]} · ${zona.filas.length * 10} lugares</small></div>
                  <span class="zonas-lista__precio">${formatearMoneda(zona.precio)}</span>
                </li>`
              ).join('')}
            </ul>
            <div class="obra__aside-pie">
              <span>${icono('asiento')} Elige hasta 10 asientos</span>
              <span>${icono('reloj')} 5 minutos para pagar</span>
            </div>
            <a class="btn btn--primary btn--block" href="#/cartelera">${icono('boleto')} Comprar boletos</a>
          </aside>
        </div>
      </section>

      <section class="section section--pasos" aria-labelledby="titulo-pasos">
        <div class="contenedor">
          <div class="section__head section__head--centrado">
            <p class="eyebrow">Así de fácil</p>
            <h2 id="titulo-pasos">Tu butaca, en tres actos</h2>
          </div>
          <ol class="pasos">
            <li class="paso glass">
              <span class="paso__num">01</span>
              <span class="paso__icon">${icono('calendario')}</span>
              <h3>Elige función</h3>
              <p>Jueves, viernes y sábados a las 15:00, 19:00 y 21:00 h. Consulta la disponibilidad al instante.</p>
            </li>
            <li class="paso glass">
              <span class="paso__num">02</span>
              <span class="paso__icon">${icono('asiento')}</span>
              <h3>Selecciona tu butaca</h3>
              <p>Mapa interactivo con zonas Preferente, General y Balcón. Puedes elegir hasta 10 asientos.</p>
            </li>
            <li class="paso glass">
              <span class="paso__num">03</span>
              <span class="paso__icon">${icono('qr')}</span>
              <h3>Paga y recibe tu QR</h3>
              <p>Reserva por 5 minutos, paga de forma simulada y lleva tus boletos con código QR en el celular.</p>
            </li>
          </ol>
        </div>
      </section>

      <section class="section section--cta">
        <div class="contenedor cta-final glass">
          <div class="cta-final__texto">
            <p class="eyebrow">Función limitada</p>
            <h2>La suegra ya viene en camino.</h2>
            <p>No dejes que se entere de nada… y no te quedes sin butaca. Elige tu función y arma tu noche de teatro.</p>
          </div>
          <a class="btn btn--primary btn--lg" href="#/cartelera">${icono('boleto')} Reservar ahora</a>
        </div>
      </section>`,
  };
}
