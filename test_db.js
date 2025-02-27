const mysql = require('mysql');

const db = mysql.createConnection({
  host: '192.168.18.4',
  user: 'node_user',
  password: 'Zapatitoblanco123',
  database: 'scgem',
});

connection.connect((err) => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Database connected!');
  }
  connection.end();
});
