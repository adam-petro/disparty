const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("<h1>Disparty</h1>");
});

app.listen(8080, () => {
  console.log("app listening");
});
