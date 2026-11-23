import { ApiCliente } from './api-client.js';
import { crearDemoService } from './demo-service.js';
import {
  agregarSeleccion, dinero, escaparHtml, fechaCDMX, fechaDeFuncion, fechaLegible,
  horaCDMX, normalizarEstado, precioFuncion, totalSeleccion, validarTarjeta, FOLIO_RE,
} from './domain.js';
import { ErrorApp, mensajeVisible } from './errors.js';

const config = window.CITAS_CONFIG || {};
const api = new ApiCliente(config);
const demo = crearDemoService();
const SESSION_KEY = 'citas-web2-checkout';
const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const estado = {
  proveedor: null, modo: config.modo || 'auto', demoActivo: false, evento: null,
  funciones: [], fecha: fechaCDMX(), pantalla: 'cartelera', funcion: null, asientos: [],
  seleccion: new Set(), conflictos: new Set(), reserva: null, orden: null,
  segundos: 0, notice: '', noticeError: false, errorGlobal: '', reporte: [],
};
let timer = null;
let toastTimer = null;

const array = (dato) => Array.isArray(dato) ? dato : [];
const salaDe = (funcion) => funcion?.sala || funcion?.zonas?.[0]?.nombre || 'Sala por confirmar';
const salaBoleto = (boleto) => {
  const numero = String(boleto?.zonaId || '').match(/sala[- ]?(\d+)/i)?.[1];
  return boleto?.sala || (numero ? `Sala ${numero}` : salaDe(estado.funcion || {}));
};
const formatoDe = (funcion) => funcion?.formato || (salaDe(funcion).match(/\d+/)?.[0] <= 5 ? '2D' : '3D');
const precioDe = (funcion) => precioFuncion(funcion) || (formatoDe(funcion) === '3D' ? 150 : 100);

function setNotice(texto, error = false) {
  estado.notice = texto;
  estado.noticeError = error;
}

function mostrarToast(texto) {
  toast.textContent = texto;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

function avisoHtml() {
  if (!estado.demoActivo && !estado.errorGlobal) return '';
  if (estado.demoActivo) {
    const puedeProbarServicio = ['cartelera', 'recuperar', 'reporte'].includes(estado.pantalla);
    return `<div class="notice" role="status"><span><strong>Modo demo</strong> · La cartelera y las compras son datos de demostración.</span>${puedeProbarServicio ? '<button class="btn btn--quiet btn--small" data-action="retry-api" type="button">Probar servicio</button>' : ''}</div>`;
  }
  return `<div class="notice notice--error" role="alert"><span>${escaparHtml(estado.errorGlobal)}</span><button class="btn btn--quiet btn--small" data-action="use-demo" type="button">Usar demo</button></div>`;
}

function navActiva() {
  document.querySelectorAll('[data-view]').forEach((boton) => {
    boton.classList.toggle('is-active', boton.dataset.view === estado.pantalla);
  });
}

function carteleraHtml() {
  const visibles = estado.funciones.filter((funcion) => fechaDeFuncion(funcion.inicio) === estado.fecha);
  const grupos = ['2D', '3D'].map((formato) => {
    const funciones = visibles.filter((funcion) => formatoDe(funcion) === formato)
      .sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));
    if (!funciones.length) return '';
    const precio = precioDe(funciones[0]);
    return `<section class="screening-group" aria-label="Funciones ${formato}">
      <div class="format-label">${formato}<small>${formato === '2D' ? 'Imagen clásica' : 'Experiencia inmersiva'}</small></div>
      <div class="screening-grid">${funciones.map((funcion) => `<article class="panel screening-card">
        <div class="screening-card__top"><span>${escaparHtml(salaDe(funcion))}</span><span>${formato}</span></div>
        <p class="screening-card__time">${escaparHtml(horaCDMX(funcion.inicio))}</p>
        <div class="screening-card__meta"><span>${escaparHtml(funcion.idioma || 'Por confirmar')}</span><span>Clasificación ${escaparHtml(funcion.clasificacion || 'Por confirmar')}</span></div>
        <div class="screening-card__bottom"><span class="price">${dinero(precio)}</span><button class="btn btn--small" type="button" data-function="${escaparHtml(funcion.id)}">Elegir asientos</button></div>
      </article>`).join('')}</div>
    </section>`;
  }).join('');

  return `<section class="hero">
    <div class="hero__copy"><p class="eyebrow">Una historia para compartir</p><h1>Tu próxima película empieza con un buen asiento.</h1><p>Elige tu función, encuentra tus butacas y ten tus boletos listos en unos minutos.</p></div>
    <div class="hero__aside"><div class="hero__poster" aria-hidden="true"><b>SPIDER<br>MAN</b></div><span>En cartelera · 10 salas · 2D y 3D</span></div>
  </section>
  ${avisoHtml()}
  ${estado.notice ? `<div class="notice ${estado.noticeError ? 'notice--error' : ''}" role="${estado.noticeError ? 'alert' : 'status'}">${escaparHtml(estado.notice)}</div>` : ''}
  <section class="section-head"><div><p class="eyebrow">Cartelera del cineclub</p><h2>Spider-Man</h2><p>30 funciones al día · 80 butacas por sala</p></div><label class="date-control">Elige una fecha<input type="date" data-date value="${escaparHtml(estado.fecha)}" min="2026-11-19" max="2026-12-18"></label></section>
  ${grupos ? `<div class="screening-groups">${grupos}</div>` : `<div class="panel empty"><strong>No hay funciones para esta fecha</strong>Prueba otra fecha disponible entre el 19 de noviembre y el 18 de diciembre.</div>`}`;
}

