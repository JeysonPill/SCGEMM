const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const qr = require('qrcode');
const path = require('path');

const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);


const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
  host: '192.168.100.20',
  user: 'node_user',
  password: 'Zapatitoblanco123***',
  database: 'SCGEM',
});

const ROLES = {
  STUDENT: '1',
  PROFESSOR: '2',
  ADMIN_STAFF: '3',
  SUPER_ADMIN: '99'
};

// Middleware de autenticación (puede definirse aquí o en un archivo separado)
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Se requiere autenticación' });

  jwt.verify(token, 'aVeryStrongSecretKeyHere', (err, user) => { // Asegúrate de que esta clave secreta sea la misma que usas al firmar el token en el login
    if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

/*const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication required' });


  jwt.verify(token, 'aVeryStrongSecretKeyHere', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });

};*/

// CORRECTO: Registra las rutas de administrador DESPUÉS de que 'app' esté definida y 'adminRoutes' importada
app.use('/admin', adminRoutes); // Esto prefija correctamente todas las rutas en adminRoutes con /admin

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.user_role)) {  return res.status(403).json({ message: 'Access denied' });  }
    next();
  };
};

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM USUARIOS WHERE user_name = ?;', [username], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (result.length === 0 || result[0].password !== password) return res.status(401).json({ message: 'Invalid credentials' });
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
    MATERIAS.materia_nombre AS materia_nombre,
    PROFESORES.nombre AS profesor_nombre,
    CONCAT(
        IF(h_lunes IS NOT NULL AND h_lunes != '', CONCAT('Lunes: ', h_lunes, '<br>'), ''),
        IF(h_martes IS NOT NULL AND h_martes != '', CONCAT('Martes: ', h_martes, '<br>'), ''),
        IF(h_miercoles IS NOT NULL AND h_miercoles != '', CONCAT('Miércoles: ', h_miercoles, '<br>'), ''),
        IF(h_jueves IS NOT NULL AND h_jueves != '', CONCAT('Jueves: ', h_jueves, '<br>'), ''),
        IF(h_viernes IS NOT NULL AND h_viernes != '', CONCAT('Viernes: ', h_viernes), '')
    ) AS horarios,
    GRUPOSALUM.id_grupo
    FROM MATERIAS
    JOIN HORARIOS ON MATERIAS.id_materia = HORARIOS.id_materia
    JOIN PROFESORES ON HORARIOS.id_profesor = PROFESORES.id_profesor
    JOIN GRUPOSALUM ON GRUPOSALUM.id_materia = MATERIAS.id_materia AND GRUPOSALUM.id_grupo = HORARIOS.id_grupo
    JOIN ALUMNOS ON GRUPOSALUM.matricula_alumno = ALUMNOS.matricula
    WHERE ALUMNOS.matricula = 'A0001';
  `;
  db.query(query, [req.user.user_matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    console.log(results);
    res.json(results);
  });
});
/////////////////       CALIFICACIONES       ///////////////////////////////////////
app.get('/student/tabla-calificaciones/', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      m.materia_nombre as materia,
      c.calif_p1,
      c.calif_p2,
      c.calif_final,
      ROUND((CAST(c.calif_p1 AS DECIMAL) + CAST(c.calif_p2 AS DECIMAL) + CAST(c.calif_final AS DECIMAL)) / 3, 2) as promedio,
      c.ciclo_cursando
    FROM CALIFICACIONES c
    JOIN MATERIAS m ON c.id_materia = m.id_materia
    WHERE c.matricula = ? AND c.ciclo_cursando = '2025-1';
  `;
  db.query(query, [req.user.user_matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

/////////////////////
// GET All Students
router.get('/students', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT matricula, carrera, semestre, user_name, celular, email FROM ALUMNOS');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ message: 'Error fetching students.', error: err.message });
    }
});

