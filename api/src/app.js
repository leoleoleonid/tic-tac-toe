const express = require('express');
const bodyParser = require('body-parser');
const api = require('./api');
const config = require('../config');

const app = express();
app.get('/', (request, response) => response.sendStatus(200));
app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', [config.FRONTEND_ORIGIN]);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use('/api', api);

module.exports = app;
