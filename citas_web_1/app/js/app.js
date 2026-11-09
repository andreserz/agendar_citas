/* Arranque del SPA: rutas, sesión, catálogo y coordinación de vistas. */

import { abrirAutenticacion } from './auth.js';
import { config, datos } from './data-service.js';
import { leerSesion } from './session.js';
import { toast } from './ui.js';
import { escaparHtml } from './utils.js';
import { renderizarCabecera, renderizarPie } from './layout.js';
import { renderHome } from './views/home.js';
import { renderCartelera } from './views/cartelera.js';
import { renderCheckout } from './views/checkout.js';
import { renderOrden } from './views/orden.js';
import { renderCuenta } from './views/cuenta.js';

const main = document.getElementById('contenido');

const app = {
  datos,
  config,
  usuario: null,
  rutaActual: '/',
  catalogo: null,
  catalogoCargadoEn: 0,
  estadoCartelera: null,
  selecciones: new Map(),
  limpiarVista: null,
  renderToken: 0,
  iniciado: false,

  async iniciar() {
    this.usuario = leerSesion()?.comprador || null;
    try {
      await datos.iniciar();
    } catch (error) {
      // La demo local no debería fallar, pero si pasa mostramos un estado útil.
      console.error('No se pudo iniciar el servicio de datos', error);
    }
    renderizarCabecera(this);
    renderizarPie(this);
    this.iniciado = true;
    await this.renderRuta();
    if (datos.estado.modo === 'demo') {
      const clave = 'citas_web_1.avisoDemo.v1';
      try {
        if (!sessionStorage.getItem(clave)) {
          sessionStorage.setItem(clave, '1');
          setTimeout(() => {
            toast(datos.estado.motivo + ' Puedes probar la API desde el indicador de conexión.', 'info', 6500);
          }, 900);
        }
      } catch {
        /* sessionStorage bloqueado */
      }
    }
  },

  async cargarCatalogo(forzar = false) {
    const vigente = this.catalogo && Date.now() - this.catalogoCargadoEn < 60_000;
    if (vigente && !forzar) return this.catalogo;
    try {
      const { eventos } = await datos.listarEventos();
      const evento = (eventos || [])[0];
      if (!evento) throw new Error('No hay eventos disponibles.');
      const { funciones } = await datos.listarFunciones(evento.id);
      this.catalogo = { evento, funciones: funciones || [] };
      this.catalogoCargadoEn = Date.now();
      return this.catalogo;
    } catch (error) {
      if (this.catalogo) {
        toast('No pudimos actualizar la cartelera; mostramos los últimos datos conocidos.', 'aviso');
        return this.catalogo;
      }
      throw error;
    }
  },

  obtenerSeleccion(funcionId) {
    if (!this.selecciones.has(funcionId)) this.selecciones.set(funcionId, new Set());
    return this.selecciones.get(funcionId);
  },

  limpiarSeleccion(funcionId) {
    this.selecciones.delete(funcionId);
  },

  pedirLogin(opciones = {}) {
    let modo = 'login';
    let alEntrar = null;
    let motivo = '';
    if (typeof opciones === 'string') {
      modo = opciones;
    } else if (opciones && typeof opciones === 'object') {
      modo = opciones.modo || 'login';
      alEntrar = opciones.alEntrar;
      motivo = opciones.motivo || '';
    }
    if (this.usuario) {
      if (typeof alEntrar === 'function') alEntrar(leerSesion());
      else this.refrescarTodo();
      return;
    }
    abrirAutenticacion({
      modo,
      motivo,
      alEntrar: (sesion) => {
        this.usuario = sesion.comprador;
        renderizarCabecera(this);
        renderizarPie(this);
        if (typeof alEntrar === 'function') alEntrar(sesion);
        else this.refrescarTodo();
      },
    });
  },

  cerrarSesion() {
    datos.cerrarSesion();
    this.usuario = null;
    this.selecciones.clear();
    toast('Cerraste sesión. Tus compras siguen guardadas.', 'info');
    const protegida = /^\/(cuenta|checkout|orden)/.test(this.rutaActual);
    if (protegida) {
      this.ir('/');
    } else {
      renderizarCabecera(this);
      renderizarPie(this);
      this.renderRuta();
    }
  },

  cerrarSesionLocal() {
    datos.cerrarSesion();
    this.usuario = null;
    renderizarCabecera(this);
    renderizarPie(this);
  },

  async reiniciarDemo() {
    await datos.reiniciarDemo();
    this.usuario = null;
    this.selecciones.clear();
    this.catalogo = null;
    this.catalogoCargadoEn = 0;
    this.estadoCartelera = null;
  },

  alCambiarModo() {
    this.usuario = leerSesion()?.comprador || null;
    this.catalogo = null;
    this.catalogoCargadoEn = 0;
    this.selecciones.clear();
    renderizarCabecera(this);
    renderizarPie(this);
    if (this.rutaActual.startsWith('/checkout') || this.rutaActual.startsWith('/orden') || this.rutaActual.startsWith('/cuenta')) {
      this.ir('/');
    } else {
      this.renderRuta();
    }
  },

  ir(ruta) {
    const destino = ruta.startsWith('/') ? ruta : `/${ruta}`;
    const hash = `#${destino}`;
    if (location.hash === hash) {
      this.renderRuta();
    } else {
      location.hash = hash;
    }
  },

  async refrescarTodo() {
    this.usuario = leerSesion()?.comprador || null;
    renderizarCabecera(this);
    renderizarPie(this);
    await this.renderRuta();
  },

  async renderRuta() {
    if (!main) return;
    const token = ++this.renderToken;
    const { ruta, parametros } = parsearHash();
    this.rutaActual = ruta;
    renderizarCabecera(this);
    main.setAttribute('aria-busy', 'true');
    main.innerHTML = '<div class="ruta-cargando" role="status" aria-live="polite"><span class="spinner spinner--grande"></span><span>Abriendo el telón…</span></div>';
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

    let vista;
    try {
      vista = await resolverVista(this, ruta, parametros);
    } catch (error) {
      console.error(error);
      vista = {
        html: `<section class="section"><div class="contenedor">
          <div class="panel glass estado-panel">
            <span class="estado-panel__icon estado-panel__icon--alerta">${iconoAlerta()}</span>
            <h1>Algo salió mal en escena</h1>
            <p>${escaparHtml(error?.mensaje || 'Ocurrió un error inesperado.')}</p>
            <div class="estado-panel__acciones">
              <button class="btn btn--primary" type="button" data-reintentar>Reintentar</button>
              <a class="btn btn--ghost" href="#/">Volver al inicio</a>
            </div>
          </div>
        </div></section>`,
      };
    }

    if (token !== this.renderToken) return;

    try {
      this.limpiarVista?.();
    } catch {
      /* noop */
    }
    this.limpiarVista = null;

    main.innerHTML = vista.html || '';
    main.setAttribute('aria-busy', 'false');
    if (vista.alMontar) {
      try {
        const limpieza = vista.alMontar(main);
        this.limpiarVista = typeof limpieza === 'function' ? limpieza : null;
      } catch (error) {
        console.error('Error al montar la vista', error);
        toast('Algo falló al mostrar esta sección. Recarga o intenta de nuevo.', 'error');
      }
    }
    main.querySelector('[data-reintentar]')?.addEventListener('click', () => this.refrescarTodo());

    // Anuncio y foco para navegación accesible.
    const titulo = main.querySelector('h1');
    if (titulo) {
      titulo.setAttribute('tabindex', '-1');
      titulo.focus({ preventScroll: true });
    }
    document.title = titulo
      ? `${titulo.textContent.replace(/\s+/g, ' ').trim()} — Teatro Aquí nadie actúa normal`
      : 'Teatro Aquí nadie actúa normal';
  },
};