// POST Add New Student
router.post('/students', async (req, res) => {
    const { matricula, user_name, carrera, semestre, celular, email } = req.body;
    if (!matricula || !user_name || !carrera || !semestre || !celular || !email) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        await db.execute(
            'INSERT INTO ALUMNOS (matricula, user_name, carrera, semestre, celular, email) VALUES (?, ?, ?, ?, ?, ?)',
            [matricula, user_name, carrera, semestre, celular, email]
        );
        res.status(201).json({ message: 'Estudiante agregado exitosamente.' });
    } catch (err) {
        console.error('Error adding student:', err);
        if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'La matrícula, celular o email ya existen.' });
        }
        res.status(500).json({ message: 'Error al agregar estudiante.', error: err.message });
    }
});

// PUT Update Student
router.put('/students/:matricula', async (req, res) => {
    const { matricula } = req.params;
    const { user_name, carrera, semestre, celular, email } = req.body;
    if (!user_name || !carrera || !semestre || !celular || !email) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        const [result] = await db.execute(
            'UPDATE ALUMNOS SET user_name = ?, carrera = ?, semestre = ?, celular = ?, email = ? WHERE matricula = ?',
            [user_name, carrera, semestre, celular, email, matricula]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Estudiante no encontrado.' });
        }
        res.json({ message: 'Estudiante actualizado exitosamente.' });
    } catch (err) {
        console.error('Error updating student:', err);
         if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'El celular o email ya existen para otro estudiante.' });
        }
        res.status(500).json({ message: 'Error al actualizar estudiante.', error: err.message });
    }
});

// DELETE Student
router.delete('/students/:matricula', async (req, res) => {
    const { matricula } = req.params;
    try {
        // Consider deleting related records from GRUPOSALUM, CALIFICACIONES, PAGOS, ASISTENCIA first
        await db.execute('DELETE FROM GRUPOSALUM WHERE matricula_alumno = ?', [matricula]);
        await db.execute('DELETE FROM CALIFICACIONES WHERE matricula = ?', [matricula]);
        await db.execute('DELETE FROM PAGOS WHERE matricula = ?', [matricula]);
        await db.execute('DELETE FROM ASISTENCIA WHERE matricula = ?', [matricula]);
        const [result] = await db.execute('DELETE FROM ALUMNOS WHERE matricula = ?', [matricula]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Estudiante no encontrado.' });
        }
        res.json({ message: 'Estudiante y datos relacionados eliminados exitosamente.' });
    } catch (err) {
        console.error('Error deleting student:', err);
        res.status(500).json({ message: 'Error al eliminar estudiante.', error: err.message });
    }
});
/////////////////////


