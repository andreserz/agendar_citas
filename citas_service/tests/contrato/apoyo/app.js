'use strict';

/**
 * Contexto de las pruebas de contrato (tarea 7.1): app real (`crearApp`) con repositorios en
 * memoria nuevos y un reloj fijo que se puede adelantar, más ayudas para hacer peticiones.
 *
 * Las pruebas de cada router se activan solas cuando su archivo existe en `app/rutas/`.
 * Mientras no exista, su `describe` queda omitido (aparece como «skipped» en Jest).
 * Con `CONTRATO_ESTRICTO=1` nunca se omiten: así se corre en la entrega (tarea 8.1).
 */
const fs = require('fs');
const path = require('path');
const request = require('supertest');

const { cargarConfig } = require('../../../app/config');
const { crearApp } = require('../../../app/app');
const { crearReposEnMemoria } = require('../../../app/repos/memoria');
const { generarDatosWeb1, generarDatosWeb2 } = require('../../../app/repos/memoria/datos-iniciales');
const { emitirToken } = require('../../../app/auth/tokens');

const RUTAS_APP = path.join(__dirname, '..', '..', '..', 'app', 'rutas');
const BASE = '/api/v1';

// Viernes 20 nov 2026, 12:00 en CDMX: hay funciones futuras de web_1 (jue–sáb) y de web_2.
const AHORA_INICIAL = '2026-11-20T12:00:00-06:00';

const TARJETA_APROBADA = '4242 4242 4242 4242';
const TARJETA_RECHAZADA = '4000 0000 0000 0002';

/** Router de `app/rutas/` que debe implementar cada ruta de la spec (design §1). */
function routerDeRuta(ruta) {
  if (ruta === '/salud') return 'salud';
  if (/^\/(eventos|funciones)(\/|$)/.test(ruta)) return 'catalogo';
  if (/^\/reservas\/\{[^}]+\}\/pago$/.test(ruta)) return 'pagos';
  if (/^\/reservas(\/|$)/.test(ruta)) return 'reservas';
  if (/^\/ordenes(\/|$)/.test(ruta)) return 'ordenes';
  if (/^\/reportes(\/|$)/.test(ruta)) return 'reportes';
  if (/^\/auth(\/|$)/.test(ruta)) return 'auth';
  return null;
}

const routerExiste = (nombre) => fs.existsSync(path.join(RUTAS_APP, `${nombre}.js`));
const modoEstricto = () => process.env.CONTRATO_ESTRICTO === '1';

/**
 * `describe` que se omite mientras falte alguno de los routers indicados.
 * Ejemplo: `describeSiRouter(['reservas', 'pagos'], 'pagarReserva', () => { ... })`.
 */
function describeSiRouter(nombres, titulo, fn) {
  const faltan = [].concat(nombres).filter((n) => !routerExiste(n));
  if (faltan.length === 0 || modoEstricto()) return describe(titulo, fn);
  return describe.skip(`${titulo} — pendiente: falta app/rutas/${faltan.join('.js, app/rutas/')}.js`, fn);
}

/** Primera función activa del evento que empieza después de `ahora`. */
function funcionFutura(datos, eventoId, ahora) {
  const funcion = datos.funciones
    .filter((f) => f.eventoId === eventoId && f.activa !== false && f.inicio > ahora)
    .sort((a, b) => a.inicio - b.inicio)[0];
  if (!funcion) throw new Error(`No hay funciones futuras de ${eventoId} en la semilla.`);
  return funcion;
}

/** Datos de la semilla que usan las pruebas, para no escribir ids a mano. */
function semilla(ahora) {
  const web1 = generarDatosWeb1();
  const web2 = generarDatosWeb2();
  const funcion1 = funcionFutura(web1, 'evt-suegra', ahora);
  const funcion2 = funcionFutura(web2, 'evt-spiderman', ahora);
  return {
    web_1: {
      eventoId: 'evt-suegra',
      funcionId: funcion1.id,
      asientoIds: web1.asientos.map((a) => a.id),
    },
    web_2: {
      eventoId: 'evt-spiderman',
      funcionId: funcion2.id,
      // En web_2 cada función usa sólo los asientos de su sala.
      asientoIds: web2.asientos.filter((a) => a.zonaId === funcion2.zonaId).map((a) => a.id),
    },
  };
}

