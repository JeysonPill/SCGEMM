USE SCGEM;
-- ALUMNOS
INSERT INTO ALUMNOS (matricula, carrera, semestre, user_name, celular, email)
VALUES 
('A0001', 'Ingeniería en Sistemas', '3', 'juanito', '5551234567', 'juanito@correo.com'),
('A0002', 'Administración', '2', 'maria_g', '5559876543', 'maria@correo.com');

-- PROFESORES
INSERT INTO PROFESORES (id_profesor, nombre, celular, email)
VALUES
('P0001', 'Carlos López', '5551112222', 'carlos@correo.com'),
('P0002', 'Ana Torres', '5553334444', 'ana@correo.com');

-- MATERIAS
INSERT INTO MATERIAS (id_materia, materia_nombre, sem_cursante)
VALUES 
('MAT101', 'Matemáticas I', '1'),
('PROG102', 'Programación II', '3');

-- GRUPOSALUM
INSERT INTO GRUPOSALUM (id_materia, matricula_alumno, id_grupo)
VALUES
('MAT101', 'A0001', 'G01'),
('PROG102', 'A0001', 'G02'),
('MAT101', 'A0002', 'G01');

-- MATERIASPROF
INSERT INTO MATERIASPROF (id_profesor, id_grupo)
VALUES
('P0001', 'G01'),
('P0002', 'G02');

-- USUARIOS
INSERT INTO USUARIOS (user_name, password, id_user, user_role)
VALUES
('juanito', 'hashedpass123', 'A0001', '1'),
('maria_g', 'hashedpass234', 'A0002', '1'),
('carloslp', 'hashedpass345', 'P0001', '2'),
('ana_t', 'hashedpass456', 'P0002', '2'),
('admin', 'supersecure999', 'AD001', '3'),
('root', 'godmode', 'SU001', '99');

-- HORARIOS
INSERT INTO HORARIOS (id_materia, id_grupo, id_profesor, h_lunes, h_martes, h_miercoles, h_jueves, h_viernes)
VALUES
('MAT101', 'G01', 'P0001', '08:00-10:00', '08:00-10:00', '', '', ''),
('PROG102', 'G02', 'P0002', '', '', '10:00-12:00', '10:00-12:00', '');

-- CALIFICACIONES
INSERT INTO CALIFICACIONES (id_materia, matricula, calif_p1, calif_p2, calif_final, ciclo_cursando)
VALUES
('MAT101', 'A0001', '85', '90', '88', '2025-1'),
('PROG102', 'A0001', '80', '70', '75', '2025-1'),
('MAT101', 'A0002', '90', '95', '93', '2025-1');

-- PAGOS (Monthly payments with various statuses)
INSERT INTO PAGOS (matricula, ciclo_cursando, fecha_vencimiento, fecha_pago, pago_mensual)
VALUES
-- A0001: Early
('A0001', '2025-1', '2025-03-05', '2025-03-03', 1000.00),
-- A0001: Normal
('A0001', '2025-1', '2025-04-05', '2025-04-10', 1000.00),
-- A0001: Late
('A0001', '2025-1', '2025-05-05', '2025-05-20', 1000.00),
-- A0001: Pending
('A0001', '2025-1', '2025-06-05', NULL, 1000.00),

-- A0002: All paid
('A0002', '2025-1', '2025-03-05', '2025-03-02', 1000.00),
('A0002', '2025-1', '2025-04-05', '2025-04-04', 1000.00);

-- ASISTENCIA
INSERT INTO ASISTENCIA (id_materia, codigo, ciclo_cursando)
VALUES
('MAT101', 'CLASE001', '2025-1'),
('PROG102', 'CLASE002', '2025-1');



-------------------SEGUNDA RONDA---------------
INSERT INTO PROFESORES (id_profesor, nombre, celular, email) VALUES
('P0003', 'Luis Martínez', '5555551001', 'luis.m@correo.com'),
('P0004', 'Sofia Pérez', '5555551002', 'sofia.p@correo.com'),
('P0005', 'Juan Herrera', '5555551003', 'juan.h@correo.com'),
('P0006', 'Marta Gómez', '5555551004', 'marta.g@correo.com'),
('P0007', 'Pedro Castillo', '5555551005', 'pedro.c@correo.com'),
('P0008', 'Lucia Fernández', '5555551006', 'lucia.f@correo.com'),
('P0009', 'Diego Ramos', '5555551007', 'diego.r@correo.com'),
('P0010', 'Carla Ruiz', '5555551008', 'carla.r@correo.com'),
('P0011', 'Elena Morales', '5555551009', 'elena.m@correo.com'),
('P0012', 'Ricardo Soto', '5555551010', 'ricardo.s@correo.com');


