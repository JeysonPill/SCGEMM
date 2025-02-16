const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;

// Create MySQL connection
const db = mysql.createConnection({
  host: "192.168.18.11",  // IP DEL SERVIDOR
  user: "node_user",
  password: "Zapatitoblanco123",
  database: "SCGEM"
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});

// BASE:OBTENER DATOS DE TABLA ALUMNOS
app.get('/ALUMNOS', (req, res) => {
  db.query('SELECT * FROM ALUMNOS', (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Database query failed');
    }
    res.json(results);  // ENVIAR DATOS AL FRONT
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
