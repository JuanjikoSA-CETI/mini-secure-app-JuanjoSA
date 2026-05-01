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
app.get('/', (req, res)