/////////////////       KARDEZ       ///////////////////////////////////////
app.get('/student/tabla-kardez/', authenticateToken, (req, res) => {
  const query = `
 SELECT 
    m.materia_nombre AS materia,
    c.ciclo_cursando AS periodo,
    ROUND((CAST(c.calif_p1 AS DECIMAL) + CAST(c.calif_p2 AS DECIMAL) + CAST(c.calif_final AS DECIMAL)) / 3, 2) AS calif_final,
    CASE 
        WHEN ROUND((CAST(c.calif_p1 AS DECIMAL) + CAST(c.calif_p2 AS DECIMAL) + CAST(c.calif_final AS DECIMAL)) / 3, 2) > 7 
        THEN 'Aprobado' 
        ELSE 'Reprobado' 
    END AS estado
FROM CALIFICACIONES c
JOIN MATERIAS m ON c.id_materia = m.id_materia
WHERE c.matricula = 'A0001';
`;
  db.query(query, [req.user.user_matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    console.log(results);
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
  if (!codigo_asistencia)
    return res.status(400).json({ success: false, message: "Código de asistencia requerido" });

  const query = ` INSERT INTO ASISTENCIA (matricula, codigo, asistencia) VALUES (?, ?, NOW()); `;
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
///////////////CALENDARIO DE MATERIAS A IMPARTIR
app.get('/professor/schedule/', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      M.materia_nombre AS materia_nombre,
      H.id_grupo,
      CONCAT (
    IF(h_lunes IS NOT NULL AND h_lunes != '', CONCAT('Lunes: ', h_lunes, '<br>'), ''),
    IF(h_martes IS NOT NULL AND h_martes != '', CONCAT('Martes: ', h_martes, '<br>'), ''),
    IF(h_miercoles IS NOT NULL AND h_miercoles != '', CONCAT('Miércoles: ', h_miercoles, '<br>'), ''),
    IF(h_jueves IS NOT NULL AND h_jueves != '', CONCAT('Jueves: ', h_jueves, '<br>'), ''),
    IF(h_viernes IS NOT NULL AND h_viernes != '', CONCAT('Viernes: ', h_viernes), '')
  ) AS horarios
    FROM HORARIOS H
    JOIN MATERIAS M ON M.id_materia = H.id_materia
    JOIN PROFESORES P ON P.id_profesor = H.id_profesor
    WHERE P.id_profesor = 'P0001';
  `;
  console.log("matre", req.user.user_matricula);
  db.query(query, [req.user.user_matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    console.log(results);
    res.json(results);
  });
});
///////////////////////////////////////////////////////
// --- Professor Endpoints ---

// GET All Professors
router.get('/professors', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id_profesor, nombre, celular, email FROM PROFESORES');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching professors:', err);
        res.status(500).json({ message: 'Error fetching professors.', error: err.message });
    }
});

// POST Add New Professor
router.post('/professors', async (req, res) => {
    const { id_profesor, nombre, celular, email } = req.body;
    if (!id_profesor || !nombre || !celular || !email) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        await db.execute(
            'INSERT INTO PROFESORES (id_profesor, nombre, celular, email) VALUES (?, ?, ?, ?)',
            [id_profesor, nombre, celular, email]
        );
        res.status(201).json({ message: 'Profesor agregado exitosamente.' });
    } catch (err) {
        console.error('Error adding professor:', err);
        if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'El ID de profesor, celular o email ya existen.' });
        }
        res.status(500).json({ message: 'Error al agregar profesor.', error: err.message });
    }
});

// PUT Update Professor
router.put('/professors/:id_profesor', async (req, res) => {
    const { id_profesor } = req.params;
    const { nombre, celular, email } = req.body;
    if (!nombre || !celular || !email) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        const [result] = await db.execute(
            'UPDATE PROFESORES SET nombre = ?, celular = ?, email = ? WHERE id_profesor = ?',
            [nombre, celular, email, id_profesor]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Profesor no encontrado.' });
        }
        res.json({ message: 'Profesor actualizado exitosamente.' });
    } catch (err) {
        console.error('Error updating professor:', err);
        if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'El celular o email ya existen para otro profesor.' });
        }
        res.status(500).json({ message: 'Error al actualizar profesor.', error: err.message });
    }
});

// DELETE Professor
router.delete('/professors/:id_profesor', async (req, res) => {
    const { id_profesor } = req.params;
    try {
        // Consider deleting related records from MATERIASPROF, HORARIOS first
        await db.execute('DELETE FROM MATERIASPROF WHERE id_profesor = ?', [id_profesor]);
        await db.execute('DELETE FROM HORARIOS WHERE id_profesor = ?', [id_profesor]);
        const [result] = await db.execute('DELETE FROM PROFESORES WHERE id_profesor = ?', [id_profesor]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Profesor no encontrado.' });
        }
        res.json({ message: 'Profesor y datos relacionados eliminados exitosamente.' });
    } catch (err) {
        console.error('Error deleting professor:', err);
        res.status(500).json({ message: 'Error al eliminar profesor.', error: err.message });
    }
});
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// QR ASISTENCIA //////////////////////////////////////////////////////////////////
app.get('/professor/QR_CODE_GEN/', authenticateToken, (req, res) => {
  const query = `
    SELECT 
    HORARIOS.id_materia,
    MATERIAS.materia_nombre,
    HORARIOS.id_grupo
FROM HORARIOS
JOIN MATERIAS ON HORARIOS.id_materia = MATERIAS.id_materia
WHERE HORARIOS.id_profesor = ?;
  `;
  console.log("matricula del profesor:", req.user.user_matricula);
  db.query(query, [req.user.user_matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    console.log(results);
    res.json(results);
  });
});
///////////////////       CALIFICAICONES /////////////////////////
app.get('/professor/getSubjects', authenticateToken, (req, res) => {
const query = `
    SELECT DISTINCT
    GRUPOSALUM.id_materia,
    MATERIAS.materia_nombre,
    GRUPOSALUM.id_grupo
FROM MATERIAS
JOIN GRUPOSALUM ON MATERIAS.id_materia = GRUPOSALUM.id_materia
JOIN MATERIASPROF ON GRUPOSALUM.id_grupo = MATERIASPROF.id_grupo
JOIN PROFESORES ON MATERIASPROF.id_profesor = PROFESORES.id_profesor
WHERE PROFESORES.id_profesor = ?;
  `;
  db.query(query, [req.user.user_matricula], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    console.log(results);
    res.json(results);
  });
});


app.get('/professor/getStudents', async (req, res) => {
  const { id_materia, id_grupo } = req.query;
 console.log("Received:", id_materia, id_grupo);
 
  const query = `
    SELECT 
      A.matricula, A.user_name, C.calif_p1, C.calif_p2, C.calif_final
    FROM ALUMNOS A
    JOIN GRUPOSALUM G ON A.matricula = G.matricula_alumno
    LEFT JOIN CALIFICACIONES C ON A.matricula = C.matricula AND G.id_materia = C.id_materia
    WHERE G.id_materia = ? AND G.id_grupo = ?;
  `;
  db.query(query, [id_materia, id_grupo], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});


// --- Endpoint existente para guardar calificaciones del profesor (Mantén este, pero nota el prefijo 'professor') ---
app.post('/professor/saveGrade', authenticateToken, async (req, res) => {
    // Asegúrate de que el usuario autenticado sea un profesor
    if (req.user.user_role !== ROLES.PROFESSOR) {
        return res.status(403).json({ message: 'Acceso denegado. Se requieren privilegios de profesor.' });
    }

    const { matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando } = req.body;

    if (!matricula || !id_materia || !ciclo_cursando) {
        return res.status(400).json({ message: 'Matrícula, ID de materia y ciclo cursando son requeridos.' });
    }

    try {
        // Usa un enfoque UPSERT (INSERT ... ON DUPLICATE KEY UPDATE)
        const [result] = await db.execute(`
            INSERT INTO CALIFICACIONES (matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                calif_p1 = VALUES(calif_p1),
                calif_p2 = VALUES(calif_p2),
                calif_final = VALUES(calif_final),
                ciclo_cursando = VALUES(ciclo_cursando)
        `, [matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando]);

        if (result.affectedRows > 0) {
            res.json({ message: 'Calificaciones actualizadas/insertadas exitosamente.' });
        } else {
            res.status(500).json({ message: 'No se pudo actualizar/insertar las calificaciones.' });
        }
    } catch (err) {
        console.error('Error al actualizar/insertar calificaciones:', err);
        res.status(500).json({ message: 'Error al actualizar calificaciones.', error: err.message });
    }
});

////////////////////Materias
// --- Subject Endpoints ---

// GET All Subjects
router.get('/subjects', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id_materia, materia_nombre, sem_cursante FROM MATERIAS');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ message: 'Error fetching subjects.', error: err.message });
    }
});

// POST Add New Subject
router.post('/subjects', async (req, res) => {
    const { id_materia, materia_nombre, sem_cursante } = req.body;
    if (!id_materia || !materia_nombre || !sem_cursante) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        await db.execute(
            'INSERT INTO MATERIAS (id_materia, materia_nombre, sem_cursante) VALUES (?, ?, ?)',
            [id_materia, materia_nombre, sem_cursante]
        );
        res.status(201).json({ message: 'Materia agregada exitosamente.' });
    } catch (err) {
        console.error('Error adding subject:', err);
        if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'El ID de materia ya existe.' });
        }
        res.status(500).json({ message: 'Error al agregar materia.', error: err.message });
    }
});

// PUT Update Subject
router.put('/subjects/:id_materia', async (req, res) => {
    const { id_materia } = req.params;
    const { materia_nombre, sem_cursante } = req.body;
    if (!materia_nombre || !sem_cursante) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        const [result] = await db.execute(
            'UPDATE MATERIAS SET materia_nombre = ?, sem_cursante = ? WHERE id_materia = ?',
            [materia_nombre, sem_cursante, id_materia]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Materia no encontrada.' });
        }
        res.json({ message: 'Materia actualizada exitosamente.' });
    } catch (err) {
        console.error('Error updating subject:', err);
        res.status(500).json({ message: 'Error al actualizar materia.', error: err.message });
    }
});

// DELETE Subject
router.delete('/subjects/:id_materia', async (req, res) => {
    const { id_materia } = req.params;
    try {
        // Delete related records from GRUPOSALUM, CALIFICACIONES, HORARIOS, MATERIASPROF
        await db.execute('DELETE FROM GRUPOSALUM WHERE id_materia = ?', [id_materia]);
        await db.execute('DELETE FROM CALIFICACIONES WHERE id_materia = ?', [id_materia]);
        await db.execute('DELETE FROM HORARIOS WHERE id_materia = ?', [id_materia]);
        // Note: MATERIASPROF is related to id_grupo, not id_materia directly in your schema.
        // If a subject is deleted, you might want to ensure groups linked to it are also handled.
        const [result] = await db.execute('DELETE FROM MATERIAS WHERE id_materia = ?', [id_materia]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Materia no encontrada.' });
        }
        res.json({ message: 'Materia y datos relacionados eliminados exitosamente.' });
    } catch (err) {
        console.error('Error deleting subject:', err);
        res.status(500).json({ message: 'Error al eliminar materia.', error: err.message });
    }
});
////////////////////

// --- Admin Grade Management Endpoints ---

// GET student's enrolled subjects for grade management modal dropdown
router.get('/student-subjects/:matricula', async (req, res) => {
    const { matricula } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT DISTINCT m.id_materia, m.materia_nombre
            FROM MATERIAS m
            JOIN GRUPOSALUM ga ON m.id_materia = ga.id_materia
            WHERE ga.matricula_alumno = ?
        `, [matricula]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching student subjects:', err);
        res.status(500).json({ message: 'Error fetching student subjects.', error: err.message });
    }
});

// GET specific student's grades for a specific subject
router.get('/student-grades/:matricula/:id_materia', async (req, res) => {
    const { matricula, id_materia } = req.params;
    try {
        // Fetch current cycle for the student, or use a default
        const currentCycle = "2025-1"; // You might fetch this dynamically from system config or student's enrollment
        const [rows] = await db.execute(
            'SELECT calif_p1, calif_p2, calif_final, ciclo_cursando FROM CALIFICACIONES WHERE matricula = ? AND id_materia = ? AND ciclo_cursando = ?',
            [matricula, id_materia, currentCycle]
        );
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'No grades found for this subject and student in the current cycle.' });
        }
    } catch (err) {
        console.error('Error fetching student grades:', err);
        res.status(500).json({ message: 'Error fetching student grades.', error: err.message });
    }
});


// POST/PUT (UPSERT) Update Student Grades
router.post('/update-grades', async (req, res) => {
    const { matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando } = req.body;

    if (!matricula || !id_materia || !ciclo_cursando) {
        return res.status(400).json({ message: 'Matrícula, ID de materia y ciclo cursando son requeridos.' });
    }

    try {
        // Use an UPSERT approach (INSERT ... ON DUPLICATE KEY UPDATE)
        const [result] = await db.execute(`
            INSERT INTO CALIFICACIONES (matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                calif_p1 = VALUES(calif_p1),
                calif_p2 = VALUES(calif_p2),
                calif_final = VALUES(calif_final),
                ciclo_cursando = VALUES(ciclo_cursando)
        `, [matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando]);

        if (result.affectedRows > 0) {
            res.json({ message: 'Calificaciones actualizadas/insertadas exitosamente.' });
        } else {
            res.status(500).json({ message: 'No se pudo actualizar/insertar las calificaciones.' });
        }
    } catch (err) {
        console.error('Error updating/inserting grades:', err);
        res.status(500).json({ message: 'Error al actualizar calificaciones.', error: err.message });
    }
});

////////////////////////////////////////////////////


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});