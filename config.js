module.exports = {
  FRONTEND_ORIGIN:  process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000',
  PORT : process.env.PORT || 8080
};
