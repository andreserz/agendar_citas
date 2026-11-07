'use strict';

const { probarContratoRepos } = require('./contrato-repos');
const { crearReposEnMemoria } = require('../../app/repos/memoria');
const { crearRepos } = require('../../app/repos');
const { cargarConfig } = require('../../app/config');

probarContratoRepos('memoria', () => crearReposEnMemoria());

describe('crearRepos (selección por REPOSITORIO)', () => {
  test('usa memoria por defecto', () => {
    const repos = crearRepos(cargarConfig({}));
    expect(Object.keys(repos).sort()).toEqual(['asientosRepo', 'ordenesRepo', 'reservasRepo']);
  });

  test('falla con un valor no disponible', () => {
    expect(() => crearRepos(cargarConfig({ REPOSITORIO: 'sqlserver' }))).toThrow(/no está disponible/);
  });

  test('cada llamada crea un almacén independiente', async () => {
    const a = crearReposEnMemoria();
    const b = crearReposEnMemoria();
    const ahora = new Date('2026-11-06T18:00:00Z');
    await a.reservasRepo.crear({
      sitio: 'web_1', compradorId: 'c', funcionId: 'fun-2026-11-06-1900',
      asientoIds: ['A1'], ahora, expiraEn: new Date(ahora.getTime() + 300000),
    });
    const [a1] = (await b.asientosRepo.listarAsientos('fun-2026-11-06-1900', ahora)).filter((x) => x.id === 'A1');
    expect(a1.estado).toBe('disponible');
  });
});
