const express = require("express");
const app = express();

function keepAlive() {
  app.get("/", (req, res) => {
    res.send("Bot activo!");
  });
  app.listen(3000, () => {
    console.log("✅ KeepAlive activo en puerto 3000");
  });
}

module.exports = { keepAlive };
