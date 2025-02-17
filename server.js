const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: '192.168.18.11',
  user: 'node_user',
  password: 'Zapatitoblanco123',
  database: 'SCGEM'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database');
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  jwt.verify(token, 'aVeryStrongSecretKeyHere', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// LOGIN
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
      { user_id: user.id_user, user_name: user.user_name, user_role: user.user_role },
      'aVeryStrongSecretKeyHere',
      { expiresIn: '1h' }
    );

    res.json({ token, user_role: user.user_role });
  });
});

// SECCIONE STUDIANTE

// OBTENER MATERIAS Y PROFES
app.get('/student/subjects/:matricula', authenticateToken, (req, res) => {
  const query = `
    SELECT m.nombre as materia, p.nombre as profesor, h.h_lunes, h.h_martes, h.h_miercoles, h.h_jueves, h.h_viernes, ga.id_grupo
    FROM GRUPOALUMNOS ga
    JOIN MATERIAS m ON ga.id_materia = m.id_materia
    JOIN MATERIASPROFESORES mp ON ga.id_grupo = mp.id_grupo
    JOIN PROFESORES p ON mp.id_profesor = p.id_profesor
    JOIN HORARIOS h ON ga.id_grupo = h.id_grupo
    WHERE ga.matricula = ?
  `;
  
  db.query(query, [req.params.matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
});

// OBTENER CALIFICAIONES
app.get('/student/grades/:matricula', authenticateToken, (req, res) => {
  const query = `
    SELECT m.nombre as materia, c.calif_p1, c.calif_p2, c.calif_final, c.ciclo_cursando
    FROM CALIFICACIONES c
    JOIN MATERIAS m ON c.id_materia = m.id_materia
    WHERE c.matricula = ?
  `;
  
  db.query(query, [req.params.matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
});

// OBTENER ASISTENCIA
app.get('/student/attendance/:matricula', authenticateToken, (req, res) => {
  const query = `
    SELECT m.nombre as materia, a.asistencia
    FROM ASISTENCIAS a
    JOIN MATERIAS m ON a.id_materia = m.id_materia
    WHERE a.matricula = ?
  `;
  
  db.query(query, [req.params.matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
});

// OBTENER PAGOS
app.get('/student/payments/:matricula', authenticateToken, (req, res) => {
  const query = `
    SELECT *
    FROM PAGOS
    WHERE matricula = ?
  `;
  
  db.query(query, [req.params.matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
});

// REGISTRAR ASISTENCIA DE ALUMNO
app.post('/student/register-attendance', authenticateToken, (req, res) => {
  const { matricula, codigo_asistencia } = req.body;
  
  const query = `
    INSERT INTO ASISTENCIAS (matricula, id_materia, codigo_asistencia, asistencia)
    SELECT ?, m.id_materia, ?, NOW()
    FROM MATERIAS m
    WHERE m.id_materia = (
      SELECT id_materia 
      FROM GRUPOALUMNOS 
      WHERE matricula = ?
    )
  `;
  
  db.query(query, [matricula, codigo_asistencia, matricula], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Attendance registered successfully' });
  });
});

// PROFESSOR ROUTES

// OBTENER HORARIO DE PROFE
app.get('/professor/schedule/:id_profesor', authenticateToken, (req, res) => {
  const query = `
    SELECT m.nombre as materia, h.*, mp.id_grupo
    FROM MATERIASPROFESORES mp
    JOIN MATERIAS m ON mp.id_materia = m.id_materia
    JOIN HORARIOS h ON mp.id_grupo = h.id_grupo
    WHERE mp.id_profesor = ?
  `;
  
  db.query(query, [req.params.id_profesor], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
});

// OBTENER ESTUDIANTES EN GRUPOS DE PROFES
app.get('/professor/students/:id_profesor/:id_grupo', authenticateToken, (req, res) => {
  const query = `
    SELECT a.matricula, a.nombre, a.email
    FROM ALUMNOS a
    JOIN GRUPOALUMNOS ga ON a.matricula = ga.matricula
    JOIN MATERIASPROFESORES mp ON ga.id_grupo = mp.id_grupo
    WHERE mp.id_profesor = ? AND mp.id_grupo = ?
  `;
  
  db.query(query, [req.params.id_profesor, req.params.id_grupo], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
});

// GENERAR CODIGO QR DE ASISTENCIA
app.post('/professor/generate-attendance-code', authenticateToken, (req, res) => {
  const { id_profesor, id_grupo } = req.body;
  const codigo_asistencia = Math.random().toString(36).substring(2, 12).toUpperCase();
  
  // Store the code in the database or return it to be stored in the frontend
  res.json({ codigo_asistencia });
});

// CALIFICACIONES DE ALUMNOS
app.post('/professor/update-grades', authenticateToken, (req, res) => {
  const { matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando } = req.body;
  
  const query = `
    INSERT INTO CALIFICACIONES (matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    calif_p1 = VALUES(calif_p1),
    calif_p2 = VALUES(calif_p2),
    calif_final = VALUES(calif_final)
  `;
  
  db.query(query, [matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando], 
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json({ message: 'Grades updated successfully' });
    });
});

// GRUPOS DE PROFES
app.get('/professor/groups/:id_profesor', authenticateToken, (req, res) => {
  const query = `
    SELECT DISTINCT m.nombre as materia, mp.id_grupo
    FROM MATERIASPROFESORES mp
    JOIN MATERIAS m ON mp.id_materia = m.id_materia
    WHERE mp.id_profesor = ?
  `;
  
  db.query(query, [req.params.id_profesor], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});