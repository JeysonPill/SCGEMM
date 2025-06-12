// Roles
const ROLES = {
    STUDENT: 1,
    PROFESSOR: 2,
    ADMIN_STAFF: 3,
    SUPER_ADMIN: 99
};

function getBackendIP() {
    let backendIP = localStorage.getItem('backendIP');
    backendIP = "192.168.100.20";
    if (backendIP) {
        localStorage.setItem('backendIP', backendIP);
    } else {
        alert("Backend IP is required!");
        return null;
    } return backendIP;
}

var backendIP = getBackendIP();


// cambia paginas
function switchTab(tabId, element) {
    // Remove active class from all tabs and tab content
    document.querySelectorAll('.nav-link').forEach(tab => { tab.classList.remove('active'); }); // Corrected selector for Bootstrap nav-pills
    // Bootstrap handles tab content activation with data-toggle="pill" and href, so direct content class manipulation might not be needed if using Bootstrap's JS.
    // However, keeping for explicit control if needed.
    document.querySelectorAll('.tab-pane').forEach(content => { content.classList.remove('show', 'active'); }); // Corrected selector for Bootstrap tab-pane

    // Set active class to the current tab and content
    element.classList.add('active');
    document.getElementById(tabId).classList.add('show', 'active'); // Bootstrap requires 'show' and 'active' for fading tabs

    // Switch to the appropriate tab content
    try {
        switch (tabId) {
            case 'enrolled-subjects': loadSubjects(); break;
            case 'grades': loadGrades(); break;
            case 'kardex': loadKardez(); break;
            case 'payments': loadPagos(); break;
            case 'attendance': initializeAttendance(); break;
            case 'teaching-schedule': loadSubjectsProf(); break;
            case 'attendance-qr': QR_CODE_GEN(); break;
            case 'profesor_grade_entry': fetchSubjects(); break;
            // Admin and Super Admin tabs will need their respective load functions
            // For now, these are placeholders. Actual data loading functions would be added here.
            case 'student-management': console.log('Loading student management...'); break;
            case 'professor-management': console.log('Loading professor management...'); break;
            case 'subject-management': console.log('Loading subject management...'); break;
            case 'reports': console.log('Loading reports...'); break;
            case 'payments-admin': console.log('Loading admin payments...'); break;
            case 'attendance-admin': console.log('Loading admin attendance...'); break;
            case 'user-management': console.log('Loading user management...'); break;
            case 'system-config': console.log('Loading system configuration...'); break;
            case 'system-logs': console.log('Loading system logs...'); break;
            default: console.warn(`No handler for tabId: ${tabId}`);
        }
    } catch (error) {
        console.error(`Error loading content for tab ${tabId}:`, error);
    }
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
        let ip = backendIP;
        console.log(backendIP);
        const response = await fetch(`http://${backendIP}:3000/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            errorMessage.textContent = '';
            showUserRole(data.user_role);
        } else { errorMessage.textContent = data.message || 'Login failed'; }
    } catch (error) {
        errorMessage.textContent = 'Connection error. Please try again.';
        console.error('Login error:', error);
    }

});

// display por roles
function showUserRole(role) {
    document.querySelectorAll('.content-section').forEach(section => { section.style.display = 'none'; });

    switch (parseInt(role)) {
        case ROLES.SUPER_ADMIN: document.getElementById('super-admin-content').style.display = 'block'; break;
        case ROLES.PROFESSOR: document.getElementById('professor-content').style.display = 'block'; break;
        case ROLES.STUDENT: document.getElementById('student-content').style.display = 'block'; break;
        case ROLES.ADMIN_STAFF: document.getElementById('admin-staff-content').style.display = 'block'; break;
        default: document.getElementById('login-content').style.display = 'block';
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
    } else { showUserRole(null); }
});



///////////////////////////////////////////////////////       ESTUDIANTES       ////////////////////////////////////////////////////////////////////////////////

/////////////////       MATERIAS       ////////////////////////////////////////////
async function loadSubjects() {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`http://${backendIP}:3000/student/tabla-datos-estudiante/`, { headers: { "Authorization": `Bearer ${token}` } });
    console.log("Token:", localStorage.getItem("authToken"));

    if (!response.ok) {
        console.error("Error al obtener las materias");
        return;
    }

    const subjects = await response.json();
    const tbody = document.getElementById("subjects-table");
    tbody.innerHTML = "";

    subjects.forEach(subject => {
        const row = `<tr>
        <td>${subject.materia_nombre}</td>
        <td>${subject.profesor_nombre}</td>
        <td>${subject.horarios}</td>
        <td>${subject.id_grupo}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

/////////////////       CALIFICACIONES       ////////////////////////////////////////////
async function loadGrades() {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`http://${backendIP}:3000/student/tabla-calificaciones/`, { headers: { "Authorization": `Bearer ${token}` } });;

    if (!response.ok) {
        console.error("Error al obtener las materias");
        return;
    }

    const subjects = await response.json();
    const tbody = document.getElementById("grades-table");
    tbody.innerHTML = "";

    subjects.forEach(subject => {
        const row = `<tr>
        <td>${subject.materia}</td>
        <td>${subject.calif_p1}</td>
        <td>${subject.calif_p2}</td>
        <td>${subject.calif_final}</td>
        <td>${subject.promedio}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

/////////////////       KARDEZ       ////////////////////////////////////////////
async function loadKardez() {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`http://${backendIP}:3000/student/tabla-kardez/`, { headers: { "Authorization": `Bearer ${token}` } });;

    if (!response.ok) {
        console.error("Error al obtener las materias");
        return;
    }

    const subjects = await response.json();
    const tbody = document.getElementById("kardex-table");
    tbody.innerHTML = "";

    subjects.forEach(subject => {
        const row = `<tr>
        <td>${subject.materia}</td>
        <td>${subject.periodo}</td>
        <td>${subject.calif_final}</td>
        <td>${subject.estado}</td>
    </tr>`;
        tbody.innerHTML += row;
    });
}

/////////////////       PAGOS       ////////////////////////////////////////////
async function loadPagos() {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`http://${backendIP}:3000/student/tabla-pagos/`, { headers: { "Authorization": `Bearer ${token}` } });;

    if (!response.ok) {
        console.error("Error al obtener las materias");
        return;
    }

    const subjects = await response.json();
    const tbody = document.getElementById("payments-table");
    tbody.innerHTML = "";

    subjects.forEach(subject => {
        const row = `<tr>
        <td>${subject.MES}</td>
        <td>${subject.CANTIDAD}</td>
        <td>${subject.FECHA_CORTE}</td>
        <td>${subject.ESTADO}</td>
        <td>${subject.ACCION}</td>
    </tr>`;
        tbody.innerHTML += row;
    });
}

/////////////////       ASISTENCIAS       ////////////////////////////////////////////

async function initializeAttendance() {
    console.log("Initializing attendance section");
    const attendanceInput = document.getElementById("attendance-code");
    if (attendanceInput) {
        attendanceInput.value = "";
        attendanceInput.focus(); // Optional: focus on the input field
    }
}


function submitAttendance() {
    const token = localStorage.getItem("authToken");
    const attendanceCode = document.getElementById("attendance-code").value.trim();

    if (!attendanceCode) {
        alert("Por favor, ingresa un código de asistencia.");
        return;
    }

    fetch(`http://${backendIP}:3000/student/registro-asistencias/`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ codigo_asistencia: attendanceCode })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Asistencia registrada exitosamente.");
            } else {
                alert("Error al registrar asistencia: " + data.message);
            }
        })
        .catch(error => {
            console.log("Error:", error);
            alert("Error al conectar con el servidor.");
        });
}




