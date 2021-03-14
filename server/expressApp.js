const express = require('express');
const bodyParser = require('body-parser');
const config = require('../config');
const path = require('path');

const expressApp = express();

if (process.env.NODE_ENV !== 'production') {
  expressApp.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin', [config.FRONTEND_ORIGIN]);
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
} else {
  expressApp.use(express.static(path.join(__dirname, '../build')));
}

expressApp.use(bodyParser.urlencoded({ extended: true }))
expressApp.use(bodyParser.json())

module.exports = expressApp;
