'use strict';

const { SitiosRepo } = require('../../app/repos/interfaces');
const { crearReposEnMemoria } = require('../../app/repos/memoria');

describe('SitiosRepo (memoria)', () => {
  let sitiosRepo;

  beforeEach(() => {
    ({ sitiosRepo } = crearReposEnMemoria());
  });

  test('extiende su interfaz y sobrescribe todos sus métodos', () => {
    expect(sitiosRepo).toBeInstanceOf(SitiosRepo);
    for (const metodo of Object.getOwnPropertyNames(SitiosRepo.prototype).filter((m) => m !== 'constructor')) {
      expect(sitiosRepo[metodo]).not.toBe(SitiosRepo.prototype[metodo]);
    }
  });

  test('web_1 requiere comprador y web_2 no', async () => {
    expect(await sitiosRepo.listar()).toEqual([
      { id: 'web_1', nombre: 'Teatro Aquí nadie actúa normal', requiereComprador: true },
      { id: 'web_2', nombre: 'Cineclub', requiereComprador: false },
    ]);
    expect(await sitiosRepo.obtener('web_1')).toMatchObject({ requiereComprador: true });
    expect(await sitiosRepo.obtener('web_2')).toMatchObject({ requiereComprador: false });
  });

  test('un sitio desconocido devuelve null', async () => {
    expect(await sitiosRepo.obtener('web_3')).toBeNull();
  });

  test('devuelve copias: modificarlas no altera los datos', async () => {
    const sitio = await sitiosRepo.obtener('web_1');
    sitio.requiereComprador = false;
    expect(await sitiosRepo.obtener('web_1')).toMatchObject({ requiereComprador: true });
  });
});
