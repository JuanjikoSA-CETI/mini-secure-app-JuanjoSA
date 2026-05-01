const express = require('express');
const client = require('prom-client');   // <-- NUEVO

const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const helmet = require("helmet");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        scriptSrcAttr: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: "no-referrer" },
    frameguard: { action: "deny" },
    noSniff: true,
    permissionsPolicy: {
      features: {
        camera: ["none"],
        microphone: ["none"],
        geolocation: ["none"],
        fullscreen: ["self"],
      },
    },

    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
  })
);

const PORT = process.env.PORT || 3001;

// Registro de métricas
const register = new client.Registry();
client.collectDefaultMetrics({ register });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------------------------------------------------
// 1) /metrics DEBE IR ANTES DEL MIDDLEWARE CSRF
// ---------------------------------------------------------
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// ---------------------------------------------------------
// 2) AHORA ACTIVAMOS CSRF PARA EL RESTO DE RUTAS
// ---------------------------------------------------------
const csrf = require('csurf');

app.use(
  csrf({
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    },
  })
);

// Rutas estáticas
app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send("User-agent: *\nDisallow:");
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml").send(`
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>http://localhost:3001/</loc>
      </url>
    </urlset>
  `);
});

// Página principal
app.get('/', (req, res) => {
  const csrfToken = req.csrfToken();

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
          <input type="hidden" name="_csrf" value="${csrfToken}">
          <textarea name="comment" rows="4" cols="50" placeholder="Escribe un comentario"></textarea><br/>
          <button type="submit">Guardar comentario</button>
        </form>
      </body>
    </html>
  `);
});

// Login
app.get('/login', (req, res) => {
  const csrfToken = req.csrfToken();

  res.send(`
    <html>
      <head><title>Login</title></head>
      <body>
        <h1>Login</h1>
        <form action="/login" method="POST">
          <input type="hidden" name="_csrf" value="${csrfToken}">
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
  const csrfToken = req.csrfToken();

  res.send(`
    <html>
      <head><title>Nuevo ticket</title></head>
      <body>
        <h1>Crear ticket</h1>
        <form action="/ticket/new" method="POST">
          <input type="hidden" name="_csrf" value="${csrfToken}">
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
            <li>
              <strong>${t.title}</strong><br/>
              ${t.description}
            </li>
          `
        )
        .join('')
    : '<li>No se encontraron resultados</li>';

  res.send(`
    <html>
      <head><title>Resultados de búsqueda</title></head>
      <body>
        <h1>Resultados para "${q}"</h1>
        <ul>${items}</ul>
        <p><a href="/">Volver</a></p>
      </body>
    </html>
  `);
});

// Comentarios
app.post('/comment', (req, res) => {
  const { comment } = req.body;
  comments.push(comment || 'Comentario vacío');

  res.send(`
    <html>
      <head><title>Comentario guardado</title></head>
      <body>
        <h1>Comentario guardado</h1>
        <p><a href="/comments">Ver comentarios</a></p>
      </body>
    </html>
  `);
});

app.get('/comments', (req, res) => {
  const items = comments.map((c) => `<li>${c}</li>`).join('');

  res.send(`
    <html>
      <head><title>Comentarios</title></head>
      <body>
        <h1>Comentarios</h1>
        <ul>${items}</ul>
        <p><a href="/">Volver</a></p>
      </body>
    </html>
  `);
});

// Iniciar servidor solo si no estamos en test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

module.exports = app;
