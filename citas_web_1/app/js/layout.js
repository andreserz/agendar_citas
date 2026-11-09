/* Cabecera, pie y estado de conexión. */

import { config } from './data-service.js';
import { insigniaModo, marca, icono, toast, confirmar, abrirModal } from './ui.js';
import { escaparHtml } from './utils.js';

export function renderizarCabecera(app) {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;
  const usuario = app.usuario;
  const ruta = app.rutaActual;
  const activo = (nombre) => (ruta.startsWith(nombre) ? ' aria-current="page" class="topnav__link activo"' : ' class="topnav__link"');
  const esCuenta = ruta.startsWith('/cuenta');
  const esCartelera = ruta.startsWith('/cartelera');

  topbar.innerHTML = `
    <div class="topbar__inner">
      <a class="brand" href="#/" aria-label="Teatro Aquí nadie actúa normal, ir al inicio">
        ${marca()}
        <span class="brand__text">
          <strong>Aquí nadie actúa normal</strong>
          <small>Teatro · Temporada 2026</small>
        </span>
      </a>
      <nav class="topnav" aria-label="Navegación principal">
        <a href="#/"${ruta === '/' ? ' aria-current="page" class="topnav__link activo"' : ' class="topnav__link"'}>Inicio</a>
        <a href="#/cartelera"${esCartelera ? ' aria-current="page" class="topnav__link activo"' : ' class="topnav__link"'}>Cartelera</a>
        ${usuario ? `<a href="#/cuenta"${esCuenta ? ' aria-current="page" class="topnav__link activo"' : ' class="topnav__link"'}>Mis compras</a>` : ''}
      </nav>
      <div class="topbar__actions">
        <button class="mode-chip-btn" type="button" data-conexion aria-label="Estado de conexión: ${escaparHtml(app.datos.estado.motivo)}">
          ${insigniaModo(app.datos.estado)}
        </button>
        ${
          usuario
            ? `<a class="user-chip" href="#/cuenta" title="Ir a mi cuenta">
                 <span class="user-chip__avatar" aria-hidden="true">${escaparHtml((usuario.nombre || '?').charAt(0).toUpperCase())}</span>
                 <span class="user-chip__name">${escaparHtml((usuario.nombre || '').split(' ')[0] || 'Mi cuenta')}</span>
               </a>
               <button class="icon-btn" type="button" data-salir aria-label="Cerrar sesión" title="Cerrar sesión">${icono('salir')}</button>`
            : `<button class="btn btn--ghost btn--sm" type="button" data-entrar>${icono('usuario')} Entrar</button>`
        }
      </div>
    </div>`;

  topbar.querySelector('[data-entrar]')?.addEventListener('click', () => app.pedirLogin());
  topbar.querySelector('[data-salir]')?.addEventListener('click', async () => {
    const aceptar = await confirmar({
      titulo: 'Cerrar sesión',
      mensaje: '¿Quieres salir de tu cuenta? Tus reservas y compras siguen guardadas.',
      aceptar: 'Cerrar sesión',
      cancelar: 'Quedarme',
    });
    if (!aceptar) return;
    app.cerrarSesion();
  });
  topbar.querySelector('[data-conexion]')?.addEventListener('click', () => abrirConexion(app));
}