/////////////////////////////////////////////////////////////       PROFESORES       ////////////////////////////////////////////////////////////////////////////////

async function loadSubjectsProf() {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`http://${backendIP}:3000/professor/schedule/`, { headers: { "Authorization": `Bearer ${token}` } });
    console.log("Token:", localStorage.getItem("authToken"));

    if (!response.ok) {
        console.error("Error al obtener las materias");
        return;
    }

    const subjects = await response.json();
    console.log("retorno", subjects);
    const tbody = document.getElementById("schedule-table");
    tbody.innerHTML = "";

    subjects.forEach(subject => {
        const row = `<tr>
        <td>${subject.materia_nombre}</td>
        <td>${subject.id_grupo}</td>
        <td>${subject.horarios}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}


///////////////////////////////////////////QR/////////////////////////////////
function fallbackHash(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) { hash = (hash * 31 + seed.charCodeAt(i)) >>> 0; }
    return hash;
}

function base62Encode(num, length = 10) {
    const base62chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let encoded = "";
    while (encoded.length < length) {
        encoded = base62chars[num % 62] + encoded;
        num = Math.floor(num / 62);
    }
    return encoded;
}

function generateShortCode(seed) {
    const numericHash = fallbackHash(seed);
    return base62Encode(numericHash);
}

async function QR_CODE_GEN() {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`http://${backendIP}:3000/professor/QR_CODE_GEN/`, { headers: { "Authorization": `Bearer ${token}` } });
    console.log("Token:", localStorage.getItem("authToken"));

    if (!response.ok) {
        console.error("Error al obtener las materias");
        return;
    }

    const subjects = await response.json();
    console.log("retorno", subjects);

    const selectElement = document.getElementById("qr_subject_select");
    selectElement.innerHTML = "<option value=''>Seleccione una materia</option>"; // Reset dropdown

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = `${subject.materia_nombre}-${subject.id_grupo}`; // Combine id_materia and id_grupo as value
        option.textContent = `${subject.materia_nombre}-${subject.id_grupo}`; // Show the name and group
        selectElement.appendChild(option);
    });
}

