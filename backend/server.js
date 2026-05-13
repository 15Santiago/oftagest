const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

dotenv.config();

const app = express();

//  MIDDLEWARE 
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sesiones
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 30
    }
}));

let db;

//Funciones auxiliares 
function verificarSesion(req, res, next) {
    if (req.session.usuario) {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
}

async function initDB() {
    db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    console.log('Base de datos conectada');
}

//Rutas públicas 

app.get('/api/verificar', (req, res) => {
    if (req.session.usuario) {
        res.json({ loggedIn: true, usuario: req.session.usuario });
    } else {
        res.json({ loggedIn: false });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { correo, contrasena } = req.body;
    
    try {
        const [rows] = await db.execute(
            'SELECT * FROM empleados WHERE correo_empresa = ? AND activo = 1',
            [correo]
        );
        
        if (rows.length > 0) {
            const empleado = rows[0];
            const match = await bcrypt.compare(contrasena, empleado.contrasena);
            if (match) {
                req.session.usuario = {
                    id: empleado.id_empleado,
                    nombre: empleado.nombre,
                    apellidos: empleado.apellidos,
                    correo: empleado.correo_empresa,
                    rol: empleado.rol,
                    tipo: 'empleado',
                    telefono: empleado.telefono || ''
                };
                return res.json({ success: true, usuario: req.session.usuario });
            }
        }
        
        const [rowsPac] = await db.execute(
            'SELECT * FROM pacientes WHERE correo = ?',
            [correo]
        );
        
        if (rowsPac.length > 0) {
            const paciente = rowsPac[0];
            const match = await bcrypt.compare(contrasena, paciente.contrasena);
            if (match) {
                req.session.usuario = {
                    id: paciente.id_paciente,
                    nombre: paciente.nombre,
                    apellidos: paciente.apellidos,
                    correo: paciente.correo,
                    rol: 'paciente',
                    tipo: 'paciente',
                    telefono: paciente.telefono || ''
                };
                return res.json({ success: true, usuario: req.session.usuario });
            }
        }
        
        res.status(401).json({ error: 'Credenciales incorrectas' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Cerrar sesion
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Registro de pacientes
app.post('/api/registro', async (req, res) => {
    const { nombre, apellidos, tipo_documento, numero_documento, sexo, telefono, correo, contrasena } = req.body;

    try {
        const [existe] = await db.execute('SELECT id_paciente FROM pacientes WHERE correo = ?', [correo]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        const [existeDoc] = await db.execute('SELECT id_paciente FROM pacientes WHERE numero_documento = ?', [numero_documento]);
        if (existeDoc.length > 0) {
            return res.status(400).json({ error: 'El número de documento ya está registrado' });
        }

        const hash = await bcrypt.hash(contrasena, 10);

        await db.execute(
            `INSERT INTO pacientes (nombre, apellidos, tipo_documento, numero_documento, sexo, telefono, correo, contrasena) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, apellidos, tipo_documento, numero_documento, sexo, telefono, correo, hash]
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

//  Rutas protegidas 

// Editar perfil de usuario
app.put('/api/perfil', verificarSesion, async (req, res) => {
    const { id, tipo, nombre, apellidos, telefono, correo } = req.body;

    try {
        if (tipo === 'empleado') {
            await db.execute(
                'UPDATE empleados SET nombre = ?, apellidos = ?, telefono = ? WHERE id_empleado = ?',
                [nombre, apellidos, telefono, id]
            );
        } else {
            await db.execute(
                'UPDATE pacientes SET nombre = ?, apellidos = ?, telefono = ?, correo = ? WHERE id_paciente = ?',
                [nombre, apellidos, telefono, correo, id]
            );
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

// Obtener todos los empleados
app.get('/api/empleados', verificarSesion, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM empleados ORDER BY id_empleado DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear empleado
app.post('/api/empleados', verificarSesion, async (req, res) => {
    const { nombre, apellidos, tipo_documento, numero_documento, sexo, telefono, correo_empresa, contrasena, rol, especialidad, fecha_contratacion } = req.body;
    
    try {
        const [existe] = await db.execute('SELECT id_empleado FROM empleados WHERE correo_empresa = ?', [correo_empresa]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }
        
        const [existeDoc] = await db.execute('SELECT id_empleado FROM empleados WHERE numero_documento = ?', [numero_documento]);
        if (existeDoc.length > 0) {
            return res.status(400).json({ error: 'El documento ya está registrado' });
        }
        
        const hash = await bcrypt.hash(contrasena, 10);
        
        await db.execute(
            `INSERT INTO empleados (nombre, apellidos, tipo_documento, numero_documento, sexo, telefono, correo_empresa, contrasena, rol, especialidad, fecha_contratacion, activo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [nombre, apellidos, tipo_documento, numero_documento, sexo, telefono, correo_empresa, hash, rol, especialidad || null, fecha_contratacion]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Actualizar empleado
app.put('/api/empleados/:id', verificarSesion, async (req, res) => {
    const { id } = req.params;
    const { nombre, apellidos, tipo_documento, numero_documento, sexo, telefono, correo_empresa, contrasena, rol, especialidad, fecha_contratacion } = req.body;
    
    try {
        let query = `UPDATE empleados SET nombre=?, apellidos=?, tipo_documento=?, numero_documento=?, sexo=?, telefono=?, correo_empresa=?, rol=?, especialidad=?, fecha_contratacion=?`;
        let params = [nombre, apellidos, tipo_documento, numero_documento, sexo, telefono, correo_empresa, rol, especialidad || null, fecha_contratacion];
        
        if (contrasena) {
            const hash = await bcrypt.hash(contrasena, 10);
            query += `, contrasena=?`;
            params.push(hash);
        }
        
        query += ` WHERE id_empleado=?`;
        params.push(id);
        
        await db.execute(query, params);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Cambiar estado del empleado
app.patch('/api/empleados/:id/estado', verificarSesion, async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;
    
    try {
        await db.execute('UPDATE empleados SET activo = ? WHERE id_empleado = ?', [activo, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Reportes para dministradores

// Estadísticas generales
app.get('/api/reportes/estadisticas', verificarSesion, async (req, res) => {
    try {
        // Total de pacientes
        const [totalPacientes] = await db.execute('SELECT COUNT(*) as total FROM pacientes');
        
        // Total de citas
        const [totalCitas] = await db.execute('SELECT COUNT(*) as total FROM citas');
        
        // Citas por estado
        const [citasPorEstado] = await db.execute('SELECT estado, COUNT(*) as total FROM citas GROUP BY estado');
        
        // Citas por mes (últimos 6 meses)
        const [citasPorMes] = await db.execute(`
            SELECT DATE_FORMAT(fecha_hora, '%Y-%m') as mes, COUNT(*) as total 
            FROM citas 
            WHERE fecha_hora >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(fecha_hora, '%Y-%m')
            ORDER BY mes DESC
        `);
        
        // Doctores activos
        const [doctoresActivos] = await db.execute('SELECT COUNT(*) as total FROM empleados WHERE rol = "doctor" AND activo = 1');
        
        res.json({
            totalPacientes: totalPacientes[0].total,
            totalCitas: totalCitas[0].total,
            citasPorEstado,
            citasPorMes,
            doctoresActivos: doctoresActivos[0].total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Listado de citas con filtros (fecha, doctor, estado)
app.get('/api/reportes/citas', verificarSesion, async (req, res) => {
    const { fechaInicio, fechaFin, doctorId, estado } = req.query;
    
    try {
        let query = `
            SELECT c.*, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
                   e.nombre as doctor_nombre, e.apellidos as doctor_apellidos
            FROM citas c 
            JOIN pacientes p ON c.id_paciente = p.id_paciente 
            JOIN empleados e ON c.id_doctor = e.id_empleado
            WHERE 1=1
        `;
        let params = [];
        
        if (fechaInicio && fechaFin) {
            query += ` AND DATE(c.fecha_hora) BETWEEN ? AND ?`;
            params.push(fechaInicio, fechaFin);
        }
        
        if (doctorId) {
            query += ` AND c.id_doctor = ?`;
            params.push(doctorId);
        }
        
        if (estado) {
            query += ` AND c.estado = ?`;
            params.push(estado);
        }
        
        query += ` ORDER BY c.fecha_hora DESC`;
        
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Obtener citas del dia para un doctor
app.get('/api/citas/doctor/:id', verificarSesion, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT c.*, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos 
             FROM citas c 
             JOIN pacientes p ON c.id_paciente = p.id_paciente 
             WHERE c.id_doctor = ? AND DATE(c.fecha_hora) = CURDATE()
             ORDER BY c.fecha_hora ASC`,
            [req.params.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Registrar diagnostico
app.post('/api/diagnostico', verificarSesion, async (req, res) => {
    const { id_cita, diagnostico, tratamiento, observaciones } = req.body;
    try {
        await db.execute(
            `INSERT INTO diagnosticos (id_cita, id_doctor, diagnostico, tratamiento, observaciones) 
             VALUES (?, ?, ?, ?, ?)`,
            [id_cita, req.session.usuario.id, diagnostico, tratamiento, observaciones]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los doctores
app.get('/api/doctores', verificarSesion, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id_empleado, nombre, apellidos, especialidad FROM empleados WHERE rol = "doctor" AND activo = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todas las citas
app.get('/api/citas', verificarSesion, async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT c.*, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
             e.nombre as doctor_nombre, e.apellidos as doctor_apellidos
             FROM citas c 
             JOIN pacientes p ON c.id_paciente = p.id_paciente 
             JOIN empleados e ON c.id_doctor = e.id_empleado
             ORDER BY c.fecha_hora DESC`
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Agendar nueva cita
app.post('/api/citas', verificarSesion, async (req, res) => {
    const { id_paciente, id_doctor, fecha_hora, motivo } = req.body;
    try {
        const [conflict] = await db.execute(
            'SELECT * FROM citas WHERE id_doctor = ? AND fecha_hora = ? AND estado != "cancelada"',
            [id_doctor, fecha_hora]
        );
        
        if (conflict.length > 0) {
            return res.status(400).json({ error: 'El doctor ya tiene una cita en ese horario' });
        }
        
        await db.execute(
            'INSERT INTO citas (id_paciente, id_doctor, fecha_hora, estado, motivo) VALUES (?, ?, ?, "agendada", ?)',
            [id_paciente, id_doctor, fecha_hora, motivo]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancelar cita
app.put('/api/citas/:id/cancelar', verificarSesion, async (req, res) => {
    try {
        await db.execute('UPDATE citas SET estado = "cancelada" WHERE id_cita = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener pacientes
app.get('/api/pacientes', verificarSesion, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM pacientes ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Buscar paciente por documento
app.get('/api/pacientes/buscar/:documento', verificarSesion, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM pacientes WHERE numero_documento = ?',
            [req.params.documento]
        );
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'Paciente no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Iniciar servidor 
initDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
    });
});

module.exports = { app, db };