function funcionResumen(funcion) {
  return `<div class="summary-line"><span>Película</span><strong>Spider-Man</strong></div>
    <div class="summary-line"><span>Función</span><strong>${escaparHtml(fechaLegible(funcion.inicio))}<br>${escaparHtml(horaCDMX(funcion.inicio))}</strong></div>
    <div class="summary-line"><span>Sala y formato</span><strong>${escaparHtml(salaDe(funcion))} · ${escaparHtml(formatoDe(funcion))}</strong></div>`;
}

function mapaHtml() {
  const asientosSeleccionados = estado.asientos.filter((asiento) => estado.seleccion.has(asiento.id));
  const precio = precioDe(estado.funcion);
  const mapa = 'ABCDEFGH'.split('').map((fila) => {
    const filaAsientos = estado.asientos.filter((asiento) => String(asiento.fila || asiento.etiqueta?.[0]) === fila)
      .sort((a, b) => Number(a.numero || String(a.etiqueta).slice(1)) - Number(b.numero || String(b.etiqueta).slice(1)));
    return `<div class="seat-row"><span class="row-label">${fila}</span>${filaAsientos.map((asiento) => {
      const estadoVisual = normalizarEstado(asiento.estado);
      const seleccionado = estado.seleccion.has(asiento.id);
      const conflicto = estado.conflictos.has(asiento.id) || estado.conflictos.has(asiento.etiqueta);
      const clase = seleccionado ? 'seat--selected' : estadoVisual === 'apartada' ? 'seat--apartada' : estadoVisual === 'vendida' ? 'seat--vendida' : '';
      const deshabilitado = estadoVisual !== 'disponible' && !seleccionado;
      return `<button type="button" class="seat ${clase} ${conflicto ? 'seat--conflict' : ''}" data-seat="${escaparHtml(asiento.id)}" aria-label="Butaca ${escaparHtml(asiento.etiqueta)}: ${seleccionado ? 'seleccionada' : estadoVisual}" aria-pressed="${seleccionado}" ${deshabilitado ? 'disabled' : ''}>${escaparHtml(asiento.etiqueta)}</button>`;
    }).join('')}</div>`;
  }).join('');
  return `<button class="back-link" type="button" data-action="back">← Volver a la cartelera</button>
    <div class="page-intro"><p class="eyebrow">Elige tus lugares</p><h1>Encuentra tu asiento.</h1><p>${escaparHtml(fechaLegible(estado.funcion.inicio))} · ${escaparHtml(horaCDMX(estado.funcion.inicio))} · ${escaparHtml(salaDe(estado.funcion))}</p></div>
    ${avisoHtml()}${estado.notice ? `<div class="notice ${estado.noticeError ? 'notice--error' : ''}" role="${estado.noticeError ? 'alert' : 'status'}">${escaparHtml(estado.notice)}</div>` : ''}
    <div class="booking-layout"><section class="panel seat-panel" aria-label="Mapa de butacas"><div class="screen-curve">Pantalla</div><div class="seat-grid">${mapa}</div>
      <div class="seat-legend" aria-label="Estados de las butacas"><span class="legend-item"><i class="legend-dot"></i>Disponible</span><span class="legend-item"><i class="legend-dot legend-dot--selected"></i>Seleccionada</span><span class="legend-item"><i class="legend-dot legend-dot--held"></i>Apartada</span><span class="legend-item"><i class="legend-dot legend-dot--sold"></i>Vendida</span></div></section>
      <aside class="panel summary-panel"><p class="eyebrow">Tu selección</p><h2>Resumen</h2>${funcionResumen(estado.funcion)}
        <div class="summary-line"><span>Butacas (${asientosSeleccionados.length})</span><strong>${asientosSeleccionados.length ? escaparHtml(asientosSeleccionados.map((a) => a.etiqueta).join(', ')) : 'Elige tus butacas'}</strong></div>
        <div class="summary-line"><span>Precio por butaca</span><strong>${dinero(precio)}</strong></div>
        <div class="summary-total"><span>Total</span><strong>${dinero(totalSeleccion(estado.asientos, estado.seleccion, precio))}</strong></div>
        <button class="btn" type="button" data-action="reserve" ${asientosSeleccionados.length ? '' : 'disabled'}>Apartar y continuar</button><p class="summary-help">Tu selección se confirma al crear la reserva.</p></aside></div>`;
}

