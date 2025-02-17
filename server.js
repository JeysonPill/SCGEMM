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
  host: '192.168.18.11',
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

// Role mapping for clarity
const ROLES = {
  STUDENT: 1,
  PROFESSOR: 2,
  ADMIN_STAFF: 3,
  SUPER_ADMIN: 99
};

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM USUARIOS WHERE user_name = ?', [username], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.length === 0 || result[0].password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result[0];
    const token = jwt.sign(
      { 
        user_id: user.id_user, 
        user_name: user.user_name, 
        user_role: user.user_role 
      },
      'aVeryStrongSecretKeyHere',
      { expiresIn: '1h' }
    );

    res.json({ 
      token, 
      user_role: user.user_role,
      message: 'Login successful' 
    });
  });
});

// Middleware to check user role
const checkRole = (allowedRoles) => (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(403).json({ message: 'Access denied' });

    jwt.verify(token, 'aVeryStrongSecretKeyHere', (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });

      if (!allowedRoles.includes(decoded.user_role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      req.user = decoded;
      next();
    });
  } catch (error) {
    res.status(400).json({ message: 'Invalid token format' });
  }
};

// Protected routes
app.get('/admin-dashboard', checkRole([ROLES.SUPER_ADMIN]), (req, res) => {
  res.json({ message: 'Welcome to the Admin Dashboard' });
});

app.get('/professor-dashboard', checkRole([ROLES.PROFESSOR]), (req, res) => {
  res.json({ message: 'Welcome to the Professor Dashboard' });
});

app.get('/student-dashboard', checkRole([ROLES.STUDENT]), (req, res) => {
  res.json({ message: 'Welcome to the Student Dashboard' });
});

app.get('/staff-dashboard', checkRole([ROLES.ADMIN_STAFF]), (req, res) => {
  res.json({ message: 'Welcome to the Administrative Staff Dashboard' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});