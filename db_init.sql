-- Drop and recreate database
DROP DATABASE IF EXISTS SCGEM;
CREATE DATABASE SCGEM CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Drop and recreate user
DROP USER IF EXISTS 'node_user'@'localhost';
DROP USER IF EXISTS 'node_user'@'%';

CREATE USER 'node_user'@'localhost' IDENTIFIED BY 'Zapatitoblanco123***';
CREATE USER 'node_user'@'%' IDENTIFIED BY 'Zapatitoblanco123***';

GRANT ALL PRIVILEGES ON SCGEM.* TO 'node_user'@'localhost';
GRANT ALL PRIVILEGES ON SCGEM.* TO 'node_user'@'%';

FLUSH PRIVILEGES;

-- Use the SCGEM database
USE SCGEM;

-- ALUMNOS
CREATE TABLE ALUMNOS (
    matricula VARCHAR(5) PRIMARY KEY,
    carrera VARCHAR(100) NOT NULL,
    semestre VARCHAR(1),
    user_name VARCHAR(200),
    celular VARCHAR(10) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- MATERIAS
CREATE TABLE MATERIAS (
    id_materia VARCHAR(10) PRIMARY KEY,
    materia_nombre VARCHAR(100) NOT NULL,
    sem_cursante VARCHAR(1)
);

-- PROFESORES
CREATE TABLE PROFESORES (
    id_profesor VARCHAR(5) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    celular VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- GRUPOSALUM
CREATE TABLE GRUPOSALUM (
    id_materia VARCHAR(10),
    matricula_alumno VARCHAR(5),
    id_grupo VARCHAR(5)
);

-- MATERIASPROF
CREATE TABLE MATERIASPROF (
    id_profesor VARCHAR(5),
    id_grupo VARCHAR(5)
);

-- USUARIOS
CREATE TABLE USUARIOS (
    user_name VARCHAR(30),
    password VARCHAR(100) UNIQUE NOT NULL,
    id_user VARCHAR(5) PRIMARY KEY,
    user_role VARCHAR(1),
    PRIMARY KEY (id_user)
);

-- HORARIOS
CREATE TABLE HORARIOS (
    id_materia VARCHAR(5),
    id_grupo VARCHAR(5),
    id_profesor VARCHAR(5),
    h_lunes VARCHAR(20),
    h_martes VARCHAR(20),
    h_miercoles VARCHAR(20),
    h_jueves VARCHAR(20),
    h_viernes VARCHAR(20)
);

-- CALIFICACIONES
CREATE TABLE CALIFICACIONES (
    id_materia VARCHAR(5),
    matricula VARCHAR(5),
    calif_p1 VARCHAR(2),
    calif_p2 VARCHAR(2),
    calif_final VARCHAR(2),
    ciclo_cursando VARCHAR(15)
);

-- PAGOS
-- PAGOS (Revised for monthly logic)
CREATE TABLE PAGOS (
    matricula VARCHAR(5),
    ciclo_cursando VARCHAR(15),
    fecha_vencimiento DATE NOT NULL,
    fecha_pago DATE DEFAULT NULL,
    pago_mensual DECIMAL(10,2) NOT NULL
);


-- ASISTENCIA
CREATE TABLE ASISTENCIA (
    asistencia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_materia VARCHAR(5),
    codigo VARCHAR(10),
    ciclo_cursando VARCHAR(15)
);
