/* Smoke de navegador sin dependencias. Requiere la app en :5502 y Chromium con CDP en :9223. */
const cdp = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9223';
const targets = await fetch(`${cdp}/json`).then((respuesta) => respuesta.json());
const pagina = targets.find((target) => target.type === 'page' && target.url.startsWith('http://127.0.0.1:5502'));
if (!pagina) throw new Error('Abre la aplicación en Chromium con depuración remota en el puerto 9223.');

const socket = new WebSocket(pagina.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let secuencia = 0;
const pendientes = new Map();
socket.addEventListener('message', ({ data }) => {
  const mensaje = JSON.parse(data);
  if (pendientes.has(mensaje.id)) {
    pendientes.get(mensaje.id)(mensaje);
    pendientes.delete(mensaje.id);
  }
});

function comando(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++secuencia;
    pendientes.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluar(expression) {
  const respuesta = await comando('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (respuesta.result.exceptionDetails) throw new Error(respuesta.result.exceptionDetails.exception?.description || respuesta.result.exceptionDetails.text);
  return respuesta.result.result.value;
}

const pausa = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function crearSesionCDP(url) {
  const creado = await fetch(`${cdp}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' }).then((respuesta) => respuesta.json());
  const ws = new WebSocket(creado.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const esperando = new Map();
  ws.addEventListener('message', ({ data }) => {
    const mensaje = JSON.parse(data);
    if (esperando.has(mensaje.id)) { esperando.get(mensaje.id)(mensaje); esperando.delete(mensaje.id); }
  });
  const cmd = (method, params = {}) => new Promise((resolve) => {
    const commandId = ++id; esperando.set(commandId, resolve);
    ws.send(JSON.stringify({ id: commandId, method, params }));
  });
  const evalua = async (expression) => {
    const respuesta = await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (respuesta.result.exceptionDetails) throw new Error(respuesta.result.exceptionDetails.exception?.description || respuesta.result.exceptionDetails.text);
    return respuesta.result.result.value;
  };
  await cmd('Runtime.enable'); await cmd('Page.enable');
  return { ws, cmd, evalua };
}

try {
  await comando('Runtime.enable');
  await comando('Page.enable');
  await evaluar('localStorage.clear(); sessionStorage.clear(); location.reload()');
  await pausa(2400);
  if (!await evaluar("Boolean(document.querySelector('[data-date]'))")) throw new Error('No se renderizó la cartelera inicial.');
  await evaluar("document.querySelector('[data-date]').value='2026-11-23'; document.querySelector('[data-date]').dispatchEvent(new Event('change',{bubbles:true}))");
  await pausa(200);
  const funciones = await evaluar("document.querySelectorAll('.screening-card').length");
  await evaluar("document.querySelector('[data-function]').click()");
  await pausa(350);
  const butacas = await evaluar("document.querySelectorAll('.seat').length");
  await evaluar("[...document.querySelectorAll('.seat:not(:disabled)')].slice(0,2).forEach(el=>el.click())");
  await evaluar("document.querySelector('[data-action=reserve]').click()");
  await pausa(200);
  const checkout = await evaluar("Boolean(document.querySelector('#payment-form'))");
  await evaluar("(()=>{const f=document.querySelector('#payment-form'); f.elements.numeroTarjeta.value='4000 0000 0000 0002'; f.elements.titular.value='Ana Perez'; f.elements.vencimiento.value='12/29'; f.elements.cvv.value='123'; f.requestSubmit()})()");
  await pausa(150);
  const rechazo = await evaluar("document.body.innerText.includes('El pago fue rechazado')");
  await evaluar("(()=>{const f=document.querySelector('#payment-form'); f.elements.numeroTarjeta.value='4242 4242 4242 4242'; f.elements.titular.value='Ana Perez'; f.elements.vencimiento.value='12/29'; f.elements.cvv.value='123'; f.requestSubmit()})()");
  await pausa(700);
  const despuesDelPago = await evaluar("document.querySelector('#app')?.innerText");
  const folio = await evaluar("document.querySelector('.order-folio')?.textContent || ''");
  const qr = await evaluar("Boolean(document.querySelector('.qr-image svg'))");
  await evaluar("document.querySelector('[data-view=recuperar]').click()");
  await pausa(80);
  await evaluar(`(()=>{const f=document.querySelector('#recovery-form'); f.elements.folio.value=${JSON.stringify(folio)}; f.requestSubmit()})()`);
  await pausa(150);
  const recuperado = await evaluar("document.querySelector('.order-folio')?.textContent || ''");
  await evaluar("document.querySelector('[data-view=cartelera]').click()");
  await pausa(100);
  await evaluar("document.querySelector('[data-function]').click()");
  await pausa(250);
  await evaluar("document.querySelector('[data-seat=A7]').click()");

  const segunda = await crearSesionCDP('http://127.0.0.1:5502/');
  await pausa(2500);
  await segunda.evalua("document.querySelector('[data-date]').value='2026-11-23'; document.querySelector('[data-date]').dispatchEvent(new Event('change',{bubbles:true})); document.querySelector('[data-function]').click()");
  await pausa(300);
  await segunda.evalua("document.querySelector('[data-seat=A7]').click()");
  await evaluar("document.querySelector('[data-action=reserve]').click()");
  await pausa(180);
  await segunda.evalua("document.querySelector('[data-action=reserve]').click()");
  await pausa(200);
  const conflicto = await segunda.evalua("document.body.innerText.includes('Una o más butacas acaban de ocuparse') && Boolean(document.querySelector('.seat--conflict')) && document.body.innerText.includes('Elige tus butacas')");
  await segunda.evalua("document.querySelector('.seat:not(:disabled)').click(); document.querySelector('[data-action=reserve]').click()");
  await pausa(200);
  const expiracionPreparada = await segunda.evalua("Boolean(document.querySelector('#payment-form'))");
  await segunda.evalua("(()=>{const datos=JSON.parse(localStorage.getItem('citas-web2-demo-v1')); const activa=datos.reservas.find(r=>r.estado==='activa'); activa.expiraEn=new Date(Date.now()-1000).toISOString(); localStorage.setItem('citas-web2-demo-v1',JSON.stringify(datos)); sessionStorage.setItem('citas-web2-checkout',JSON.stringify({reservaId:activa.id,funcionId:activa.funcionId})); location.reload()})()");
  await pausa(2600);
  const vencimiento = await segunda.evalua("document.body.innerText.includes('El apartado venció')");
  await segunda.cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await pausa(150);
  const ancho = await segunda.evalua("({viewport:innerWidth,document:document.documentElement.scrollWidth,app:document.querySelector('#app').scrollWidth})");
  segunda.ws.close();
  const resultado = { funciones, butacas, checkout, rechazo, folio, qr, recuperado, conflicto, expiracionPreparada, vencimiento, ancho };
  console.log(JSON.stringify(resultado));
  if (funciones !== 30 || butacas !== 80 || !checkout || !rechazo || !folio || !qr || recuperado !== folio || !conflicto || !expiracionPreparada || !vencimiento || ancho.document > ancho.viewport) {
    throw new Error('Falló una comprobación del recorrido de compra o del viewport móvil.');
  }
} finally {
  socket.close();
}
