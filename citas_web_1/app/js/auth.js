/* Registro e inicio de sesión en un diálogo accesible. */

import { CUENTA_DEMO, datos } from './data-service.js';
import { validarLogin, validarRegistro } from './domain.js';
import { mensajeDeError } from './errors.js';
import { abrirModal, icono, toast } from './ui.js';
import { escaparHtml, normalizarCorreo } from './utils.js';

export function abrirAutenticacion({ modo = 'login', alEntrar, motivo = '' } = {}) {
  let modoActual = modo === 'registro' ? 'registro' : 'login';
  let modal = null;

  const formularioLogin = () => `
    <form class="form" id="form-login" novalidate>
      ${motivo ? `<p class="form__motivo">${escaparHtml(motivo)}</p>` : ''}
      <div class="field">
        <label for="login-correo">Correo electrónico</label>
        <div class="field__control">
          <span class="field__icon">${icono('correo')}</span>
          <input id="login-correo" name="correo" type="email" inputmode="email" autocomplete="email" placeholder="tu@correo.mx" required />
        </div>
        <p class="field__error" data-error="correo" role="alert"></p>
      </div>
      <div class="field">
        <label for="login-contrasena">Contraseña</label>
        <div class="field__control">
          <span class="field__icon">${icono('candado')}</span>
          <input id="login-contrasena" name="contrasena" type="password" autocomplete="current-password" placeholder="Tu contraseña" required />
          <button class="field__toggle" type="button" data-ver="login-contrasena" aria-label="Mostrar contraseña">${icono('ojo')}</button>
        </div>
        <p class="field__error" data-error="contrasena" role="alert"></p>
      </div>
      <p class="form__general" data-general role="alert"></p>
      <button class="btn btn--primary btn--block" type="submit" data-enviar>Entrar a mi cuenta</button>
      <div class="demo-hint">
        <span class="demo-hint__icon">${icono('chispa')}</span>
        <div>
          <strong>Cuenta de prueba</strong>
          <p><code>${CUENTA_DEMO.correo}</code> · <code>${CUENTA_DEMO.contrasena}</code></p>
        </div>
        <button class="btn btn--ghost btn--xs" type="button" data-demo>Usar</button>
      </div>
    </form>`;

  const formularioRegistro = () => `
    <form class="form" id="form-registro" novalidate>
      <p class="form__motivo">Crea tu cuenta para apartar asientos y consultar tus compras.</p>
      <div class="field">
        <label for="reg-nombre">Nombre completo</label>
        <div class="field__control">
          <span class="field__icon">${icono('usuario')}</span>
          <input id="reg-nombre" name="nombre" type="text" autocomplete="name" placeholder="Nombre y apellido" required />
        </div>
        <p class="field__error" data-error="nombre" role="alert"></p>
      </div>
      <div class="field">
        <label for="reg-correo">Correo electrónico</label>
        <div class="field__control">
          <span class="field__icon">${icono('correo')}</span>
          <input id="reg-correo" name="correo" type="email" inputmode="email" autocomplete="email" placeholder="tu@correo.mx" required />
        </div>
        <p class="field__error" data-error="correo" role="alert"></p>
      </div>
      <div class="grid-2">
        <div class="field">
          <label for="reg-contrasena">Contraseña</label>
          <div class="field__control">
            <span class="field__icon">${icono('candado')}</span>
            <input id="reg-contrasena" name="contrasena" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres" required />
          </div>
          <p class="field__error" data-error="contrasena" role="alert"></p>
        </div>
        <div class="field">
          <label for="reg-confirmacion">Confirmar contraseña</label>
          <div class="field__control">
            <span class="field__icon">${icono('candado')}</span>
            <input id="reg-confirmacion" name="confirmacion" type="password" autocomplete="new-password" placeholder="Repítela" required />
          </div>
          <p class="field__error" data-error="confirmacion" role="alert"></p>
        </div>
      </div>
      <p class="form__nota">${icono('escudo')} Tus datos se guardan sólo en este navegador durante la demo.</p>
      <p class="form__general" data-general role="alert"></p>
      <button class="btn btn--primary btn--block" type="submit" data-enviar>Crear cuenta y continuar</button>
    </form>`;

  const contenido = () => `
    <div class="auth">
      <div class="auth__tabs" role="tablist" aria-label="Acceso a la cuenta">
        <button class="auth__tab ${modoActual === 'login' ? 'activo' : ''}" type="button" role="tab" aria-selected="${modoActual === 'login'}" data-tab="login">Iniciar sesión</button>
        <button class="auth__tab ${modoActual === 'registro' ? 'activo' : ''}" type="button" role="tab" aria-selected="${modoActual === 'registro'}" data-tab="registro">Crear cuenta</button>
      </div>
      <div class="auth__panel" id="auth-panel">${modoActual === 'login' ? formularioLogin() : formularioRegistro()}</div>
    </div>`;

  const mostrarErrores = (formulario, errores) => {
    formulario.querySelectorAll('[data-error]').forEach((nodo) => {
      nodo.textContent = '';
    });
    for (const [campo, mensaje] of Object.entries(errores || {})) {
      const nodo = formulario.querySelector(`[data-error="${campo}"]`);
      if (nodo) nodo.textContent = mensaje;
    }
    const primero = Object.keys(errores || {})[0];
    formulario.querySelector(`[name="${primero}"]`)?.focus();
  };

  const conectar = (dialogo) => {
    dialogo.querySelectorAll('[data-tab]').forEach((boton) => {
      boton.addEventListener('click', () => {
        modoActual = boton.dataset.tab;
        dialogo.querySelector('.auth__panel').innerHTML = modoActual === 'login' ? formularioLogin() : formularioRegistro();
        dialogo.querySelectorAll('[data-tab]').forEach((otro) => {
          const activo = otro.dataset.tab === modoActual;
          otro.classList.toggle('activo', activo);
          otro.setAttribute('aria-selected', String(activo));
        });
        conectarFormulario(dialogo);
      });
    });

    dialogo.querySelectorAll('.field__toggle').forEach((boton) => {
      boton.addEventListener('click', () => {
        const input = dialogo.querySelector(`#${boton.dataset.ver}`);
        if (!(input instanceof HTMLInputElement)) return;
        const mostrando = input.type === 'text';
        input.type = mostrando ? 'password' : 'text';
        boton.setAttribute('aria-label', mostrando ? 'Mostrar contraseña' : 'Ocultar contraseña');
      });
    });

    dialogo.querySelector('[data-demo]')?.addEventListener('click', () => {
      const correo = dialogo.querySelector('#login-correo');
      const clave = dialogo.querySelector('#login-contrasena');
      if (correo) correo.value = CUENTA_DEMO.correo;
      if (clave) clave.value = CUENTA_DEMO.contrasena;
      dialogo.querySelector('#form-login')?.requestSubmit();
    });

    conectarFormulario(dialogo);
  };

  const conectarFormulario = (dialogo) => {
    const formulario = dialogo.querySelector('#form-login, #form-registro');
    if (!(formulario instanceof HTMLFormElement)) return;
    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const boton = formulario.querySelector('[data-enviar]');
      const general = formulario.querySelector('[data-general]');
      const datosFormulario = Object.fromEntries(new FormData(formulario).entries());
      const esRegistro = formulario.id === 'form-registro';

      if (general) general.textContent = '';
      const validacion = esRegistro ? validarRegistro(datosFormulario) : validarLogin(datosFormulario);
      if (!validacion.valido) {
        mostrarErrores(formulario, validacion.errores);
        return;
      }
      mostrarErrores(formulario, {});

      const textoOriginal = boton?.innerHTML;
      if (boton) {
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner" aria-hidden="true"></span> Un momento…';
      }
      try {
        const sesion = esRegistro
          ? await datos.registrar(validacion.datos)
          : await datos.login({
              correo: normalizarCorreo(datosFormulario.correo),
              contrasena: datosFormulario.contrasena,
            });
        toast(`¡Hola, ${sesion.comprador.nombre.split(' ')[0]}!`, 'exito');
        modal?.cerrar();
        alEntrar?.(sesion);
      } catch (error) {
        if (error?.detalles?.campo) {
          mostrarErrores(formulario, { [error.detalles.campo]: error.mensaje });
        } else if (general) {
          general.textContent = mensajeDeError(error);
        }
        if (boton) {
          boton.disabled = false;
          boton.innerHTML = textoOriginal;
        }
      }
    });
  };

  modal = abrirModal({
    titulo: modoActual === 'registro' ? 'Crea tu cuenta' : 'Bienvenido de nuevo',
    etiqueta: 'Tu cuenta del teatro',
    ancho: '560px',
    contenido: contenido(),
    alMontar: conectar,
  });
  return modal;
}
