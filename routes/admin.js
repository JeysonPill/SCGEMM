// routes/admin.js
const express = require('express');
const router = express.Router();
//const db = require('../config/db'); 
const jwt = require('jsonwebtoken');


function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, 'aVeryStrongSecretKeyHere', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        if (user.user_role !== '3' && user.user_role !== '99') { 
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        req.user = user;
        next();
    });
}

router.use(authenticateAdmin); 

// --- Student Endpoints ---

router.get('/students', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT matricula, carrera, semestre, user_name, celular, email FROM ALUMNOS');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ message: 'Error fetching students.', error: err.message });
    }
});

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

router.delete('/students/:matricula', async (req, res) => {
    const { matricula } = req.params;
    try {
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

// --- Professor Endpoints ---

router.get('/professors', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id_profesor, nombre, celular, email FROM PROFESORES');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching professors:', err);
        res.status(500).json({ message: 'Error fetching professors.', error: err.message });
    }
});

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

router.delete('/professors/:id_profesor', async (req, res) => {
    const { id_profesor } = req.params;
    try {
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

// --- Subject Endpoints ---

router.get('/subjects', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id_materia, materia_nombre, sem_cursante FROM MATERIAS');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ message: 'Error fetching subjects.', error: err.message });
    }
});

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

router.delete('/subjects/:id_materia', async (req, res) => {
    const { id_materia } = req.params;
    try {
        await db.execute('DELETE FROM GRUPOSALUM WHERE id_materia = ?', [id_materia]);
        await db.execute('DELETE FROM CALIFICACIONES WHERE id_materia = ?', [id_materia]);
        await db.execute('DELETE FROM HORARIOS WHERE id_materia = ?', [id_materia]);
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

// --- Admin Grade Management Endpoints ---

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

router.get('/student-grades/:matricula/:id_materia', async (req, res) => {
    const { matricula, id_materia } = req.params;
    try {
        const currentCycle = "2025-1"; // IMPORTANT: You should get this dynamically, e.g., from system config or the request
        const [rows] = await db.execute(
            'SELECT calif_p1, calif_p2, calif_final, ciclo_cursando FROM CALIFICACIONES WHERE matricula = ? AND id_materia = ? AND ciclo_cursando = ?',
            [matricula, id_materia, currentCycle]
        );
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Calificaciones no encontradas.' });
        }
    } catch (err) {
        console.error('Error fetching student grades:', err);
        res.status(500).json({ message: 'Error fetching student grades.', error: err.message });
    }
});

router.post('/update-grades', async (req, res) => {
    const { matricula, id_materia, calif_p1, calif_p2, calif_final, ciclo_cursando } = req.body;

    if (!matricula || !id_materia || !ciclo_cursando) {
        return res.status(400).json({ message: 'Matrícula, ID de materia y ciclo cursando son requeridos.' });
    }

    try {
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

module.exports = router;