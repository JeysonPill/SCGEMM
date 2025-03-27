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

  db.query('SELECT * FROM USUARIOS WHERE user_name = ?;', [username], (err, result) => {
    if (err)                                                      return res.status(500).json({ message: 'Database error' });

    if (result.length === 0 || result[0].password !== password)   return res.status(401).json({ message: 'Invalid credentials' });
    

    const user = result[0];
    const token = jwt.sign(
      {
        user_id: user.id_user,
        user_name: user.user_name,
        user_role: user.user_role,
        user_matricula: user.id_user
      },
      'aVeryStrongSecretKeyHere',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user_role: user.user_role,
      user_id: user.id_user,
      user_matricula: user.id_user
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


app.get('/professor/schedule/', authenticateToken, (req, res) => {
  const query = `
   SELECT 
    MATERIAS.nombre AS materia_nombre,
    GRUPOALUMNOS.id_grupo,
    CONCAT(
        'Lunes: ', TIME_FORMAT(HORARIOS.h_lunes, '%H:%i'), '\n',
        'Martes: ', TIME_FORMAT(HORARIOS.h_martes, '%H:%i'), '\n',
        'Miércoles: ', TIME_FORMAT(HORARIOS.h_miercoles, '%H:%i'), '\n',
        'Jueves: ', TIME_FORMAT(HORARIOS.h_jueves, '%H:%i'), '\n',
        'Viernes: ', TIME_FORMAT(HORARIOS.h_viernes, '%H:%i')
    ) AS horarios
FROM MATERIAS
JOIN PROFESORES
JOIN HORARIOS ON MATERIAS.id_materia = HORARIOS.id_materia
JOIN GRUPOALUMNOS ON GRUPOALUMNOS.id_materia = MATERIAS.id_materia
WHERE PROFESORES.id_profesor = ?;
  `;
  console.log("matre",req.user.user_matricula);
  db.query(query, [req.user.user_matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    console.log(results);
    res.json(results);
  });
});


//////////////////////////////////////////////////////// QR ASISTENCIA //////////////////////////////////////////////////////////////////



app.get('/professor/QR_CODE_GEN/', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      GRUPOALUMNOS.id_materia,
      MATERIAS.nombre,
      GRUPOALUMNOS.id_grupo
    FROM MATERIAS
    JOIN GRUPOALUMNOS ON MATERIAS.id_materia = GRUPOALUMNOS.id_materia
    JOIN MATERIASPROFESORES ON GRUPOALUMNOS.id_grupo = MATERIASPROFESORES.id_grupo
    JOIN PROFESORES ON MATERIASPROFESORES.id_profesor = PROFESORES.id_profesor
    WHERE PROFESORES.id_profesor = ?;
  `;

  
  
  console.log("matricula del profesor:", req.user.user_matricula);
  
  db.query(query, [req.user.user_matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    console.log(results);
    res.json(results);  // Return the query results
  });
});



//////////////
///////////////////       CALIFICAICONES /////////////////////////



app.get('/professor/getSubjects', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
      MATERIAS.nombre
    FROM MATERIAS
    JOIN GRUPOALUMNOS ON MATERIAS.id_materia = GRUPOALUMNOS.id_materia
    JOIN MATERIASPROFESORES ON GRUPOALUMNOS.id_grupo = MATERIASPROFESORES.id_grupo
    JOIN PROFESORES ON MATERIASPROFESORES.id_profesor = PROFESORES.id_profesor
    WHERE PROFESORES.id_profesor = ?;
    `;
    console.log("Profesor ID:", req.user.user_matricula); // Debugging log
    let [rows] = await db.query(query, [req.user.user_matricula]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.get('/professor/getStudents', async (req, res) => {
  let { subjectId } = req.query;
  try {
      let query = `
          SELECT 
              A.matricula, A.nombre, C.calif_p1, C.calif_p2, C.calif_final
          FROM ALUMNOS A
          JOIN GRUPOALUMNOS G ON A.matricula = G.matricula
          LEFT JOIN CALIFICACIONES C ON A.matricula = C.matricula AND G.id_materia = C.id_materia
          WHERE G.id_materia = ?
      `;
      let [rows] = await db.query(query, [subjectId]);
      res.json(rows);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


app.post('/professor/insertGrade', async (req, res) => {
  let { id_materia, matricula, calif_p1, calif_p2, calif_final, ciclo_cursando } = req.body;

  if (![calif_p1, calif_p2, calif_final].every(grade => grade === null || (Number.isInteger(grade) && grade >= 0 && grade <= 10))) {
      return res.status(400).json({ error: "Invalid grade values" });
  }

  try {
      let checkQuery = "SELECT * FROM CALIFICACIONES WHERE matricula = ? AND id_materia = ?";
      let [existing] = await db.query(checkQuery, [matricula, id_materia]);

      if (existing.length > 0) {
          let updateQuery = `
              UPDATE CALIFICACIONES 
              SET calif_p1 = ?, calif_p2 = ?, calif_final = ?, ciclo_cursando = ? 
              WHERE matricula = ? AND id_materia = ?
          `;
          await db.query(updateQuery, [calif_p1, calif_p2, calif_final, ciclo_cursando, matricula, id_materia]);
      } else {
          let insertQuery = `
              INSERT INTO CALIFICACIONES (id_materia, matricula, calif_p1, calif_p2, calif_final, ciclo_cursando)
              VALUES (?, ?, ?, ?, ?, ?)
          `;
          await db.query(insertQuery, [id_materia, matricula, calif_p1, calif_p2, calif_final, ciclo_cursando]);
      }

      res.json({ success: true });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});