const express = require('express');
const hwController = require('./hwController');

const router = express.Router();

router.get('/', hwController.getHW);

module.exports = router
