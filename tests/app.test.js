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

    // 1. GET para obtener cookie + token CSRF
    const getRes = await agent.get('/ticket/new');

    // Extraer token CSRF del HTML
    const csrfToken = /name="_csrf" value="(.+?)"/.exec(getRes.text)[1];

    // 2. POST enviando token + cookie (agent lo hace automáticamente)
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
});

