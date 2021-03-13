const {Router} = require('express');
const helloWord = require('../helloWord');

const router = new Router();

router.use('/get-hw', helloWord);

module.exports = router;