function checkoutHtml() {
  const reserva = estado.reserva;
  const seleccion = reserva.asientos || [];
  return `<button class="back-link" type="button" data-action="back-seats">← Volver a los asientos</button>
    ${avisoHtml()}<div class="page-intro"><p class="eyebrow">Último paso</p><h1>Completa tu compra.</h1><p>Tus butacas están apartadas mientras el contador siga activo.</p><div class="countdown ${estado.segundos < 60 ? 'is-urgent' : ''}" id="countdown" role="timer" aria-live="off">◷ <span>${Math.floor(estado.segundos / 60)}:${String(estado.segundos % 60).padStart(2, '0')}</span> restantes</div></div>
    ${estado.notice ? `<div class="notice ${estado.noticeError ? 'notice--error' : ''}" role="${estado.noticeError ? 'alert' : 'status'}">${escaparHtml(estado.notice)}</div>` : ''}
    <div class="checkout-grid"><section class="panel checkout-panel"><p class="eyebrow">Pago simulado</p><h2>Datos de prueba</h2><p class="simulated-note">Esta demostración no realiza cargos. Usa una de las tarjetas de prueba.</p>
      <form id="payment-form" novalidate><div class="form-grid">
        <label class="field field--wide">Número de tarjeta<input name="numeroTarjeta" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="19" required><span class="field-error" data-error="numeroTarjeta"></span></label>
        <label class="field field--wide">Titular<input name="titular" autocomplete="cc-name" placeholder="Nombre del titular" maxlength="60" required><span class="field-error" data-error="titular"></span></label>
        <label class="field">Vencimiento<input name="vencimiento" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5" required><span class="field-error" data-error="vencimiento"></span></label>
        <label class="field">CVV<input name="cvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="3" required><span class="field-error" data-error="cvv"></span></label>
      </div><div class="form-actions"><button class="btn" type="submit" ${estado.segundos ? '' : 'disabled'}>Pagar ${dinero(reserva.total)}</button><button class="btn btn--danger" type="button" data-action="release">Liberar butacas</button></div></form>
      <div class="test-cards"><span><strong>Aprobada:</strong> <code>4242 4242 4242 4242</code></span><span><strong>Rechazada:</strong> <code>4000 0000 0000 0002</code></span></div></section>
      <aside class="panel summary-panel"><p class="eyebrow">Apartado activo</p><h2>Tu función</h2>${funcionResumen(estado.funcion)}<div class="summary-line"><span>Butacas</span><strong>${escaparHtml(seleccion.map((a) => a.etiqueta).join(', '))}</strong></div><div class="summary-total"><span>Total</span><strong>${dinero(reserva.total)}</strong></div><p class="summary-help">El código y CVV de la tarjeta no se guardan.</p></aside></div>`;
}

function dibujarQR(contenedor, codigo) {
  try {
    if (typeof window.qrcode !== 'function') throw new Error('QR no disponible');
    const qr = window.qrcode(0, 'M');
    qr.addData(codigo);
    qr.make();
    contenedor.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: { text: `Código QR del boleto ${codigo}` } });
  } catch {
    contenedor.innerHTML = '<span class="qr-fallback" aria-label="El código QR no está disponible">QR</span>';
  }
}