export function renderizarPie(app) {
  const pie = document.getElementById('site-footer');
  if (!pie) return;
  const estado = app.datos.estado;
  pie.innerHTML = `
    <div class="footer__grid">
      <div class="footer__brand">
        ${marca()}
        <h2>Teatro Aquí nadie actúa normal</h2>
        <p>Una noche de comedia, enredos y una suegra que no debía enterarse de nada.</p>
        <p class="footer__nota">Pago simulado con fines de demostración. No se realizan cargos reales.</p>
      </div>
      <div class="footer__col">
        <h3>La obra</h3>
        <a href="#/">Inicio</a>
        <a href="#/cartelera">Elegir función</a>
        <a href="#/cuenta">Mis compras</a>
      </div>
      <div class="footer__col">
        <h3>Funciones</h3>
        <p>Jueves, viernes y sábados</p>
        <p>15:00 · 19:00 · 21:00 h</p>
        <p>Octubre — diciembre 2026</p>
      </div>
      <div class="footer__col">
        <h3>Teatro</h3>
        <p>${icono('ubicacion')} Recinto para 120 personas</p>
        <p>${icono('asiento')} Zonas Preferente, General y Balcón</p>
        <p>${icono('reloj')} Reserva de 5 minutos</p>
      </div>
    </div>
    <div class="footer__bottom">
      <p>© 2026 Teatro Aquí nadie actúa normal · Proyecto académico</p>
      <div class="footer__bottom-actions">
        ${insigniaModo(estado)}
        <button class="footer__link" type="button" data-conexion>${icono('nube')} Conexión</button>
        <button class="footer__link" type="button" data-reset>${icono('recargar')} Reiniciar demo</button>
        <a class="footer__link" href="${escaparHtml(config.swaggerUrl)}" target="_blank" rel="noopener noreferrer">Swagger ${icono('flecha')}</a>
      </div>
    </div>`;

  pie.querySelectorAll('[data-conexion]').forEach((boton) => boton.addEventListener('click', () => abrirConexion(app)));
  pie.querySelector('[data-reset]')?.addEventListener('click', async () => {
    const aceptar = await confirmar({
      titulo: 'Reiniciar datos de demostración',
      mensaje: 'Se borrarán las cuentas, reservas y compras guardadas en este navegador. Después podrás empezar de nuevo.',
      aceptar: 'Reiniciar demo',
      cancelar: 'Cancelar',
      peligro: true,
    });
    if (!aceptar) return;
    try {
      await app.reiniciarDemo();
      toast('Datos de demostración reiniciados.', 'exito');
      app.ir('/');
      app.refrescarTodo();
    } catch (error) {
      toast(error?.mensaje || 'No se pudieron reiniciar los datos.', 'error');
    }
  });
}

export function abrirConexion(app) {
  const estado = app.datos.estado;
  const demo = estado.modo === 'demo';
  const contenido = `
    <div class="conexion">
      <div class="conexion__estado ${demo ? 'conexion__estado--demo' : 'conexion__estado--api'}">
        <span class="conexion__dot"></span>
        <div>
          <strong>${demo ? 'Datos de demostración' : 'Conectado a citas_service'}</strong>
          <p>${escaparHtml(estado.motivo)}</p>
        </div>
      </div>
      <dl class="conexion__datos">
        <div><dt>API configurada</dt><dd><code>${escaparHtml(config.apiBaseUrl)}</code></dd></div>
        <div><dt>Sitio</dt><dd><code>${escaparHtml(config.sitio)}</code></dd></div>
        <div><dt>Modo en configuración</dt><dd><code>${escaparHtml(config.modo)}</code></dd></div>
      </dl>
      <p class="conexion__texto">La app intenta usar la API real al iniciar. Si no responde en ${Math.round((config.tiempoEsperaMs || 2200) / 1000)} s, activa la demo local con el mismo contrato de datos. Puedes cambiar de modo en cualquier momento; al hacerlo se cierra la sesión para evitar mezclar estados.</p>
      <div class="conexion__acciones">
        <button class="btn ${demo ? 'btn--primary' : 'btn--ghost'}" type="button" data-modo="demo" ${demo ? 'disabled' : ''}>${icono('nube')} Usar demo local</button>
        <button class="btn ${!demo ? 'btn--primary' : 'btn--ghost'}" type="button" data-modo="api" ${!demo ? 'disabled' : ''}>${icono('rayo')} Probar API real</button>
      </div>
      <div class="conexion__pie">
        <a class="btn btn--ghost btn--sm" href="${escaparHtml(config.swaggerUrl)}" target="_blank" rel="noopener noreferrer">Abrir Swagger ${icono('flecha')}</a>
        <button class="btn btn--ghost btn--sm" type="button" data-copiar>Copiar URL de API</button>
      </div>
      <p class="conexion__nota">Para levantar la API: <code>cd citas_service && npm install && npm start</code> (puerto 3000). La web corre en el puerto 5501.</p>
    </div>`;

  abrirModal({
    titulo: 'Conexión y datos',
    etiqueta: 'Modo de la aplicación',
    ancho: '600px',
    contenido,
    alMontar(dialogo, cerrar) {
      dialogo.querySelectorAll('[data-modo]').forEach((boton) => {
        boton.addEventListener('click', () => {
          const modo = boton.dataset.modo;
          app.datos.cambiarModo(modo, modo === 'demo' ? 'Cambio manual a datos de demostración.' : 'Cambio manual a la API real.');
          toast(modo === 'demo' ? 'Ahora usas datos de demostración.' : 'Ahora intentas usar la API real.', 'aviso');
          cerrar();
          app.alCambiarModo();
        });
      });
      dialogo.querySelector('[data-copiar]')?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(config.apiBaseUrl);
          toast('URL de API copiada.', 'exito');
        } catch {
          toast('No se pudo copiar; selecciona la URL manualmente.', 'error');
        }
      });
    },
  });
}