/**
 * Crea un contexto aislado: app, repositorios nuevos y reloj propio.
 * `ctx.avanzar(segundos)` adelanta el reloj (por ejemplo, 300 para vencer una reserva).
 */
function crearContexto() {
  const config = cargarConfig({ NODE_ENV: 'test' });
  const repos = crearReposEnMemoria();
  let ahora = new Date(AHORA_INICIAL);
  const reloj = () => new Date(ahora);
  const app = crearApp(config, repos, reloj);

  const ctx = {
    app,
    config,
    repos,
    reloj,
    datos: semilla(ahora),
    avanzar(segundos) {
      ahora = new Date(ahora.getTime() + segundos * 1000);
    },
    /** Token válido de un comprador de web_1 (no depende del router de auth). */
    token(compradorId = 'comprador-contrato-1') {
      return emitirToken(compradorId, config.jwtSecret, reloj());
    },
    /**
     * Petición a `/api/v1` con `X-Sitio`, token y cuerpo opcionales.
     * `pedir('post', '/reservas', { sitio: 'web_2', cuerpo: { ... } })`
     */
    pedir(metodo, ruta, { sitio, token, cuerpo, consulta } = {}) {
      let peticion = request(app)[metodo](`${BASE}${ruta}`);
      if (sitio) peticion = peticion.set('X-Sitio', sitio);
      if (token) peticion = peticion.set('Authorization', `Bearer ${token}`);
      if (consulta) peticion = peticion.query(consulta);
      if (cuerpo !== undefined) peticion = peticion.send(cuerpo);
      return peticion;
    },
    /** Opciones de identidad de cada sitio: web_1 con token, web_2 sin token. */
    identidad(sitio, compradorId) {
      return sitio === 'web_1' ? { sitio, token: ctx.token(compradorId) } : { sitio };
    },
    /** Crea una reserva por la API con los primeros `n` asientos (o los indicados). */
    reservar(sitio, { n = 1, asientoIds, compradorId, funcionId } = {}) {
      return ctx.pedir('post', '/reservas', {
        ...ctx.identidad(sitio, compradorId),
        cuerpo: {
          funcionId: funcionId || ctx.datos[sitio].funcionId,
          asientoIds: asientoIds || ctx.datos[sitio].asientoIds.slice(0, n),
        },
      });
    },
    /**
     * Prepara una reserva para otra prueba y exige que se haya creado (201). Así una prueba de
     * «404 de otro sitio» no pasa por accidente cuando la reserva ni siquiera existe.
     */
    async reservaCreada(sitio, opciones) {
      const res = await ctx.reservar(sitio, opciones);
      expect({ preparacion: 'crear reserva', status: res.status }).toEqual({ preparacion: 'crear reserva', status: 201 });
      return res.body;
    },
    /**
     * Reserva y paga con la tarjeta aprobada; exige 201 y devuelve la orden. Sin `asientoIds`
     * usa los 2 primeros asientos; para dos compras en la misma función, pasa asientos distintos.
     */
    async ordenCreada(sitio, compradorId, asientoIds) {
      const reserva = await ctx.reservaCreada(sitio, { compradorId, n: 2, asientoIds });
      const res = await ctx.pagar(sitio, reserva.id, {}, compradorId);
      expect({ preparacion: 'pagar', status: res.status, resultado: res.body.resultado }).toEqual({
        preparacion: 'pagar',
        status: 201,
        resultado: 'aprobado',
      });
      return res.body.orden;
    },
    pagar(sitio, reservaId, cambios = {}, compradorId) {
      return ctx.pedir('post', `/reservas/${reservaId}/pago`, {
        ...ctx.identidad(sitio, compradorId),
        cuerpo: { numeroTarjeta: TARJETA_APROBADA, titular: 'Ana López', vencimiento: '12/28', cvv: '123', ...cambios },
      });
    },
  };
  return ctx;
}

module.exports = {
  BASE,
  AHORA_INICIAL,
  TARJETA_APROBADA,
  TARJETA_RECHAZADA,
  routerDeRuta,
  routerExiste,
  modoEstricto,
  describeSiRouter,
  crearContexto,
};