function ordenHtml() {
  const orden = estado.orden;
  const boletos = array(orden.boletos);
  return `<section class="panel confirmation"><div class="confirmation__top"><div><p class="eyebrow">Compra confirmada</p><h1>¡Nos vemos en el cine!</h1><p class="simulated-note">El pago fue simulado y tus boletos están listos. Guarda tu folio para volver a consultarlos.</p><span class="order-folio">${escaparHtml(orden.folio)}</span></div><span class="success-mark" aria-label="Compra confirmada">✓</span></div>
    <div class="summary-line"><span>Total pagado</span><strong>${dinero(orden.total, orden.moneda)}</strong></div><div class="ticket-list">${boletos.map((boleto, indice) => `<article class="ticket"><div class="ticket__info"><p class="eyebrow">Boleto ${String(indice + 1).padStart(2, '0')}</p><h3>${escaparHtml(boleto.eventoNombre || 'Spider-Man')}</h3><p>${escaparHtml(salaBoleto(boleto))} · ${escaparHtml(boleto.formato || formatoDe(estado.funcion || {}))}</p><p>${escaparHtml(fechaLegible(boleto.inicio || orden.funcionInicio || orden.fecha))} · ${escaparHtml(horaCDMX(boleto.inicio || orden.funcionInicio || orden.fecha))}</p><p>Butaca <strong>${escaparHtml(boleto.etiqueta)}</strong> · ${dinero(boleto.precio, orden.moneda)}</p></div><div class="ticket__qr"><div class="qr-image" data-qr="${escaparHtml(boleto.codigo)}"></div><code>${escaparHtml(boleto.codigo)}</code><small>Presenta el QR o el código</small></div></article>`).join('')}</div>
    <div class="confirmation-actions"><button class="btn" type="button" data-action="print">Imprimir boletos</button><button class="btn btn--quiet" type="button" data-action="copy">Copiar folio y códigos</button><button class="btn btn--quiet" type="button" data-view="cartelera">Volver a la cartelera</button></div></section>`;
}

function recuperarHtml() {
  return `<section class="page-intro"><p class="eyebrow">Sin cuenta, con tu folio</p><h1>Encuentra tus boletos.</h1><p>Escribe el folio que recibiste al terminar tu compra.</p></section>${avisoHtml()}<form id="recovery-form" class="panel simple-form" novalidate><label class="field">Folio de orden<input name="folio" autocomplete="off" placeholder="ORD-000123" maxlength="10" required><span class="field-error" data-error="folio"></span></label><button class="btn" type="submit">Buscar boletos</button><p class="inline-error" id="recovery-error" role="alert"></p></form>${estado.orden ? `<div style="height:20px"></div>${ordenHtml()}` : ''}`;
}

function reporteHtml() {
  const hoy = fechaCDMX();
  const desde = estado.reportDesde || hoy;
  const hasta = estado.reportHasta || hoy;
  const filas = array(estado.reporte).map((item) => {
    const dia = item.dia || item.fecha || item.fechaLocal || item.desde;
    const total = item.total ?? item.cantidad ?? item.reservas ?? item.conteo ?? 0;
    return `<article class="panel report-day"><span>${escaparHtml(fechaLegible(`${dia}T12:00:00-06:00`, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</span><strong>${escaparHtml(total)}</strong><span>reservas creadas</span></article>`;
  }).join('');
  return `<section class="page-intro"><p class="eyebrow">Consolidación del cineclub</p><h1>La demanda, día a día.</h1><p>Reservas creadas por fecha local. El conteo incluye apartados pagados, vencidos y liberados.</p></section>${avisoHtml()}<form id="report-form" class="panel report-form"><label class="field">Desde<input type="date" name="desde" value="${escaparHtml(desde)}" required></label><label class="field">Hasta<input type="date" name="hasta" value="${escaparHtml(hasta)}" required></label><button class="btn" type="submit">Consultar reporte</button></form>${estado.notice ? `<p class="inline-error" role="alert">${escaparHtml(estado.notice)}</p>` : ''}${filas ? `<div class="report-grid">${filas}</div>` : `<div class="panel empty" style="margin-top:18px"><strong>Elige un rango para consultar</strong>El reporte muestra un total por día, sin desglose por sala.</div>`}`;
}

