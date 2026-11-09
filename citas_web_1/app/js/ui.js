/* Componentes de interfaz reutilizables: iconos, avisos, diálogos y notificaciones. */

import { escaparHtml } from './utils.js';

const ICONOS = {
  calendario:
    '<path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/>',
  reloj: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  asiento: '<path d="M6 10V7a6 6 0 0 1 12 0v3M5 10h14a2 2 0 0 1 2 2v5H3v-5a2 2 0 0 1 2-2ZM6 17v3M18 17v3"/>',
  boleto:
    '<path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z"/><path d="M14 5v14" stroke-dasharray="2 3"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  flechaIzq: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  equis: '<path d="m6 6 12 12M18 6 6 18"/>',
  usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  salir: '<path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"/>',
  tarjeta: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
  escudo: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  chispa: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
  alerta: '<path d="M12 4 3 20h18L12 4Z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  izquierda: '<path d="m15 5-7 7 7 7"/>',
  derecha: '<path d="m9 5 7 7-7 7"/>',
  abajo: '<path d="m5 9 7 7 7-7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  inicio: '<path d="m3 11 9-8 9 8M5 10v10h14V10"/>',
  recargar: '<path d="M20 11a8 8 0 1 0-2.3 6M20 5v6h-6"/>',
  descargar: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  imprimir: '<path d="M7 9V4h10v5M7 18H5a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M7 14h10v7H7v-7Z"/>',
  candado: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  ojo: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.6"/>',
  teatro: '<path d="M4 5h16v3c-3 0-4 1.5-4 3.5S17 15 20 15v4H4v-4c3 0 4-1.5 4-3.5S7 8 4 8V5Z"/><path d="M9 13c1 1.2 5 1.2 6 0"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2M14 18h2v2h-2zM18 18h2v2h-2z"/>',
  ubicacion: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  nube: '<path d="M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6.2 9 4.5 4.5 0 0 0 7 18Z"/>',
  rayo: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
};

export function icono(nombre, clase = '') {
  const contenido = ICONOS[nombre] || ICONOS.info;
  return `<svg class="icon ${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${contenido}</svg>`;
}

export function marca() {
  return `
    <span class="brand__mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" focusable="false">
        <path d="M10 16h44v8c-8 0-11 4-11 8s3 8 11 8v8H10v-8c8 0 11-4 11-8s-3-8-11-8v-8Z" fill="url(#telonGrad)"/>
        <path d="M10 16h44v8c-8 0-11 4-11 8s3 8 11 8v8H10v-8c8 0 11-4 11-8s-3-8-11-8v-8Z" stroke="rgba(255,248,242,.35)" stroke-width="1.5"/>
        <circle cx="25" cy="33" r="2.4" fill="#170F24"/>
        <circle cx="39" cy="33" r="2.4" fill="#170F24"/>
        <path d="M24 39c2.6 3 13.4 3 16 0" stroke="#170F24" stroke-width="2.6" stroke-linecap="round"/>
        <defs>
          <linearGradient id="telonGrad" x1="10" y1="16" x2="54" y2="48" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FF6B5E"/><stop offset="1" stop-color="#F5C77A"/>
          </linearGradient>
        </defs>
      </svg>
    </span>`;
}

let contadorToast = 0;

export function toast(mensaje, tipo = 'info', duracion = 5000) {
  const region = document.getElementById('toast-region');
  if (!region) return;
  contadorToast += 1;
  const id = `toast-${contadorToast}`;
  const clases = { exito: 'toast--exito', error: 'toast--error', aviso: 'toast--aviso', info: 'toast--info' };
  const iconos = { exito: 'check', error: 'alerta', aviso: 'alerta', info: 'info' };
  const nodo = document.createElement('div');
  nodo.className = `toast ${clases[tipo] || clases.info}`;
  nodo.id = id;
  nodo.innerHTML = `
    <span class="toast__icon">${icono(iconos[tipo] || 'info')}</span>
    <p class="toast__text">${escaparHtml(mensaje)}</p>
    <button class="toast__close" type="button" aria-label="Cerrar aviso">${icono('equis')}</button>`;
  const cerrar = () => {
    nodo.classList.add('toast--saliendo');
    setTimeout(() => nodo.remove(), 220);
  };
  nodo.querySelector('.toast__close')?.addEventListener('click', cerrar);
  region.append(nodo);
  if (duracion > 0) setTimeout(cerrar, duracion);
  return cerrar;
}

export function avisoHtml(mensaje, tipo = 'info', extra = '') {
  const iconos = { exito: 'check', error: 'alerta', aviso: 'alerta', info: 'info' };
  return `<div class="aviso aviso--${tipo} ${extra}" role="${tipo === 'error' ? 'alert' : 'status'}">
    <span class="aviso__icon">${icono(iconos[tipo] || 'info')}</span>
    <div class="aviso__body">${mensaje}</div>
  </div>`;
}

