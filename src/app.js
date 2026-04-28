const express = require('express');
const client = require('prom-client');   // <-- NUEVO

const app = express();
const PORT = process.env.PORT || 3001;

// Registro de métricas  <-- NUEVO
const register = new client.Registry();
client.collectDefaultMetrics({ register });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Endpoint /metrics para Prometheus  <-- NUEVO
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// "Base de datos" en memoria
const tickets = [
  { id: 1, title: 'Error al iniciar sesión', description: 'No puedo acceder con mi usuario' },
  { id: 2, title: 'Fallo en el panel', description: 'El dashboard carga lentamente' }
];

const comments = [];

// Página principal
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Mini Secure Tickets App</title>
      </head>
      <body>
        <h1>Mini Secure Tickets App</h1>
        <p>Aplicación de ejemplo para prácticas DevSecOps.</p>

        <ul>
          <li><a href="/login">Login</a></li>
          <li><a href="/tickets">Ver tickets</a></li>
          <li><a href="/ticket/new">Crear ticket</a></li>
          <li><a href="/comments">Ver comentarios</a></li>
        </ul>

        <h2>Buscar tickets</h2>
        <form action="/search" method="GET">
          <input type="text" name="q" placeholder="Buscar..." />
          <button type="submit">Buscar</button>
        </form>

        <h2>Añadir comentario</h2>
        <form action="/comment" method="POST">
          <textarea name="comment" rows="4" cols="50" placeholder="Escribe un comentario"></textarea><br/>
          <button type="submit">Guardar comentario</button>
        </form>
      </body>
    </html>
  `);
});

// Login simple
app.get('/login', (req, res) => {
  res.send(`
    <html>
      <head><title>Login</title></head>
      <body>
        <h1>Login</h1>
        <form action="/login" method="POST">
          <label>Usuario:</label>
          <input type="text" name="username" /><br/><br/>
          <label>Contraseña:</label>
          <input type="password" name="password" /><br/><br/>
          <button type="submit">Entrar</button>
        </form>
        <p><a href="/">Volver</a></p>
      </body>
    </html>
  `);
});

app.post('/login', (req, res) => {
  const { username } = req.body;
  res.send(`
    <html>
      <head><title>Bienvenido</title></head>
      <body>
        <h1>Bienvenido, ${username || 'usuario'}</h1>
        <p>Login simulado correctamente.</p>
        <p><a href="/">Ir al inicio</a></p>
      </body>
    </html>
  `);
});

// Listado de tickets
app.get('/tickets', (req, res) => {
  const items = tickets
    .map(
      (t) => `
        <li>
          <strong>${t.title}</strong><br/>
          ${t.description}
        </li>
      `
    )
    .join('');

  res.send(`
    <html>
      <head><title>Tickets</title></head>
      <body>
        <h1>Listado de tickets</h1>
        <ul>${items}</ul>
        <p><a href="/">Volver</a></p>
      </body>
    </html>
  `);
});

// Formulario nuevo ticket
app.get('/ticket/new', (req, res) => {
  res.send(`
    <html>
      <head><title>Nuevo ticket</title></head>
      <body>
        <h1>Crear ticket</h1>
        <form action="/ticket/new" method="POST">
          <label>Título:</label>
          <input type="text" name="title" /><br/><br/>
          <label>Descripción:</label><br/>
          <textarea name="description" rows="4" cols="50"></textarea><br/><br/>
          <button type="submit">Guardar ticket</button>
        </form>
        <p><a href="/">Volver</a></p>
      </body>
    </html>
  `);
});

app.post('/ticket/new', (req, res) => {
  const { title, description } = req.body;

  tickets.push({
    id: tickets.length + 1,
    title: title || 'Sin título',
    description: description || 'Sin descripción'
  });

  res.send(`
    <html>
      <head><title>Ticket guardado</title></head>
      <body>
        <h1>Ticket guardado correctamente</h1>
        <p><a href="/tickets">Ver tickets</a></p>
      </body>
    </html>
  `);
});

// Búsqueda
app.get('/search', (req, res) => {
  const q = req.query.q || '';

  const results = tickets.filter(
    (t) =>
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.description.toLowerCase().includes(q.toLowerCase())
  );

  const items = results.length
    ? results
        .map(
          (t) => `