function render() {
  navActiva();
  if (estado.errorGlobal && !estado.demoActivo) {
    app.innerHTML = `${avisoHtml()}<div class="panel empty"><strong>No se pudo cargar el cineclub</strong>Revisa que el servicio esté disponible o abre los datos de demostración.</div>`;
    return;
  }
  if (estado.pantalla === 'mapa' && estado.funcion) app.innerHTML = mapaHtml();
  else if (estado.pantalla === 'checkout' && estado.reserva) app.innerHTML = checkoutHtml();
  else if (estado.pantalla === 'confirmacion' && estado.orden) app.innerHTML = ordenHtml();
  else if (estado.pantalla === 'recuperar') app.innerHTML = recuperarHtml();
  else if (estado.pantalla === 'reporte') app.innerHTML = reporteHtml();
  else app.innerHTML = carteleraHtml();
  app.querySelectorAll('[data-qr]').forEach((nodo) => dibujarQR(nodo, nodo.dataset.qr));
  if (estado.pantalla === 'checkout') pintarCountdown();
}

async function cargarInicio(proveedor) {
  estado.proveedor = proveedor;
  const eventos = array(await proveedor.listarEventos());
  estado.evento = eventos[0];
  if (!estado.evento) throw new ErrorApp('NO_ENCONTRADO', 'No hay una película disponible.');
  estado.funciones = array(await proveedor.listarFunciones(estado.evento.id));
  return estado.funciones.length;
}

function activarDemo(mensaje = '') {
  estado.demoActivo = true;
  estado.errorGlobal = '';
  estado.notice = mensaje;
  estado.noticeError = false;
  return cargarInicio(demo);
}

async function iniciar() {
  render();
  if (estado.modo === 'demo') {
    await activarDemo();
  } else {
    try {
      await cargarInicio(api);
      estado.demoActivo = false;
    } catch (error) {
      if (estado.modo === 'auto') await activarDemo('El servicio no respondió. Estás viendo datos de demostración.');
      else estado.errorGlobal = mensajeVisible(error);
    }
  }
  await restaurarCheckout();
  render();
  iniciarTemporizador();
}

async function probarApi() {
  estado.errorGlobal = '';
  estado.notice = '';
  try {
    await cargarInicio(api);
    estado.demoActivo = false;
    setNotice('Conexión con el servicio lista.');
  } catch (error) {
    if (estado.modo === 'auto') {
      await activarDemo('El servicio sigue sin responder. Continúas en modo demo.');
    } else {
      estado.errorGlobal = mensajeVisible(error);
    }
  }
  render();
}

async function restaurarCheckout() {
  let guardado;
  try { guardado = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { guardado = null; }
  if (!guardado?.reservaId || !guardado?.funcionId) return;
  try {
    const funcion = await estado.proveedor.obtenerFuncion(guardado.funcionId);
    const reserva = await estado.proveedor.obtenerReserva(guardado.reservaId);
    estado.funcion = funcion;
    const restante = Number(reserva.segundosRestantes) || Math.max(0, Math.floor((Date.parse(reserva.expiraEn) - Date.now()) / 1000));
    if (reserva.estado !== 'activa' || restante <= 0) {
      sessionStorage.removeItem(SESSION_KEY);
      estado.reserva = null;
      estado.asientos = array(await estado.proveedor.listarAsientos(funcion.id));
      estado.pantalla = 'mapa';
      setNotice('El apartado venció. Las butacas se liberaron; elige de nuevo para continuar.', true);
      return;
    }
    estado.reserva = reserva;
    estado.segundos = restante;
    estado.pantalla = 'checkout';
  } catch (error) {
    sessionStorage.removeItem(SESSION_KEY);
    if (error.codigo === 'RESERVA_VENCIDA' || error.codigo === 'RESERVA_LIBERADA') {
      estado.pantalla = 'cartelera';
      setNotice(mensajeVisible(error), true);
    }
  }
}

async function abrirFuncion(id) {
  setNotice(''); estado.conflictos.clear(); estado.seleccion.clear(); estado.orden = null;
  try {
    const [funcion, asientos] = await Promise.all([estado.proveedor.obtenerFuncion(id), estado.proveedor.listarAsientos(id)]);
    estado.funcion = funcion;
    estado.asientos = array(asientos);
    estado.pantalla = 'mapa';
  } catch (error) {
    if (!estado.demoActivo && estado.modo === 'auto') {
      await activarDemo('El servicio no respondió. Continúas en modo demo.');
      return abrirFuncion(id);
    }
    setNotice(mensajeVisible(error), true);
  }
  render();
}

async function reservar() {
  if (!estado.funcion || !estado.seleccion.size) return;
  try {
    const reserva = await estado.proveedor.crearReserva({ funcionId: estado.funcion.id, asientoIds: [...estado.seleccion] });
    estado.reserva = reserva;
    estado.segundos = Number(reserva.segundosRestantes) || Number(config.duracionReservaSegundos) || 300;
    estado.pantalla = 'checkout';
    estado.notice = '';
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ reservaId: reserva.id, funcionId: estado.funcion.id }));
  } catch (error) {
    if (error.codigo === 'ASIENTO_NO_DISPONIBLE') {
      estado.conflictos = new Set(error.detalles?.asientoIds || []);
      estado.seleccion.clear();
      estado.asientos = array(await estado.proveedor.listarAsientos(estado.funcion.id));
      setNotice(mensajeVisible(error), true);
      estado.pantalla = 'mapa';
    } else if (estado.modo === 'auto' && !estado.demoActivo) {
      await activarDemo('El servicio no respondió; esta nueva selección usa datos de demostración.');
      return abrirFuncion(estado.funcion.id);
    } else setNotice(mensajeVisible(error), true);
  }
  render();
}

