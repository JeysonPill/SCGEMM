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
