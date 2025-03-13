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
  host: '127.0.0.1',
  user: 'node_user',
  password: 'Zapatitoblanco123',
  database: 'SCGEM',
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

  db.query('SELECT *, ALUMNOS.matricula FROM USUARIOS JOIN ALUMNOS ON USUARIOS.id_user = ALUMNOS.matricula WHERE user_name = ?;', [username], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (result.length === 0 || result[0].password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result[0];
    const token = jwt.sign(
      {
        user_id: user.id_user,
        user_name: user.user_name,
        user_role: user.user_role,
        user_matricula: user.matricula
      },
      'aVeryStrongSecretKeyHere',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user_role: user.user_role,
      user_id: user.id_user,
      user_matricula: user.matricula
    });
  });
});

///////////////////////////////////////////////////////       ESTUDIANTES       ////////////////////////////////////////////////////////////////////////////////

/////////////////       MATERIAS       ////////////////////////////////////////////
app.get('/student/tabla-datos-estudiante/', authenticateToken, (req, res) => {
  const query = `
    SELECT 
    MATERIAS.nombre AS materia_nombre,
    PROFESORES.nombre AS profesor_nombre,
    CONCAT(
        'Lunes: ', TIME_FORMAT(HORARIOS.h_lunes, '%H:%i'), '\n',
        'Martes: ', TIME_FORMAT(HORARIOS.h_martes, '%H:%i'), '\n',
        'Miércoles: ', TIME_FORMAT(HORARIOS.h_miercoles, '%H:%i'), '\n',
        'Jueves: ', TIME_FORMAT(HORARIOS.h_jueves, '%H:%i'), '\n',
        'Viernes: ', TIME_FORMAT(HORARIOS.h_viernes, '%H:%i')
    ) AS horarios,
    GRUPOALUMNOS.id_grupo
FROM MATERIAS
JOIN PROFESORES
JOIN HORARIOS ON MATERIAS.id_materia = HORARIOS.id_materia
JOIN GRUPOALUMNOS ON GRUPOALUMNOS.id_materia = MATERIAS.id_materia
JOIN ALUMNOS ON GRUPOALUMNOS.matricula = ALUMNOS.matricula
WHERE ALUMNOS.matricula = ?;
  `;
  db.query(query, [req.user.user_matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});


/////////////////       CALIFICACIONES       ///////////////////////////////////////
app.get('/student/tabla-calificaciones/', authenticateToken, (req, res) => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = today.getMonth() + 1; 

  const ciclo_cursando = month >= 1 && month <= 6 
    ? `FEB${year}-JUN${year}` 
    : `AGO${year}-DEC${year}`;
  const query = `
    SELECT 
      m.nombre as materia,
      c.calif_p1,
      c.calif_p2,
      c.calif_final,
      ROUND((CAST(c.calif_p1 AS DECIMAL) + CAST(c.calif_p2 AS DECIMAL) + CAST(c.calif_final AS DECIMAL)) / 3, 2) as promedio,
      c.ciclo_cursando
    FROM CALIFICACIONES c
    JOIN MATERIAS m ON c.id_materia = m.id_materia
    WHERE c.matricula = ? AND c.ciclo_cursando = ?;
  `;

  // Execute Query
  db.query(query, [req.user.user_matricula, ciclo_cursando], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});


/////////////////       KARDEZ       ///////////////////////////////////////
app.get('/student/tabla-kardez/', authenticateToken, (req, res) => {
  const query = `
    SELECT 
    m.nombre AS materia,
    c.ciclo_cursando AS periodo,
    ROUND((CAST(c.calif_p1 AS DECIMAL) + CAST(c.calif_p2 AS DECIMAL) + CAST(c.calif_final AS DECIMAL)) / 3, 2) AS calif_final,
    CASE 
        WHEN ROUND((CAST(c.calif_p1 AS DECIMAL) + CAST(c.calif_p2 AS DECIMAL) + CAST(c.calif_final AS DECIMAL)) / 3, 2) > 7 
        THEN 'Aprobado' 
        ELSE 'Reprobado' 
    END AS estado
    FROM CALIFICACIONES c
    JOIN MATERIAS m ON c.id_materia = m.id_materia
    WHERE c.matricula = ?;
  `;
  
  db.query(query, [req.user.user_matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});


/////////////////       PAGOS       ///////////////////////////////////////
app.get('/student/tabla-pagos/', authenticateToken, (req, res) => {
  const query = `
    SELECT 
    DATE_FORMAT(p.fecha_vencimiento, '%M') AS MES,  -- Extracts month name
    p.pago_mensual AS CANTIDAD,
    p.fecha_vencimiento AS FECHA_CORTE,
    CASE 
        WHEN p.fecha_pago IS NULL THEN 'Pendiente'
        WHEN DAY(p.fecha_pago) BETWEEN 1 AND 5 THEN 'Descuento 5%'
        WHEN DAY(p.fecha_pago) BETWEEN 6 AND 15 THEN 'Normal'
        WHEN DAY(p.fecha_pago) > 15 THEN 'Recargo 5%'
    END AS ESTADO,
    CASE 
        WHEN p.fecha_pago IS NULL THEN 'Por pagar'
        ELSE 'Pagado'
    END AS ACCION

  FROM PAGOS p
  JOIN ALUMNOS on ALUMNOS.matricula = p.matricula
  where ALUMNOS.matricula = ?;
  `;
  
  db.query(query, [req.user.user_matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    console.log(results);
    res.json(results);
  });
});


/////////////////       ASISTENCIAS       ///////////////////////////////////////
app.post('/student/registro-asistencias/', authenticateToken, (req, res) => {
  const { codigo_asistencia } = req.body;
  const user_matricula = req.user.user_matricula;

  console.log(codigo_asistencia);

  if (!codigo_asistencia) 
      return res.status(400).json({ success: false, message: "Código de asistencia requerido" });
  
  const query = ` INSERT INTO ASISTENCIAS (matricula, codigo_asistencia, asistencia) VALUES (?, ?, NOW()); `;

  db.query(query, [user_matricula, codigo_asistencia], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, message: "Asistencia registrada correctamente" });
  });
});


///////////////////////////////////////////////////////    FIN   ESTUDIANTES       ////////////////////////////////////////////////////////////////////////////////










///////////////////////////////////////////////////////       PROFESORES       ////////////////////////////////////////////////////////////////////////////////

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
