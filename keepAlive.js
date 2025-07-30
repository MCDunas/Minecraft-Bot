const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('El bot sigue activo!');
});

app.listen(3000, () => {
  console.log('✅ Servidor de keepAlive activo en el puerto 3000');
});

module.exports = () => {};
