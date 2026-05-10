const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

dotenv.config();

const app = express();

// Middleware
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

// Conexion a BD
let db;

async function initDB() {
    db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    console.log('Base de datos conectada');
}

// Middleware para verificar sesion
function verificarSesion(req, res, next) {
    if (req.session.usuario) {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
}

//Rutas publicas

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
                    tipo: 'empleado'
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
                    tipo: 'paciente'
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

//Rutas protegidas 

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
        // Verificar conflicto de horario
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

// Iniciar servidor
initDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
    });
});

module.exports = { app, db };