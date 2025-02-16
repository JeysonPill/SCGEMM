/*

const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;

const cors = require('cors');

app.use(cors());  // This will allow all origins to access your API


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

*/
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create an Express app
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection setup
const db = mysql.createConnection({
  host: '192.168.18.11',  // Replace with your Server Laptop's IP
  user: 'node_user',
  password: 'Zapatitoblanco123',
  database: 'SCGEM'
});

// Check DB connection
db.connect(err => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to the database');
});

/*

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM USUARIOS WHERE user_name = ?';
  alert("aaa");
  db.query(query, [username], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    const user = results[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Compare passwords
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: 'Error comparing passwords' });

      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      // Generate JWT token with user role
      const token = jwt.sign({
        id: user.id_user,
        username: user.user_name,
        role: user.user_role // Include role in the JWT
      }, 'aVeryStrongSecretKeyHere', { expiresIn: '1h' });

      res.json({ token });
    });
  });
});
*/

app.post('/login', (req, res) => {
  const { user_name, password } = req.body;

  db.query('SELECT * FROM USUARIOS WHERE user_name = ?', [user_name], (err, result) => {
      if (err) {
          console.error('Database query error:', err); // Log the error
          return res.status(500).send('Internal server error');
      }

      if (result.length === 0 || result[0].password !== password) {
        console.error(result[0],result[1],result[2]);
          return res.status(401).send('Invalid credentials');
      }

      const user = result[0];
      const token = jwt.sign(
          { user_id: user.id_user, user_name: user.user_name, user_role: user.user_role },
          'aVeryStrongSecretKeyHere',
          { expiresIn: '1h' }
      );
      res.json({ token });
  });
});


// Middleware to check user role
const checkRole = (role) => (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  if (!token) return res.status(403).send('Access denied');

  jwt.verify(token, 'aVeryStrongSecretKeyHere', (err, decoded) => {
    if (err) return res.status(403).send('Invalid token');

    if (decoded.role !== role) return res.status(403).send('Forbidden');
    req.user = decoded;  // Attach user data to the request object
    next();
  });
};

// Example protected route for admins
app.get('/admin-dashboard', checkRole('99'), (req, res) => {
  res.send('Welcome to the Admin Dashboard');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
