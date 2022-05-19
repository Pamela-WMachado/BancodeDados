const express = require("express");
const app = express();

let produtos = require('./produtos');
app.use('/', produtos);

let usuarios = require('./usuarios');
app.use('/', usuarios); 

app.listen(8081, () => console.log('aplicação em execução na url http://localhost:8081'));