function iconoAlerta() {
  return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 3 20h18L12 4Z"/><path d="M12 10v4M12 17h.01"/></svg>';
}

function parsearHash() {
  const crudo = location.hash.replace(/^#/, '') || '/';
  const [rutaConBarra, consulta = ''] = crudo.split('?');
  const ruta = rutaConBarra.startsWith('/') ? rutaConBarra : `/${rutaConBarra}`;
  return { ruta: ruta.replace(/\/+$/, '') || '/', parametros: new URLSearchParams(consulta) };
}

async function resolverVista(app, ruta, parametros) {
  if (ruta === '/') return renderHome(app);
  if (ruta === '/cartelera') return renderCartelera(app, { funcionId: parametros.get('funcion') });
  const checkout = /^\/checkout\/([^/]+)$/.exec(ruta);
  if (checkout) return renderCheckout(app, { reservaId: decodeURIComponent(checkout[1]) });
  const orden = /^\/orden\/([^/]+)$/.exec(ruta);
  if (orden) return renderOrden(app, { ordenId: decodeURIComponent(orden[1]), nueva: parametros.get('nueva') === '1' });
  if (ruta === '/cuenta') return renderCuenta(app);
  return {
    html: `<section class="section"><div class="contenedor">
      <div class="panel glass estado-panel">
        <span class="estado-panel__icon">${iconoAlerta()}</span>
        <h1>Esa página no existe</h1>
        <p>Puede que el enlace esté mal escrito o que la función ya haya terminado.</p>
        <div class="estado-panel__acciones">
          <a class="btn btn--primary" href="#/cartelera">Ir a la cartelera</a>
          <a class="btn btn--ghost" href="#/">Volver al inicio</a>
        </div>
      </div>
    </div></section>`,
  };
}

/* Eventos globales */
window.addEventListener('hashchange', () => app.renderRuta());
window.addEventListener('cw1:modo', () => {
  if (!app.iniciado) return;
  app.usuario = leerSesion()?.comprador || null;
  renderizarCabecera(app);
  renderizarPie(app);
});
window.addEventListener('cw1:sesion', () => {
  const usuario = leerSesion()?.comprador || null;
  if (usuario) app.usuario = usuario;
  if (app.iniciado) renderizarCabecera(app);
});
window.addEventListener('cw1:anuncio', (evento) => {
  const texto = evento?.detail?.mensaje;
  if (texto) console.info('[accesibilidad]', texto);
});
window.addEventListener('unhandledrejection', (evento) => {
  if (evento.reason?.codigo === 'NO_AUTENTICADO') {
    evento.preventDefault();
    app.cerrarSesionLocal();
    app.pedirLogin({ motivo: 'Tu sesión terminó. Vuelve a entrar para continuar.' });
  }
});

window.app = app;
app.iniciar().catch((error) => {
  console.error(error);
  if (main) {
    main.innerHTML = `<section class="section"><div class="contenedor">
      <div class="panel glass estado-panel">
        <span class="estado-panel__icon estado-panel__icon--alerta">${iconoAlerta()}</span>
        <h1>No pudimos iniciar la aplicación</h1>
        <p>Revisa que el navegador permita JavaScript y almacenamiento local, y recarga la página.</p>
        <button class="btn btn--primary" type="button" onclick="location.reload()">Recargar</button>
      </div>
    </div></section>`;
  }
});