INSERT INTO MATERIAS (id_materia, materia_nombre, sem_cursante) VALUES
('MAT201', 'Matemáticas II', '2'),
('FIS101', 'Física I', '1'),
('QUI101', 'Química I', '1'),
('HIS101', 'Historia Universal', '1'),
('LIT101', 'Literatura', '1'),
('PROG201', 'Programación III', '4'),
('ECO101', 'Economía Básica', '1'),
('BIO101', 'Biología General', '1'),
('MAT301', 'Álgebra Lineal', '3'),
('EST101', 'Estadística Básica', '2');


INSERT INTO ALUMNOS (matricula, carrera, semestre, user_name, celular, email) VALUES
('A0003', 'Ingeniería en Sistemas', '2', 'luis_m', '5551230003', 'luis_m@correo.com'),
('A0004', 'Administración', '1', 'sofia_p', '5551230004', 'sofia_p@correo.com'),
('A0005', 'Ingeniería Química', '3', 'juan_h', '5551230005', 'juan_h@correo.com'),
('A0006', 'Biología', '2', 'marta_g', '5551230006', 'marta_g@correo.com'),
('A0007', 'Economía', '1', 'pedro_c', '5551230007', 'pedro_c@correo.com'),
('A0008', 'Literatura', '1', 'lucia_f', '5551230008', 'lucia_f@correo.com'),
('A0009', 'Estadística', '2', 'diego_r', '5551230009', 'diego_r@correo.com'),
('A0010', 'Historia', '1', 'carla_r', '5551230010', 'carla_r@correo.com'),
('A0011', 'Matemáticas', '3', 'elena_m', '5551230011', 'elena_m@correo.com'),
('A0012', 'Programación', '4', 'ricardo_s', '5551230012', 'ricardo_s@correo.com'),
-- 20 more students similarly:
('A0013', 'Ingeniería en Sistemas', '2', 'student13', '5551230013', 'student13@correo.com'),
('A0014', 'Administración', '1', 'student14', '5551230014', 'student14@correo.com'),
('A0015', 'Ingeniería Química', '3', 'student15', '5551230015', 'student15@correo.com'),
('A0016', 'Biología', '2', 'student16', '5551230016', 'student16@correo.com'),
('A0017', 'Economía', '1', 'student17', '5551230017', 'student17@correo.com'),
('A0018', 'Literatura', '1', 'student18', '5551230018', 'student18@correo.com'),
('A0019', 'Estadística', '2', 'student19', '5551230019', 'student19@correo.com'),
('A0020', 'Historia', '1', 'student20', '5551230020', 'student20@correo.com'),
('A0021', 'Matemáticas', '3', 'student21', '5551230021', 'student21@correo.com'),
('A0022', 'Programación', '4', 'student22', '5551230022', 'student22@correo.com'),
('A0023', 'Ingeniería en Sistemas', '2', 'student23', '5551230023', 'student23@correo.com'),
('A0024', 'Administración', '1', 'student24', '5551230024', 'student24@correo.com'),
('A0025', 'Ingeniería Química', '3', 'student25', '5551230025', 'student25@correo.com'),
('A0026', 'Biología', '2', 'student26', '5551230026', 'student26@correo.com'),
('A0027', 'Economía', '1', 'student27', '5551230027', 'student27@correo.com'),
('A0028', 'Literatura', '1', 'student28', '5551230028', 'student28@correo.com'),
('A0029', 'Estadística', '2', 'student29', '5551230029', 'student29@correo.com'),
('A0030', 'Historia', '1', 'student30', '5551230030', 'student30@correo.com');


-- For example, assign first 15 students to first 5 subjects, rest to last 5:

INSERT INTO GRUPOSALUM (id_materia, matricula_alumno, id_grupo) VALUES
('MAT201', 'A0003', 'G01'),
('FIS101', 'A0003', 'G02'),
('QUI101', 'A0004', 'G03'),
('HIS101', 'A0005', 'G04'),
('LIT101', 'A0006', 'G05'),

('PROG201', 'A0007', 'G06'),
('ECO101', 'A0008', 'G07'),
('BIO101', 'A0009', 'G08'),
('MAT301', 'A0010', 'G09'),
('EST101', 'A0011', 'G10'),

