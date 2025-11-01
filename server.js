/******************************************************
 * URL Shortener Microservice (freeCodeCamp)
 ******************************************************/
'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');

const app = express();
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(bodyParser.urlencoded({ extended: false }));

const idToUrl = new Map();
let nextId = 1;

function validateUrl(userUrl, cb) {
  let parsed;
  try {
    parsed = new URL(userUrl);
  } catch {
    return cb(new Error('invalid url'));
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return cb(new Error('invalid url'));
  }
  dns.lookup(parsed.hostname, (err) => {
    if (err) return cb(new Error('invalid url'));
    cb(null, parsed.toString());
  });
}

app.get('/', (_req, res) => {
  res.type('text').send('URL Shortener running. POST form-encoded {url} to /api/shorturl');
});

app.post('/api/shorturl', (req, res) => {
  const userUrl = req.body.url;
  validateUrl(userUrl, (err, normalized) => {
    if (err) return res.json({ error: 'invalid url' });
    for (const [id, url] of idToUrl.entries()) {
      if (url === normalized) return res.json({ original_url: normalized, short_url: id });
    }
    const id = nextId++;
    idToUrl.set(id, normalized);
    res.json({ original_url: normalized, short_url: id });
  });
});

app.get('/api/shorturl/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.json({ error: 'invalid url' });
  const url = idToUrl.get(id);
  if (!url) return res.json({ error: 'invalid url' });
  res.redirect(url);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Your app is listening on port ' + port));
