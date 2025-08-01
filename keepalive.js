const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Bot activo'));
app.listen(3000, () => console.log('KeepAlive listo.'));

module.exports = () => {};
