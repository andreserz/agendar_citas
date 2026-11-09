/* Sesión del comprador guardada localmente. El token sólo se usa contra la API real. */

import { almacen } from './utils.js';

const CLAVE = 'citas_web_1.sesion.v1';

export function leerSesion() {
  const sesion = almacen.leer(CLAVE, null);
  if (!sesion || !sesion.token || !sesion.comprador?.id) return null;
  if (sesion.expiraEn && new Date(sesion.expiraEn).getTime() <= Date.now()) {
    almacen.borrar(CLAVE);
    return null;
  }
  return sesion;
}

export function guardarSesion(sesion) {
  almacen.guardar(CLAVE, sesion);
  notificar();
  return sesion;
}

export function cerrarSesion() {
  almacen.borrar(CLAVE);
  notificar();
}

export function notificar() {
  try {
    window.dispatchEvent(new CustomEvent('cw1:sesion'));
  } catch {
    /* entorno sin window */
  }
}