('MAT201', 'A0012', 'G01'),
('FIS101', 'A0013', 'G02'),
('QUI101', 'A0014', 'G03'),
('HIS101', 'A0015', 'G04'),
('LIT101', 'A0016', 'G05'),

('PROG201', 'A0017', 'G06'),
('ECO101', 'A0018', 'G07'),
('BIO101', 'A0019', 'G08'),
('MAT301', 'A0020', 'G09'),
('EST101', 'A0021', 'G10'),

-- ... continue for all 30 students similarly
('MAT201', 'A0022', 'G01'),
('FIS101', 'A0023', 'G02'),
('QUI101', 'A0024', 'G03'),
('HIS101', 'A0025', 'G04'),
('LIT101', 'A0026', 'G05'),

('PROG201', 'A0027', 'G06'),
('ECO101', 'A0028', 'G07'),
('BIO101', 'A0029', 'G08'),
('MAT301', 'A0030', 'G09');


INSERT INTO MATERIASPROF (id_profesor, id_grupo) VALUES
('P0003', 'G01'),
('P0004', 'G02'),
('P0005', 'G03'),
('P0006', 'G04'),
('P0007', 'G05'),
('P0008', 'G06'),
('P0009', 'G07'),
('P0010', 'G08'),
('P0011', 'G09'),
('P0012', 'G10');


-- G01 Math II (MAT201)
INSERT INTO HORARIOS (id_grupo, id_materia, id_profesor, dia_semana, hora_inicio, hora_fin) VALUES
('G01', 'MAT201', 'P0003', 1, 8, 10),
('G01', 'MAT201', 'P0003', 3, 8, 10),
('G01', 'MAT201', 'P0003', 5, 8, 10);

-- G02 Physics I (FIS101)
INSERT INTO HORARIOS (id_grupo, id_materia, id_profesor, dia_semana, hora_inicio, hora_fin) VALUES
('G02', 'FIS101', 'P0004', 2, 9, 11),
('G02', 'FIS101', 'P0004', 4, 9, 11);

-- G03 Chemistry I (QUI101)
INSERT INTO HORARIOS (id_grupo, id_materia, id_profesor, dia_semana, hora_inicio, hora_fin) VALUES
('G03', 'QUI101', 'P0005', 1, 11, 13),
('G03', 'QUI101', 'P0005', 3, 11, 13),
('G03', 'QUI101', 'P0005', 5, 11, 13);

-- G04 History (HIS101)
INSERT INTO HORARIOS (id_grupo, id_materia, id_profesor, dia_semana, hora_inicio, hora_fin) VALUES
('G04', 'HIS101', 'P0006', 2, 12, 14),
('G04', 'HIS101', 'P0006', 4, 12, 14);

-- G05 Literature (LIT101)
INSERT INTO HORARIOS (id_grupo, id_materia, id_profesor, dia_semana, hora_inicio, hora_fin) VALUES
('G05', 'LIT101', 'P0007', 1, 13, 15),
('G05', 'LIT101', 'P0007', 3, 13, 15);

-- G06 Programming III (PROG201)
INSERT INTO HORARIOS (id_grupo, id_materia, id_profesor, dia_semana, hora_inicio, hora_fin) VALUES
('G06', 'PROG201', 'P0008', 2, 8, 10),
('G06', 'PROG201', 'P0008', 4, 8, 10);

-- G07 Economics (ECO101)
INSERT INTO HORARIOS (id_grupo, id_materia, id_profesor, dia_semana, hora_inicio, hora_fin) VALUES
('G07', 'ECO101', 'P0009', 1, 9, 11),
('G07', 'ECO101', 'P0009', 3, 9, 11);

-- G08 Biology (BIO101)
INSERT INTO HORARIOS (id_grupo, id_materia, id_profesor, dia_semana, hora_inicio, hora_fin) VALUES
('G08', 'BIO101', 'P0010', 2, 11, 13),
('G08', 'BIO101', 'P0010', 4, 11, 13);

-- G09 Linear Algebra (MAT301)
INSERT INTO HORARIOS (id_grupo, id_materia, id_profesor, dia_semana, hora_inicio, hora_fin) VALUES
('G09', 'MAT301', 'P0011', 1, 10, 12),
('G09', 'MAT301', 'P0011', 3, 10, 12);

-- G10 Statistics (EST101)
INSERT INTO HORARIOS (id_grupo, id_materia, id_profesor, dia_semana, hora_inicio, hora_fin) VALUES
('G10', 'EST101', 'P0012', 2, 13, 15),
('G10', 'EST101', 'P0012', 4, 13, 15);
