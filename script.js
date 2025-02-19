// Roles
const ROLES = {
    STUDENT: 1,
    PROFESSOR: 2,
    ADMIN_STAFF: 3,
    SUPER_ADMIN: 99
  };

  // cambia paginas
  function switchTab(tabId, element) {
    // Remove active class from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => { 
      tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // establece clase activa a la pagina actual
    element.classList.add('active');
    document.getElementById(tabId).classList.add('active');
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem('authToken');
    showUserRole(null);
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
  }

  // Login hanlder
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    try {
      const response = await fetch('http://192.168.18.11:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        errorMessage.textContent = '';
        showUserRole(data.user_role);
      } else {
        errorMessage.textContent = data.message || 'Login failed';
      }
    } catch (error) {
      errorMessage.textContent = 'Connection error. Please try again.';
      console.error('Login error:', error);
    }
  });

  // display por roles
  function showUserRole(role) {
    document.querySelectorAll('.content-section').forEach(section => {
      section.style.display = 'none';
    });

    switch (parseInt(role)) {
      case ROLES.SUPER_ADMIN:
        document.getElementById('super-admin-content').style.display = 'block';
        break;
      case ROLES.PROFESSOR:
        document.getElementById('professor-content').style.display = 'block';
        break;
      case ROLES.STUDENT:
        document.getElementById('student-content').style.display = 'block';
        break;
      case ROLES.ADMIN_STAFF:
        document.getElementById('admin-staff-content').style.display = 'block';
        break;
      default:
        document.getElementById('login-content').style.display = 'block';
    }
  }

  // 
  window.addEventListener('load', () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        showUserRole(payload.user_role);
      } catch (error) {
        localStorage.removeItem('authToken');
        showUserRole(null);
      }
    } else {
      showUserRole(null);
    }
  });



  ///////////////////tabla estudiantes/////////////
  async function loadStudents() {
  const token = localStorage.getItem("token"); // Usa el token de autenticación almacenado
  const response = await fetch("http://192.168.18.11:3000/student/tabla-datos-estudiante", {
      headers: { "Authorization": `Bearer ${token}` }
  });
  
  if (!response.ok) {
      console.error("Error al obtener los estudiantes");
      return;
  }

  const students = await response.json();
  const tbody = document.querySelector("#subjects-table tbody");
  tbody.innerHTML = "";

  students.forEach(student => {
      const row = `<tr>
          <td>${student.matricula}</td>
          <td>${student.nombre}</td>
          <td>${student.carrera}</td>
          <td>${student.semestre}</td>
      </tr>`;
      tbody.innerHTML += row;
  });
}

loadStudents();