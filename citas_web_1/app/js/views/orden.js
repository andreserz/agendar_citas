/* Confirmación de compra y detalle de orden con boletos y código QR. */

import { buscarZona } from '../domain.js';
import { mensajeDeError } from '../errors.js';
import { avisoHtml, icono, toast } from '../ui.js';
import {
  escaparHtml,
  formatearFecha,
  formatearFechaHora,
  formatearHora,
  formatearMoneda,
  hash32,
} from '../utils.js';

function patronRespaldo(codigo) {
  const celdas = [];
  for (let y = 0; y < 21; y += 1) {
    for (let x = 0; x < 21; x += 1) {
      const bit = hash32(`${codigo}|${x}|${y}`) % 3;
      celdas.push(`<i class="${bit === 0 ? 'qr-demo__on' : ''}"></i>`);
    }
  }
  return `<div class="qr-demo" role="img" aria-label="Representación del código QR del boleto ${escaparHtml(codigo)}">${celdas.join('')}</div>`;
}

function dibujarQr(contenedor, codigo) {
  const etiqueta = `Código QR del boleto ${codigo}`;
  try {
    if (typeof window.qrcode === 'function') {
      const qr = window.qrcode(0, 'M');
      qr.addData(codigo);
      qr.make();
      contenedor.innerHTML = qr.createSvgTag({
        cellSize: 5,
        margin: 2,
        scalable: true,
        alt: { text: etiqueta },
      });
      return;
    }
  } catch {
    /* usa respaldo */
  }
  contenedor.innerHTML = patronRespaldo(codigo);
}

