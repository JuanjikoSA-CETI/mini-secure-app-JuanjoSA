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

    // 1. GET correcto: la ruta que devuelve el formulario es "/"
    const getRes = await agent.get('/');

    // Extraer token CSRF del HTML
    const csrfToken = /name="_csrf" value="(.+?)"/.exec(getRes.text)[1];

    // 2. POST enviando token + cookie + nombres correctos
    const postRes = await agent
      .post('/ticket/new')
      .send({
        titulo: 'Ticket de prueba',
        descripcion: 'Descripción de prueba',
        _csrf: csrfToken
      });

    expect(postRes.statusCode).toBe(200);
    expect(postRes.text).toContain('Ticket guardado correctamente');
  });
});
