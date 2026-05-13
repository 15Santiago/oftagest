CREATE DATABASE IF NOT EXISTS oftadb;
USE oftadb;

CREATE TABLE IF NOT EXISTS empleados (
    id_empleado INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento ENUM('CC', 'CE', 'PASAPORTE') NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    sexo ENUM('hombre', 'mujer') NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo_empresa VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('administrador', 'doctor', 'trabajador') NOT NULL,
    especialidad ENUM('oftalmólogo', 'cirujano oftalmológico', 'optometrista', 'retinólogo') NULL,
    fecha_contratacion DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);  

CREATE TABLE IF NOT EXISTS pacientes (
    id_paciente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento ENUM('CC', 'CE', 'PASAPORTE', 'TI') NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    sexo ENUM('hombre', 'mujer') NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS citas (
    id_cita INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT NOT NULL,
    id_doctor INT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    estado ENUM('agendada', 'confirmada', 'en_curso', 'completada', 'cancelada') DEFAULT 'agendada',
    motivo VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
    FOREIGN KEY (id_doctor) REFERENCES empleados(id_empleado)
);

CREATE TABLE IF NOT EXISTS diagnosticos (
    id_diagnostico INT PRIMARY KEY AUTO_INCREMENT,
    id_cita INT NOT NULL,
    id_doctor INT NOT NULL,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT NULL,
    observaciones TEXT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cita) REFERENCES citas(id_cita),
    FOREIGN KEY (id_doctor) REFERENCES empleados(id_empleado)
);

INSERT INTO empleados (nombre, apellidos, tipo_documento, numero_documento, sexo, telefono, correo_empresa, contrasena, rol, especialidad, fecha_contratacion, activo) VALUES
('Admin', 'Sistema', 'CC', '000000001', 'hombre', '3000000000', 'admin@oftagest.com', '$2b$10$8eqLlKQSCdDQ1cw7e/tATub2gtqwDBbZ5Lm3cNJlSOTf/LUupgZNq', 'administrador', NULL, CURDATE(), 1);