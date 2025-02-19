const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const qr = require('qrcode');

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

// Role constants
const ROLES = {
  STUDENT: '1',
  PROFESSOR: '2',
  ADMIN_STAFF: '3',
  SUPER_ADMIN: '99'
};

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

// Role check middleware
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.user_role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// COMMON ROUTES

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM USUARIOS WHERE user_name = ?', [username], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error' });

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
      user_id: user.id_user 
    });
  });
});

// STUDENT ROUTES

app.get('/student/subjects/:matricula', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      m.nombre as materia,
      p.nombre as profesor,
      TIME_FORMAT(h.h_lunes, '%H:%i') as lunes,
      TIME_FORMAT(h.h_martes, '%H:%i') as martes,
      TIME_FORMAT(h.h_miercoles, '%H:%i') as miercoles,
      TIME_FORMAT(h.h_jueves, '%H:%i') as jueves,
      TIME_FORMAT(h.h_viernes, '%H:%i') as viernes,
      ga.id_grupo
    FROM GRUPOALUMNOS ga
    JOIN MATERIAS m ON ga.id_materia = m.id_materia
    JOIN MATERIASPROFESORES mp ON ga.id_grupo = mp.id_grupo
    JOIN PROFESORES p ON mp.id_profesor = p.id_profesor
    JOIN HORARIOS h ON ga.id_grupo = h.id_grupo
    WHERE ga.matricula = ?
  `;
  
  db.query(query, [req.params.matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

app.get('/student/grades/:matricula', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      m.nombre as materia,
      c.calif_p1,
      c.calif_p2,
      c.calif_final,
      c.ciclo_cursando,
      ROUND((CAST(c.calif_p1 AS DECIMAL) + CAST(c.calif_p2 AS DECIMAL) + CAST(c.calif_final AS DECIMAL)) / 3, 2) as promedio
    FROM CALIFICACIONES c
    JOIN MATERIAS m ON c.id_materia = m.id_materia
    WHERE c.matricula = ?
  `;
  
  db.query(query, [req.params.matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

app.get('/student/payments/:matricula', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      matricula,
      ciclo_cursando,
      DATE_FORMAT(pago1, '%Y-%m-%d') as pago1,
      DATE_FORMAT(pago2, '%Y-%m-%d') as pago2,
      DATE_FORMAT(pago3, '%Y-%m-%d') as pago3,
      DATE_FORMAT(pago4, '%Y-%m-%d') as pago4,
      DATE_FORMAT(pago5, '%Y-%m-%d') as pago5,
      DATE_FORMAT(pago6, '%Y-%m-%d') as pago6,
      pago_mensual,
      total,
      status
    FROM PAGOS
    WHERE matricula = ?
  `;
  
  db.query(query, [req.params.matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});


///////////////////PRUEBA////////////////
///////////ESTUDIANTES-TABLA/////////////
app.get('/student/tabla-datos-estudiante/', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      MATERIAS.nombre AS materia_nombre,
      PROFESORES.nombre AS profesor_nombre,
      CONCAT(HORARIOS.h_lunes, '\n', HORARIOS.h_martes, '\n', HORARIOS.h_miercoles, '\n', HORARIOS.h_jueves, '\n', HORARIOS.h_viernes) AS horarios,
      GRUPOALUMNOS.id_grupo
  FROM MATERIAS
  JOIN PROFESORES
join HORARIOS on MATERIAS.id_materia = HORARIOS.id_materia
JOIN GRUPOALUMNOS on GRUPOALUMNOS.id_materia = MATERIAS.id_materia
JOIN ALUMNOS ON GRUPOALUMNOS.matricula = ALUMNOS.matricula
WHERE ALUMNOS.matricula = ? ;
  `;  
  
  console.log("Query:" ,query);

  db.query(query, [req.params.matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    
    console.log("Matricula",req.params.matricula);
    console.log("resutados",results);
    //console.log("Token being sent:", req);

    res.json(results);
  });

});
//////////////////////////////////////////


// PROFESSOR ROUTES

app.get('/professor/schedule/:id_profesor', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      m.nombre as materia,
      mp.id_grupo,
      TIME_FORMAT(h.h_lunes, '%H:%i') as lunes,
      TIME_FORMAT(h.h_martes, '%H:%i') as martes,
      TIME_FORMAT(h.h_miercoles, '%H:%i') as miercoles,
      TIME_FORMAT(h.h_jueves, '%H:%i') as jueves,
      TIME_FORMAT(h.h_viernes, '%H:%i') as viernes
    FROM MATERIASPROFESORES mp
    JOIN MATERIAS m ON mp.id_materia = m.id_materia
    JOIN HORARIOS h ON mp.id_grupo = h.id_grupo
    WHERE mp.id_profesor = ?
  `;
  
  db.query(query, [req.params.id_profesor], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

app.get('/professor/group-students/:id_grupo', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      a.matricula,
      a.nombre,
      a.carrera,
      a.semestre,
      c.calif_p1,
      c.calif_p2,
      c.calif_final
    FROM GRUPOALUMNOS ga
    JOIN ALUMNOS a ON ga.matricula = a.matricula
    LEFT JOIN CALIFICACIONES c ON ga.matricula = c.matricula AND ga.id_materia = c.id_materia
    WHERE ga.id_grupo = ?
  `;
  
  db.query(query, [req.params.id_grupo], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

app.post('/professor/generate-qr', authenticateToken, async (req, res) => {
  const { id_grupo, id_materia } = req.body;
  const codigo = Math.random().toString(36).substring(2, 12).toUpperCase();
  
  try {
    const qrCode = await qr.toDataURL(codigo);
    res.json({ qrCode, codigo });
  } catch (err) {
    res.status(500).json({ message: 'QR generation failed' });
  }
});

app.post('/professor/update-grades', authenticateToken, (req, res) => {
  const { matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando } = req.body;
  
  const query = `
    INSERT INTO CALIFICACIONES 
      (matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      calif_p1 = VALUES(calif_p1),
      calif_p2 = VALUES(calif_p2),
      calif_final = VALUES(calif_final)
  `;
  
  db.query(query, 
    [matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json({ message: 'Grades updated successfully' });
    }
  );
});

// ADMIN STAFF ROUTES
app.get('/admin/students', authenticateToken, checkRole([ROLES.ADMIN_STAFF, ROLES.SUPER_ADMIN]), (req, res) => {
  const query = 'SELECT * FROM ALUMNOS';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

app.get('/admin/professors', authenticateToken, checkRole([ROLES.ADMIN_STAFF, ROLES.SUPER_ADMIN]), (req, res) => {
  const query = 'SELECT * FROM PROFESORES';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

app.get('/admin/subjects', authenticateToken, checkRole([ROLES.ADMIN_STAFF, ROLES.SUPER_ADMIN]), (req, res) => {
  const query = 'SELECT * FROM MATERIAS';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

// SUPER ADMIN ROUTES
app.get('/superadmin/users', authenticateToken, checkRole([ROLES.SUPER_ADMIN]), (req, res) => {
  const query = 'SELECT * FROM USUARIOS';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

app.post('/superadmin/user', authenticateToken, checkRole([ROLES.SUPER_ADMIN]), (req, res) => {
  const { user_name, password, id_user, user_role } = req.body;
  const query = 'INSERT INTO USUARIOS (user_name, password, id_user, user_role) VALUES (?, ?, ?, ?)';
  
  db.query(query, [user_name, password, id_user, user_role], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json({ message: 'User created successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
