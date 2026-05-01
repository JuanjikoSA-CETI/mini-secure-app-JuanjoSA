const request = require('supertest');
const app = require('../src/app');

describe('Mini Secure Tickets App', () => {
  test('GET / debe devolver 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Mini Secure Tickets App');
  });

  test('POST /ticket/new debe crear ticket', async () => {
  const agent = request.agent(app);

  // 1. Obtener el formulario para capturar el token CSRF
  const getRes = await agent.get('/ticket/new');
  const csrfToken = /name="_csrf" value="(.+?)"/.exec(getRes.text)[1];

  // 2. Enviar el POST con el token CSRF y la cookie
  const postRes = await agent
    .post('/ticket/new')
    .send({
      title: 'Ticket de prueba',
      description: 'Descripción de prueba',
      _csrf: csrfToken
    });

  expect(postRes.statusCode).toBe(200);
  expect(postRes.text).toContain('Ticket guardado correctamente');
});


  test('POST /ticket/new debe crear ticket', async () => {
    const res = await request(app)
      .post('/ticket/new')
      .type('form')
      .send({ title: 'Ticket de prueba', description: 'Descripción de prueba' });

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Ticket guardado correctamente');
  });
});