export function abrirModal({ titulo, contenido, etiqueta = 'Diálogo', ancho = '520px', alMontar, alCerrar, cerrarAlFondo = true }) {
  const raiz = document.getElementById('modal-root');
  if (!raiz) return { cerrar: () => {} };
  const anterior = document.activeElement;
  const capa = document.createElement('div');
  capa.className = 'modal-layer';
  capa.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" style="--modal-ancho:${ancho}">
      <div class="modal__head">
        <div>
          <p class="modal__eyebrow">${escaparHtml(etiqueta)}</p>
          <h2 class="modal__title" id="modal-titulo">${escaparHtml(titulo)}</h2>
        </div>
        <button class="icon-btn modal__close" type="button" aria-label="Cerrar">${icono('equis')}</button>
      </div>
      <div class="modal__body">${contenido}</div>
    </div>`;
  raiz.append(capa);
  document.body.classList.add('sin-scroll');

  const dialogo = capa.querySelector('.modal');
  const cerrar = () => {
    capa.classList.add('modal-layer--saliendo');
    document.removeEventListener('keydown', alTeclear);
    setTimeout(() => {
      capa.remove();
      if (!document.querySelector('.modal-layer')) document.body.classList.remove('sin-scroll');
      if (anterior instanceof HTMLElement) anterior.focus({ preventScroll: true });
      alCerrar?.();
    }, 170);
  };

  function alTeclear(evento) {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      cerrar();
      return;
    }
    if (evento.key !== 'Tab' || !dialogo) return;
    const enfocables = dialogo.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!enfocables.length) return;
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  capa.querySelector('.modal__close')?.addEventListener('click', cerrar);
  if (cerrarAlFondo) {
    capa.addEventListener('mousedown', (evento) => {
      if (evento.target === capa) cerrar();
    });
  }
  document.addEventListener('keydown', alTeclear);
  requestAnimationFrame(() => {
    const primerCampo = dialogo?.querySelector('input, button:not(.modal__close), select, textarea');
    (primerCampo instanceof HTMLElement ? primerCampo : dialogo)?.focus({ preventScroll: true });
  });
  alMontar?.(dialogo, cerrar);
  return { cerrar, dialogo };
}

export function confirmar({ titulo = '¿Continuar?', mensaje = '', aceptar = 'Aceptar', cancelar = 'Cancelar', peligro = false }) {
  return new Promise((resolver) => {
    let decidido = false;
    const modal = abrirModal({
      titulo,
      etiqueta: 'Confirmación',
      ancho: '460px',
      contenido: `
        <p class="modal__text">${escaparHtml(mensaje)}</p>
        <div class="modal__actions">
          <button class="btn btn--ghost" type="button" data-cancelar>${escaparHtml(cancelar)}</button>
          <button class="btn ${peligro ? 'btn--peligro' : 'btn--primary'}" type="button" data-aceptar>${escaparHtml(aceptar)}</button>
        </div>`,
      alMontar(dialogo, cerrar) {
        dialogo.querySelector('[data-cancelar]')?.addEventListener('click', () => {
          decidido = true;
          resolver(false);
          cerrar();
        });
        dialogo.querySelector('[data-aceptar]')?.addEventListener('click', () => {
          decidido = true;
          resolver(true);
          cerrar();
        });
      },
      alCerrar() {
        if (!decidido) resolver(false);
      },
    });
    return modal;
  });
}

export function skeletonMapa() {
  return `
    <div class="skeleton-map" aria-hidden="true">
      <div class="skeleton skeleton--stage"></div>
      ${Array.from({ length: 8 }, () => '<div class="skeleton-row">' + '<i class="skeleton skeleton--seat"></i>'.repeat(10) + '</div>').join('')}
    </div>`;
}

export function estadoVacio({ icono: nombreIcono = 'boleto', titulo, texto, accion = '' }) {
  return `<div class="vacio">
    <span class="vacio__icon">${icono(nombreIcono)}</span>
    <h3>${escaparHtml(titulo)}</h3>
    <p>${escaparHtml(texto)}</p>
    ${accion}
  </div>`;
}

export function insigniaModo(estado) {
  const demo = estado.modo === 'demo';
  return `<span class="mode-chip ${demo ? 'mode-chip--demo' : 'mode-chip--api'}" title="${escaparHtml(estado.motivo)}">
    <span class="mode-chip__dot"></span>${demo ? 'Demo local' : 'API en línea'}
  </span>`;
}