export async function renderOrden(app, { ordenId, nueva = false }) {
  if (!app.usuario) {
    return {
      html: `<section class="section"><div class="contenedor">
        <div class="panel glass estado-panel">
          <span class="estado-panel__icon">${icono('candado')}</span>
          <h1>Inicia sesión para ver tus boletos</h1>
          <p>Los códigos QR están asociados a tu cuenta.</p>
          <div class="estado-panel__acciones">
            <button class="btn btn--primary" type="button" data-entrar>${icono('usuario')} Iniciar sesión</button>
            <a class="btn btn--ghost" href="#/">Volver al inicio</a>
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

  let orden;
  try {
    orden = await app.datos.obtenerOrden(ordenId);
  } catch (error) {
    return {
      html: `<section class="section"><div class="contenedor">
        <div class="panel glass estado-panel">
          <span class="estado-panel__icon estado-panel__icon--alerta">${icono('alerta')}</span>
          <h1>No encontramos esa compra</h1>
          <p>${escaparHtml(mensajeDeError(error))}</p>
          <div class="estado-panel__acciones">
            <a class="btn btn--primary" href="#/cuenta">Ir a mis compras</a>
            <a class="btn btn--ghost" href="#/cartelera">Ver cartelera</a>
          </div>
        </div>
      </div></section>`,
    };
  }

  const boletos = orden.boletos || [];
  const primera = boletos[0];
  const funcionInicio = primera?.inicio || orden.fecha;

  const html = `
    ${
      nueva
        ? `<section class="confirmacion-hero">
            <div class="contenedor confirmacion-hero__inner">
              <div class="confirmacion-hero__sello">${icono('check')}</div>
              <p class="eyebrow">${icono('chispa')} Compra confirmada</p>
              <h1>¡Nos vemos en el teatro!</h1>
              <p>Tu pago simulado fue aprobado y tus boletos ya están listos. Guarda esta página o imprime tus códigos QR.</p>
              <div class="confirmacion-hero__orden">
                <span>Número de orden</span>
                <strong>${escaparHtml(orden.numero)}</strong>
              </div>
            </div>
            <div class="confirmacion-hero__confeti" aria-hidden="true">
              ${Array.from({ length: 12 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}
            </div>
          </section>`
        : `<section class="page-head page-head--compact">
            <div class="contenedor page-head__inner">
              <div>
                <p class="eyebrow"><span class="eyebrow__line"></span>Detalle de compra</p>
                <h1>Orden <em>${escaparHtml(orden.numero)}</em></h1>
                <p class="page-head__lead">Compra registrada el ${escaparHtml(formatearFechaHora(orden.fecha))}.</p>
              </div>
              <a class="btn btn--ghost btn--sm" href="#/cuenta">${icono('flechaIzq')} Mis compras</a>
            </div>
          </section>`
    }

    <section class="section section--orden">
      <div class="contenedor orden__grid">
        <div class="orden__principal">
          <div class="panel glass orden__cabecera">
            <div class="orden__dato">
              <span>Orden</span>
              <strong>${escaparHtml(orden.numero)}</strong>
            </div>
            <div class="orden__dato">
              <span>Función</span>
              <strong>${escaparHtml(formatearFecha(funcionInicio, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${escaparHtml(formatearHora(funcionInicio))} h</strong>
            </div>
            <div class="orden__dato">
              <span>Boletos</span>
              <strong>${boletos.length} ${boletos.length === 1 ? 'butaca' : 'butacas'}</strong>
            </div>
            <div class="orden__dato">
              <span>Total</span>
              <strong class="orden__total">${formatearMoneda(orden.total, orden.moneda)}</strong>
            </div>
          </div>

          <div class="boletos" role="list" aria-label="Boletos de la orden">
            ${boletos
              .map((boleto, indice) => {
                const zona = buscarZona(boleto.zonaId);
                return `<article class="boleto" role="listitem" style="--retraso:${indice * 70}ms">
                  <div class="boleto__cuerpo">
                    <div class="boleto__marca">${icono('teatro')} Aquí nadie actúa normal</div>
                    <h2 class="boleto__obra">${escaparHtml(boleto.eventoNombre || '¡Que no se entere la suegra!')}</h2>
                    <div class="boleto__datos">
                      <div><span>Función</span><strong>${escaparHtml(formatearFecha(boleto.inicio, { weekday: 'short', day: 'numeric', month: 'long' }))}</strong><small>${escaparHtml(formatearHora(boleto.inicio))} h</small></div>
                      <div><span>Zona</span><strong>${escaparHtml(zona?.nombre || boleto.zonaId)}</strong><small>Fila ${escaparHtml(String(boleto.etiqueta || '').charAt(0))}</small></div>
                      <div class="boleto__asiento"><span>Butaca</span><strong>${escaparHtml(boleto.etiqueta)}</strong></div>
                    </div>
                    <div class="boleto__pie">
                      <span>${icono('boleto')} Boleto ${String(indice + 1).padStart(2, '0')} · ${formatearMoneda(boleto.precio, orden.moneda)}</span>
                      <span>Pago simulado</span>
                    </div>
                  </div>
                  <div class="boleto__talon">
                    <div class="boleto__qr" data-qr="${escaparHtml(boleto.codigo)}" aria-label="Código QR del boleto ${escaparHtml(boleto.codigo)}"></div>
                    <code class="boleto__codigo">${escaparHtml(boleto.codigo)}</code>
                    <small>Presenta este código en taquilla</small>
                  </div>
                </article>`;
              })
              .join('')}
          </div>

          <div class="orden__acciones">
            <button class="btn btn--primary" type="button" data-imprimir>${icono('imprimir')} Imprimir boletos</button>
            <a class="btn btn--ghost" href="#/cuenta">${icono('boleto')} Ver todas mis compras</a>
            <a class="btn btn--ghost" href="#/cartelera">Comprar otra función</a>
          </div>
        </div>

        <aside class="orden__aside">
          <div class="panel glass orden__instrucciones">
            <h2>Cómo usar tus boletos</h2>
            <ol class="lista-pasos">
              <li><span>1</span>Llega 20 minutos antes de la función.</li>
              <li><span>2</span>Muestra el código QR en taquilla o en la entrada.</li>
              <li><span>3</span>Si no puedes abrir el QR, dicta el código de 12 caracteres.</li>
            </ol>
            <div class="aviso-simulado">${icono('escudo')} <p>Este pago es una simulación académica. No se realizó ningún cargo real.</p></div>
            <dl class="orden__meta">
              <div><dt>Reserva</dt><dd><code>${escaparHtml(orden.reservaId)}</code></dd></div>
              <div><dt>Compra</dt><dd>${escaparHtml(formatearFechaHora(orden.fecha))}</dd></div>
              <div><dt>Moneda</dt><dd>${escaparHtml(orden.moneda)}</dd></div>
            </dl>
            <button class="btn btn--ghost btn--block btn--sm" type="button" data-copiar>${icono('descargar')} Copiar códigos de boleto</button>
          </div>
        </aside>
      </div>
    </section>`;

  return {
    html,
    alMontar(raiz) {
      raiz.querySelectorAll('[data-qr]').forEach((contenedor) => {
        dibujarQr(contenedor, contenedor.dataset.qr);
      });
      raiz.querySelector('[data-imprimir]')?.addEventListener('click', () => window.print());
      raiz.querySelector('[data-copiar]')?.addEventListener('click', async () => {
        const codigos = boletos.map((b) => `${b.etiqueta}: ${b.codigo}`).join('\n');
        try {
          await navigator.clipboard.writeText(codigos);
          toast('Códigos copiados al portapapeles.', 'exito');
        } catch {
          toast('No se pudieron copiar los códigos.', 'error');
        }
      });
    },
  };
}