async function pagar(formulario) {
  const datosPago = Object.fromEntries(new FormData(formulario).entries());
  const validacion = validarTarjeta(datosPago);
  formulario.querySelectorAll('[data-error]').forEach((nodo) => { nodo.textContent = validacion.errores[nodo.dataset.error] || ''; });
  if (!validacion.valido) return;
  const boton = formulario.querySelector('[type=submit]');
  boton.disabled = true;
  boton.textContent = 'Procesando…';
  try {
    const resultado = await estado.proveedor.pagarReserva(estado.reserva.id, datosPago);
    if (resultado.resultado === 'rechazado') {
      setNotice('El pago fue rechazado. Puedes probar de nuevo mientras el apartado siga vigente.', true);
    } else {
      estado.reserva = resultado.reserva;
      estado.orden = resultado.orden;
      estado.pantalla = 'confirmacion';
      estado.notice = '';
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch (error) {
    if (['RESERVA_VENCIDA', 'RESERVA_LIBERADA'].includes(error.codigo)) {
      sessionStorage.removeItem(SESSION_KEY); estado.reserva = null; estado.pantalla = 'mapa';
      setNotice(mensajeVisible(error), true);
    } else setNotice(mensajeVisible(error), true);
  }
  render();
}

async function liberar() {
  try { await estado.proveedor.liberarReserva(estado.reserva.id); } catch { /* el vencimiento ya libera la selección */ }
  sessionStorage.removeItem(SESSION_KEY);
  estado.reserva = null; estado.seleccion.clear(); estado.pantalla = 'mapa';
  setNotice('El apartado terminó y las butacas se liberaron.');
  try { estado.asientos = array(await estado.proveedor.listarAsientos(estado.funcion.id)); } catch { /* el mapa actual permanece visible */ }
  render();
}

async function recuperar(formulario) {
  const folioInput = formulario.elements.folio;
  const folio = folioInput.value.trim().toUpperCase();
  const errorNode = formulario.querySelector('#recovery-error');
  formulario.querySelector('[data-error="folio"]').textContent = '';
  errorNode.textContent = '';
  if (!FOLIO_RE.test(folio)) {
    formulario.querySelector('[data-error="folio"]').textContent = 'Usa el formato ORD-000123.';
    return;
  }
  try {
    estado.orden = await estado.proveedor.buscarOrden(folio);
    estado.pantalla = 'recuperar';
  } catch (error) {
    estado.orden = null;
    errorNode.textContent = mensajeVisible(error);
  }
  render();
}

async function consultarReporte(formulario) {
  const desde = formulario.elements.desde.value;
  const hasta = formulario.elements.hasta.value;
  estado.reportDesde = desde; estado.reportHasta = hasta; estado.notice = '';
  const dias = (Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86400000;
  if (!desde || !hasta || dias < 0 || dias > 91) {
    setNotice('El rango debe ser válido y no puede superar 92 días.', true);
    render(); return;
  }
  try {
    estado.reporte = array(await estado.proveedor.reporteReservas({ desde, hasta }));
    if (!estado.reporte.length) setNotice('No hay datos para ese rango.');
  } catch (error) { estado.reporte = []; setNotice(mensajeVisible(error), true); }
  render();
}

function iniciarTemporizador() {
  clearInterval(timer);
  timer = setInterval(() => {
    if (estado.pantalla !== 'checkout' || !estado.reserva) return;
    estado.segundos = Math.max(0, estado.segundos - 1);
    pintarCountdown();
    if (!estado.segundos) {
      sessionStorage.removeItem(SESSION_KEY);
      estado.reserva = null; estado.pantalla = 'mapa';
      setNotice('El apartado venció. Elige de nuevo para continuar.', true);
      render();
    }
  }, 1000);
}

function pintarCountdown() {
  const nodo = document.querySelector('#countdown');
  if (!nodo) return;
  const segundos = estado.segundos;
  nodo.classList.toggle('is-urgent', segundos < 60);
  nodo.innerHTML = `◷ <span>${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}</span> restantes`;
  const botonPagar = document.querySelector('#payment-form [type=submit]');
  if (botonPagar) botonPagar.disabled = segundos <= 0;
}

document.addEventListener('click', async (eventoClick) => {
  const nav = eventoClick.target.closest('[data-view]');
  if (nav) {
    eventoClick.preventDefault();
    if (estado.pantalla === 'checkout' && estado.reserva) {
      try { await estado.proveedor.liberarReserva(estado.reserva.id); } catch { /* al vencer, el servicio ya libera las butacas */ }
      sessionStorage.removeItem(SESSION_KEY);
      estado.reserva = null;
      estado.seleccion.clear();
    }
    estado.pantalla = nav.dataset.view;
    estado.notice = ''; estado.noticeError = false;
    if (estado.pantalla !== 'recuperar') estado.orden = null;
    render();
    return;
  }
  const funcionBoton = eventoClick.target.closest('[data-function]');
  if (funcionBoton) return abrirFuncion(funcionBoton.dataset.function);
  const asientoBoton = eventoClick.target.closest('[data-seat]');
  if (asientoBoton) {
    const asiento = estado.asientos.find((item) => String(item.id) === asientoBoton.dataset.seat);
    if (!asiento) return;
    const seleccion = agregarSeleccion(estado.seleccion, asiento, estado.asientos);
    estado.seleccion = seleccion.seleccion;
    setNotice(seleccion.error || '', Boolean(seleccion.error));
    render(); return;
  }
  const accion = eventoClick.target.closest('[data-action]')?.dataset.action;
  if (accion === 'reserve') return reservar();
  if (accion === 'back') { estado.pantalla = 'cartelera'; estado.seleccion.clear(); estado.notice = ''; render(); }
  if (accion === 'back-seats') return liberar();
  if (accion === 'release') return liberar();
  if (accion === 'use-demo') { estado.errorGlobal = ''; await activarDemo(); render(); }
  if (accion === 'retry-api') return probarApi();
  if (accion === 'print') window.print();
  if (accion === 'copy') {
    const texto = [estado.orden.folio, ...estado.orden.boletos.map((boleto) => `${boleto.etiqueta}: ${boleto.codigo}`)].join('\n');
    try { await navigator.clipboard.writeText(texto); mostrarToast('Folio y códigos copiados.'); }
    catch { mostrarToast('No se pudieron copiar. Guarda el folio: ' + estado.orden.folio); }
  }
});

document.addEventListener('change', async (eventoChange) => {
  if (eventoChange.target.matches('[data-date]')) {
    estado.fecha = eventoChange.target.value;
    estado.notice = '';
    render();
  }
});

document.addEventListener('submit', async (eventoSubmit) => {
  eventoSubmit.preventDefault();
  if (eventoSubmit.target.id === 'payment-form') await pagar(eventoSubmit.target);
  if (eventoSubmit.target.id === 'recovery-form') await recuperar(eventoSubmit.target);
  if (eventoSubmit.target.id === 'report-form') await consultarReporte(eventoSubmit.target);
});

iniciar();
