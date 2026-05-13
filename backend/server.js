const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

dotenv.config();

const app = express();

//  Middleware 
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

// Obtener citas del doctor (con filtro de fecha)
app.get('/api/doctor/citas', verificarSesion, async (req, res) => {
    const { fecha } = req.query;
    const doctorId = req.session.usuario.id;
    
    try {
        let query = `
            SELECT c.*, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
                   p.numero_documento, p.telefono, p.sexo, p.correo
            FROM citas c
            JOIN pacientes p ON c.id_paciente = p.id_paciente
            WHERE c.id_doctor = ?
        `;
        let params = [doctorId];
        
        if (fecha) {
            query += ` AND DATE(c.fecha_hora) = ?`;
            params.push(fecha);
        } else {
            query += ` AND DATE(c.fecha_hora) = CURDATE()`;
        }
        
        query += ` ORDER BY c.fecha_hora ASC`;
        
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Registrar inasistencia
app.put('/api/citas/:id/inasistencia', verificarSesion, async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.execute(
            `UPDATE citas SET estado = 'cancelada' WHERE id_cita = ?`,
            [id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener historia clinica del paciente
app.get('/api/paciente/historia/:id', verificarSesion, async (req, res) => {
    const { id } = req.params;
    
    try {
        const [paciente] = await db.execute(
            'SELECT * FROM pacientes WHERE id_paciente = ?',
            [id]
        );
        
        const [citas] = await db.execute(`
            SELECT c.*, e.nombre as doctor_nombre, e.apellidos as doctor_apellidos,
                   d.diagnostico, d.tratamiento, d.observaciones
            FROM citas c
            JOIN empleados e ON c.id_doctor = e.id_empleado
            LEFT JOIN diagnosticos d ON c.id_cita = d.id_cita
            WHERE c.id_paciente = ?
            ORDER BY c.fecha_hora DESC
        `, [id]);
        
        res.json({
            paciente: paciente[0],
            citas: citas
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener tipos de examen
app.get('/api/tipos-examen', verificarSesion, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM tipos_examen');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Registrar atencion (diagnostico + tratamiento)
app.post('/api/doctor/atender', verificarSesion, async (req, res) => {
    const { id_cita, diagnostico, tratamiento, observaciones } = req.body;
    const doctorId = req.session.usuario.id;
    
    try {
        await db.execute(
            `INSERT INTO diagnosticos (id_cita, id_doctor, diagnostico, tratamiento, observaciones)
             VALUES (?, ?, ?, ?, ?)`,
            [id_cita, doctorId, diagnostico, tratamiento, observaciones]
        );
        
        await db.execute(
            `UPDATE citas SET estado = 'completada' WHERE id_cita = ?`,
            [id_cita]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Registrar examen medico
app.post('/api/examenes', verificarSesion, async (req, res) => {
    const { id_cita, id_tipo_examen, resultados } = req.body;
    const doctorId = req.session.usuario.id;
    
    try {
        await db.execute(
            `INSERT INTO examenes_oftalmologicos (id_cita, id_tipo_examen, id_doctor, fecha_realizacion, resultados)
             VALUES (?, ?, ?, NOW(), ?)`,
            [id_cita, id_tipo_examen, doctorId, resultados || 'Pendiente']
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Estadísticas generales
app.get('/api/reportes/estadisticas', verificarSesion, async (req, res) => {
    try {
        const [totalPacientes] = await db.execute('SELECT COUNT(*) as total FROM pacientes');
        const [totalCitas] = await db.execute('SELECT COUNT(*) as total FROM citas');
        const [citasPorEstado] = await db.execute('SELECT estado, COUNT(*) as total FROM citas GROUP BY estado');
        const [doctoresActivos] = await db.execute('SELECT COUNT(*) as total FROM empleados WHERE rol = "doctor" AND activo = 1');
        
        res.json({
            totalPacientes: totalPacientes[0].total,
            totalCitas: totalCitas[0].total,
            citasPorEstado,
            doctoresActivos: doctoresActivos[0].total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Listado de citas con filtros
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

// Obtener citas del paciente
app.get('/api/paciente/citas', verificarSesion, async (req, res) => {
    const pacienteId = req.session.usuario.id;
    
    try {
        const [rows] = await db.execute(`
            SELECT c.*, e.nombre as doctor_nombre, e.apellidos as doctor_apellidos,
                   e.especialidad
            FROM citas c
            JOIN empleados e ON c.id_doctor = e.id_empleado
            WHERE c.id_paciente = ?
            ORDER BY c.fecha_hora DESC
        `, [pacienteId]);
        
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Cancelar cita 
app.put('/api/paciente/citas/:id/cancelar', verificarSesion, async (req, res) => {
    const { id } = req.params;
    const pacienteId = req.session.usuario.id;
    
    try {
        // Verificar que la cita pertenece al paciente
        const [cita] = await db.execute(
            'SELECT * FROM citas WHERE id_cita = ? AND id_paciente = ?',
            [id, pacienteId]
        );
        
        if (cita.length === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        
        await db.execute(
            'UPDATE citas SET estado = "cancelada" WHERE id_cita = ?',
            [id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reprogramar cita
app.put('/api/paciente/citas/:id/reprogramar', verificarSesion, async (req, res) => {
    const { id } = req.params;
    const { nueva_fecha_hora } = req.body;
    const pacienteId = req.session.usuario.id;
    
    try {
        // Verificar que la cita pertenece al paciente
        const [cita] = await db.execute(
            'SELECT * FROM citas WHERE id_cita = ? AND id_paciente = ?',
            [id, pacienteId]
        );
        
        if (cita.length === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        
        // Verificar disponibilidad del doctor
        const doctorId = cita[0].id_doctor;
        const [conflict] = await db.execute(
            'SELECT * FROM citas WHERE id_doctor = ? AND fecha_hora = ? AND estado != "cancelada"',
            [doctorId, nueva_fecha_hora]
        );
        
        if (conflict.length > 0) {
            return res.status(400).json({ error: 'El doctor no está disponible en ese horario' });
        }
        
        await db.execute(
            'UPDATE citas SET fecha_hora = ?, estado = "agendada" WHERE id_cita = ?',
            [nueva_fecha_hora, id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Obtener doctores disponibles
app.get('/api/paciente/doctores', verificarSesion, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id_empleado, nombre, apellidos, especialidad FROM empleados WHERE rol = "doctor" AND activo = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener horarios disponibles de un doctor
app.get('/api/paciente/horarios/:doctorId', verificarSesion, async (req, res) => {
    const { doctorId } = req.params;
    
    try {
        // Obtener horarios ya ocupados
        const [ocupados] = await db.execute(
            `SELECT fecha_hora FROM citas 
             WHERE id_doctor = ? AND fecha_hora >= NOW() AND estado != 'cancelada'`,
            [doctorId]
        );
        
        const horariosOcupados = ocupados.map(o => new Date(o.fecha_hora).getTime());
        
        // Generar horarios disponibles
        const horariosDisponibles = [];
        const hoy = new Date();
        
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() + i);
            
            for (let hora = 9; hora <= 18; hora++) {
                for (let minuto = 0; minuto < 60; minuto += 30) {
                    if (hora === 18 && minuto > 0) continue;
                    
                    const fechaHora = new Date(fecha);
                    fechaHora.setHours(hora, minuto, 0);
                    
                    if (fechaHora > hoy) {
                        if (!horariosOcupados.includes(fechaHora.getTime())) {
                            horariosDisponibles.push({
                                fecha: fechaHora.toISOString().split('T')[0],
                                hora: `${hora.toString().padStart(2,'0')}:${minuto.toString().padStart(2,'0')}`,
                                timestamp: fechaHora.getTime()
                            });
                        }
                    }
                }
            }
        }
        
        // Agrupar por fecha
        const agrupados = {};
        horariosDisponibles.forEach(h => {
            if (!agrupados[h.fecha]) {
                agrupados[h.fecha] = [];
            }
            agrupados[h.fecha].push(h.hora);
        });
        
        res.json(agrupados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear nueva cita
app.post('/api/paciente/citas', verificarSesion, async (req, res) => {
    const { id_doctor, fecha_hora, motivo } = req.body;
    const pacienteId = req.session.usuario.id;
    
    try {
        // Verificar conflicto
        const [conflict] = await db.execute(
            'SELECT * FROM citas WHERE id_doctor = ? AND fecha_hora = ? AND estado != "cancelada"',
            [id_doctor, fecha_hora]
        );
        
        if (conflict.length > 0) {
            return res.status(400).json({ error: 'El doctor no está disponible en ese horario' });
        }
        
        await db.execute(
            `INSERT INTO citas (id_paciente, id_doctor, fecha_hora, estado, motivo) 
             VALUES (?, ?, ?, 'agendada', ?)`,
            [pacienteId, id_doctor, fecha_hora, motivo || null]
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los exámenes del paciente
app.get('/api/paciente/examenes', verificarSesion, async (req, res) => {
    const pacienteId = req.session.usuario.id;
    
    try {
        const [rows] = await db.execute(`
            SELECT eo.*, te.nombre_examen, te.descripcion, 
                   c.fecha_hora, c.id_cita,
                   emp.nombre as doctor_nombre, emp.apellidos as doctor_apellidos
            FROM examenes_oftalmologicos eo
            JOIN tipos_examen te ON eo.id_tipo_examen = te.id_tipo_examen
            JOIN citas c ON eo.id_cita = c.id_cita
            JOIN empleados emp ON eo.id_doctor = emp.id_empleado
            WHERE c.id_paciente = ?
            ORDER BY eo.fecha_realizacion DESC
        `, [pacienteId]);
        
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener examen por ID
app.get('/api/paciente/examenes/:id', verificarSesion, async (req, res) => {
    const { id } = req.params;
    const pacienteId = req.session.usuario.id;
    
    try {
        const [rows] = await db.execute(`
            SELECT eo.*, te.nombre_examen, te.descripcion, te.precio_base,
                   c.fecha_hora, c.motivo,
                   emp.nombre as doctor_nombre, emp.apellidos as doctor_apellidos
            FROM examenes_oftalmologicos eo
            JOIN tipos_examen te ON eo.id_tipo_examen = te.id_tipo_examen
            JOIN citas c ON eo.id_cita = c.id_cita
            JOIN empleados emp ON eo.id_doctor = emp.id_empleado
            WHERE eo.id_examen = ? AND c.id_paciente = ?
        `, [id, pacienteId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Examen no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todas las recetas del paciente
app.get('/api/paciente/recetas', verificarSesion, async (req, res) => {
    const pacienteId = req.session.usuario.id;
    
    try {
        const [rows] = await db.execute(`
            SELECT d.*, c.fecha_hora, c.id_cita,
                   e.nombre as doctor_nombre, e.apellidos as doctor_apellidos,
                   e.especialidad
            FROM diagnosticos d
            JOIN citas c ON d.id_cita = c.id_cita
            JOIN empleados e ON d.id_doctor = e.id_empleado
            WHERE c.id_paciente = ? AND (d.tratamiento IS NOT NULL AND d.tratamiento != '')
            ORDER BY c.fecha_hora DESC
        `, [pacienteId]);
        
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener receta por ID
app.get('/api/paciente/recetas/:id', verificarSesion, async (req, res) => {
    const { id } = req.params;
    const pacienteId = req.session.usuario.id;
    
    try {
        const [rows] = await db.execute(`
            SELECT d.*, c.fecha_hora, c.motivo,
                   e.nombre as doctor_nombre, e.apellidos as doctor_apellidos,
                   e.especialidad
            FROM diagnosticos d
            JOIN citas c ON d.id_cita = c.id_cita
            JOIN empleados e ON d.id_doctor = e.id_empleado
            WHERE d.id_diagnostico = ? AND c.id_paciente = ?
        `, [id, pacienteId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Receta no encontrada' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener historia clínica completa del paciente
app.get('/api/paciente/historia-completa', verificarSesion, async (req, res) => {
    const pacienteId = req.session.usuario.id;
    
    try {
        // Datos del paciente
        const [paciente] = await db.execute(
            'SELECT id_paciente, nombre, apellidos, tipo_documento, numero_documento, sexo, telefono, correo, fecha_registro FROM pacientes WHERE id_paciente = ?',
            [pacienteId]
        );
        
        // Todas las citas con sus diagnósticos
        const [citas] = await db.execute(`
            SELECT c.id_cita, c.fecha_hora, c.estado, c.motivo,
                   e.id_empleado as doctor_id, e.nombre as doctor_nombre, e.apellidos as doctor_apellidos, e.especialidad,
                   d.id_diagnostico, d.diagnostico, d.tratamiento, d.observaciones, d.fecha as diagnostico_fecha
            FROM citas c
            JOIN empleados e ON c.id_doctor = e.id_empleado
            LEFT JOIN diagnosticos d ON c.id_cita = d.id_cita
            WHERE c.id_paciente = ?
            ORDER BY c.fecha_hora DESC
        `, [pacienteId]);
        
        // Todos los exámenes
        const [examenes] = await db.execute(`
            SELECT eo.*, te.nombre_examen, te.descripcion,
                   c.fecha_hora as cita_fecha
            FROM examenes_oftalmologicos eo
            JOIN tipos_examen te ON eo.id_tipo_examen = te.id_tipo_examen
            JOIN citas c ON eo.id_cita = c.id_cita
            WHERE c.id_paciente = ?
            ORDER BY eo.fecha_realizacion DESC
        `, [pacienteId]);
        
        res.json({
            paciente: paciente[0],
            citas: citas,
            examenes: examenes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Registrar solicitud de historia clínica
app.post('/api/paciente/solicitar-historia', verificarSesion, async (req, res) => {
    const pacienteId = req.session.usuario.id;
    const { motivo } = req.body;
    
    try {
        console.log(`Solicitud de historia clínica - Paciente ID: ${pacienteId}, Motivo: ${motivo || 'No especificado'}`);
        
        await db.execute(
            'INSERT INTO solicitudes_historia (id_paciente, motivo, fecha_solicitud, estado) VALUES (?, ?, NOW(), "pendiente")',
            [pacienteId, motivo || null]
        );
        
        res.json({ 
            success: true, 
            mensaje: 'Su solicitud ha sido enviada. En breve nos pondremos en contacto con usted.'
        });
    } catch (error) {
        console.error(error);
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

initDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
    });
});

module.exports = { app, db };