document.getElementById("qr_subject_select").addEventListener("change", function () {
    const selectedValue = this.value;
    if (selectedValue) {
        const [idMateria, idGrupo] = selectedValue.split("-");
        const seed = `${idMateria}-${idGrupo}`;
        const code = generateShortCode(seed);
        console.log("Generated code:", code);
        generateQRCode(code);
    }
});




function generateQRCode(data) {
    const qrDisplay = document.getElementById("qr-display");
    qrDisplay.innerHTML = "";

    new QRCode(qrDisplay, {
        text: data,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

}


/////////////////CALIFICACIONES/////////////////////////////////
let currentSubjectInfo = null;

async function fetchSubjects() {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`http://${backendIP}:3000/professor/getSubjects/`, { headers: { "Authorization": `Bearer ${token}` } });
    console.log("Token:", localStorage.getItem("authToken"));

    if (!response.ok) {
        console.error("Error al obtener las materias");
        return;
    }

    const subjects = await response.json();
    console.log("retorno", subjects);

    const selectElement = document.getElementById("professor_grade_subject_select");
    selectElement.innerHTML = "<option value=''>Seleccione una materia</option>";

    const newSelectElement = selectElement.cloneNode(true);
    selectElement.parentNode.replaceChild(newSelectElement, selectElement);

    subjects.forEach(subject => {
        console.log("aaaa");
        const option = document.createElement("option");
        option.value = `${subject.id_materia}-${subject.id_grupo}-${subject.materia_nombre}`;
        option.textContent = `${subject.id_materia}-${subject.id_grupo}-${subject.materia_nombre}`;
        newSelectElement.appendChild(option);
    });

    newSelectElement.addEventListener("change", async function () {
        const selected = this.value;
        if (!selected) return;

        const [id_materia, id_grupo, materia_nombre] = selected.split("-");

        currentSubjectInfo = {
            id_materia: id_materia,
            id_grupo: id_grupo,
            materia_nombre: materia_nombre
        };

        console.log("idmateria" + id_materia + "idgrupo" + id_grupo);
        const response = await fetch(`http://${backendIP}:3000/professor/getStudents?id_materia=${id_materia}&id_grupo=${id_grupo}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error("Error al obtener los estudiantes");
            return;
        }

        const students = await response.json();
        console.log("Estudiantes:", students);
        populateStudentGradeTable(students);
    });
}

async function populateStudentGradeTable(students) {
    console.log("ENTRANDO A LA SECCION DE RELLENAR TABLA");
    const tbody = document.getElementById("profesor_grade_entry_table");
    tbody.innerHTML = "";

    students.forEach(student => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${student.user_name}</td>
            <td><input type="number" value="${student.calif_p1 ?? ''}" data-field="calif_p1" data-id="${student.matricula}" class="form-control form-control-sm" step="0.1" min="0" max="10" /></td>
            <td><input type="number" value="${student.calif_p2 ?? ''}" data-field="calif_p2" data-id="${student.matricula}" class="form-control form-control-sm" step="0.1" min="0" max="10" /></td>
            <td><input type="number" value="${student.calif_final ?? ''}" data-field="calif_final" data-id="${student.matricula}" class="form-control form-control-sm" step="0.1" min="0" max="10" /></td>
            <td><button class="btn btn-sm btn-outline-primary save-grade-btn" data-matricula="${student.matricula}" onclick="saveGrade('${student.matricula}')">Guardar</button></td>
        `;
        tbody.appendChild(row);
    });
}

async function saveGrade(matricula) {
    console.log("Saving grade for matricula:", matricula);

    if (!currentSubjectInfo) {
        alert("Error: No se ha seleccionado una materia");
        return;
    }

    const button = document.querySelector(`button[data-matricula="${matricula}"]`);
    const row = button.closest("tr");

    const calif_p1_input = row.querySelector('input[data-field="calif_p1"]');
    const calif_p2_input = row.querySelector('input[data-field="calif_p2"]');
    const calif_final_input = row.querySelector('input[data-field="calif_final"]');

    const data = {
        id_materia: currentSubjectInfo.id_materia,
        matricula: matricula,
        calif_p1: calif_p1_input.value || null,
        calif_p2: calif_p2_input.value || null,
        calif_final: calif_final_input.value || null,
        ciclo_cursando: "2025-1"
    };

    console.log("Data to send:", data);

    try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`http://${backendIP}:3000/professor/saveGrade`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }, body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Server response:", result);
        alert(result.message || "Calificación guardada exitosamente");

        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-success');
        button.textContent = "Guardado";
        setTimeout(() => {
            button.classList.remove('btn-success');
            button.classList.add('btn-outline-primary');
            button.textContent = "Guardar";
        }, 2000);

    } catch (error) {
        console.error("Error al guardar la calificación:", error);
        alert("Error al guardar la calificación: " + error.message);
    }
}
<script src="https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js"></script>