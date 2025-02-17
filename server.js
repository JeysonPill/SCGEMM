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

///////

// Administrative Staff Functions
async function loadStudentManagement() {
  try {
    const response = await fetch('http://192.168.18.11:3000/admin/students', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    const students = await response.json();
    
    const content = `
      <h3>Gestión de Estudiantes</h3>
      <button class="action-button" onclick="showAddStudentForm()">Agregar Estudiante</button>
      <table>
        <thead>
          <tr>
            <th>Matrícula</th>
            <th>Nombre</th>
            <th>Carrera</th>
            <th>Semestre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(student => `
            <tr>
              <td>${student.matricula}</td>
              <td>${student.nombre}</td>
              <td>${student.carrera}</td>
              <td>${student.semestre}</td>
              <td>
                <button class="action-button" onclick="editStudent('${student.matricula}')">Editar</button>
                <button class="action-button" onclick="assignSubjects('${student.matricula}')">Asignar Materias</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    document.getElementById('student-management').innerHTML = content;
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

async function loadProfessorManagement() {
  try {
    const response = await fetch('http://192.168.18.11:3000/admin/professors', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    const professors = await response.json();
    
    const content = `
      <h3>Gestión de Profesores</h3>
      <button class="action-button" onclick="showAddProfessorForm()">Agregar Profesor</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Departamento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${professors.map(professor => `
            <tr>
              <td>${professor.id_profesor}</td>
              <td>${professor.nombre}</td>
              <td>${professor.departamento}</td>
              <td>
                <button class="action-button" onclick="editProfessor('${professor.id_profesor}')">Editar</button>
                <button class="action-button" onclick="assignGroups('${professor.id_profesor}')">Asignar Grupos</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    document.getElementById('professor-management').innerHTML = content;
  } catch (error) {
    console.error('Error loading professors:', error);
  }
}

async function loadSubjectManagement() {
  try {
    const response = await fetch('http://192.168.18.11:3000/admin/subjects', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    const subjects = await response.json();
    
    const content = `
      <h3>Gestión de Materias</h3>
      <button class="action-button" onclick="showAddSubjectForm()">Agregar Materia</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Créditos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${subjects.map(subject => `
            <tr>
              <td>${subject.id_materia}</td>
              <td>${subject.nombre}</td>
              <td>${subject.creditos}</td>
              <td>
                <button class="action-button" onclick="editSubject('${subject.id_materia}')">Editar</button>
                <button class="action-button" onclick="manageGroups('${subject.id_materia}')">Gestionar Grupos</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    document.getElementById('subject-management').innerHTML = content;
  } catch (error) {
    console.error('Error loading subjects:', error);
  }
}

// Super Admin Functions
async function loadUserManagement() {
  try {
    const response = await fetch('http://192.168.18.11:3000/superadmin/users', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    const users = await response.json();
    
    const content = `
      <h3>Gestión de Usuarios</h3>
      <button class="action-button" onclick="showAddUserForm()">Agregar Usuario</button>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Rol</th>
            <th>ID Usuario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td>${user.user_name}</td>
              <td>${getRoleName(user.user_role)}</td>
              <td>${user.id_user}</td>
              <td>
                <button class="action-button" onclick="editUser('${user.id_user}')">Editar</button>
                <button class="action-button" onclick="resetPassword('${user.id_user}')">Reset Password</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    document.getElementById('user-management').innerHTML = content;
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Utility Functions
function getRoleName(roleId) {
  const roles = {
    '1': 'Estudiante',
    '2': 'Profesor',
    '3': 'Administrativo',
    '99': 'Super Admin'
  };
  return roles[roleId] || 'Desconocido';
}

// Form Management Functions
function showAddUserForm() {
  const form = `
    <div class="form-overlay">
      <div class="form-container">
        <h3>Agregar Usuario</h3>
        <form id="add-user-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required>
          </div>
          <div class="form-group">
            <label for="role">Rol</label>
            <select id="role" required>
              <option value="1">Estudiante</option>
              <option value="2">Profesor</option>
              <option value="3">Administrativo</option>
              <option value="99">Super Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label for="id_user">ID Usuario</label>
            <input type="text" id="id_user" required>
          </div>
          <button type="submit" class="action-button">Guardar</button>
          <button type="button" class="action-button" onclick="closeForm()">Cancelar</button>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', form);
  document.getElementById('add-user-form').addEventListener('submit', handleAddUser);
}

async function handleAddUser(e) {
  e.preventDefault();
  
  const userData = {
    user_name: document.getElementById('username').value,
    password: document.getElementById('password').value,
    user_role: document.getElementById('role').value,
    id_user: document.getElementById('id_user').value
  };
  
  try {
    const response = await fetch('http://192.168.18.11:3000/superadmin/user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      closeForm();
      loadUserManagement();
    } else {
      alert('Error adding user');
    }
  } catch (error) {
    console.error('Error adding user:', error);
    alert('Error adding user');
  }
}

function closeForm() {
  const overlay = document.querySelector('.form-overlay');
  if (overlay) {
    overlay.remove();
  }
}
