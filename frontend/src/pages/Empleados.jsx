import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Empleados.css'

function Empleados() {
  const navigate = useNavigate()
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    tipo_documento: 'CC',
    numero_documento: '',
    sexo: 'hombre',
    telefono: '',
    correo_empresa: '',
    contrasena: '',
    rol: 'trabajador',
    especialidad: '',
    fecha_contratacion: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    cargarEmpleados()
  }, [])

  const cargarEmpleados = async () => {
    try {
      const res = await fetch('/api/empleados')
      const data = await res.json()
      setEmpleados(data)
    } catch (error) {
      console.error('Error al cargar empleados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editando ? `/api/empleados/${editando}` : '/api/empleados'
      const method = editando ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setShowModal(false)
        setEditando(null)
        setFormData({
          nombre: '',
          apellidos: '',
          tipo_documento: 'CC',
          numero_documento: '',
          sexo: 'hombre',
          telefono: '',
          correo_empresa: '',
          contrasena: '',
          rol: 'trabajador',
          especialidad: '',
          fecha_contratacion: new Date().toISOString().split('T')[0]
        })
        cargarEmpleados()
      } else {
        const error = await res.json()
        alert(error.error || 'Error al guardar')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const handleDesactivar = async (id, activo) => {
    try {
      const res = await fetch(`/api/empleados/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo })
      })
      if (res.ok) {
        cargarEmpleados()
      } else {
        alert('Error al cambiar estado')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const handleEditar = (emp) => {
    setEditando(emp.id_empleado)
    setFormData({
      nombre: emp.nombre,
      apellidos: emp.apellidos,
      tipo_documento: emp.tipo_documento,
      numero_documento: emp.numero_documento,
      sexo: emp.sexo,
      telefono: emp.telefono,
      correo_empresa: emp.correo_empresa,
      contrasena: '',
      rol: emp.rol,
      especialidad: emp.especialidad || '',
      fecha_contratacion: emp.fecha_contratacion
    })
    setShowModal(true)
  }

  const getRolNombre = (rol) => {
    const roles = {
      administrador: 'Administrador',
      doctor: 'Médico',
      trabajador: 'Administrativo'
    }
    return roles[rol] || rol
  }

  const getEstadoBadge = (activo) => {
    return activo ? 
      <span className="badge active">Activo</span> : 
      <span className="badge inactive">Inactivo</span>
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <div className="empleados-container">
      <header className="empleados-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h1>Gestión de Personal</h1>
        <button onClick={() => { setEditando(null); setShowModal(true) }} className="btn-add">
          <i className="fas fa-plus"></i> Nuevo Empleado
        </button>
      </header>

      <div className="empleados-table-container">
        <table className="empleados-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map(emp => (
              <tr key={emp.id_empleado}>
                <td>{emp.nombre} {emp.apellidos}</td>
                <td>{emp.numero_documento}</td>
                <td>{emp.correo_empresa}</td>
                <td>{getRolNombre(emp.rol)}</td>
                <td>{getEstadoBadge(emp.activo)}</td>
                <td className="actions">
                  <button onClick={() => handleEditar(emp)} className="btn-edit" title="Editar">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button onClick={() => handleDesactivar(emp.id_empleado, emp.activo)} className="btn-toggle" title={emp.activo ? 'Desactivar' : 'Activar'}>
                    {emp.activo ? <i className="fas fa-ban"></i> : <i className="fas fa-check-circle"></i>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editando ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Apellidos *</label>
                  <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo Documento *</label>
                  <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange}>
                    <option value="CC">CC - Cédula Ciudadanía</option>
                    <option value="CE">CE - Cédula Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Número Documento *</label>
                  <input type="text" name="numero_documento" value={formData.numero_documento} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sexo *</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange}>
                    <option value="hombre">Hombre</option>
                    <option value="mujer">Mujer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Teléfono *</label>
                  <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Correo Empresa *</label>
                  <input type="email" name="correo_empresa" value={formData.correo_empresa} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>{editando ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}</label>
                  <input type="password" name="contrasena" value={formData.contrasena} onChange={handleChange} required={!editando} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rol *</label>
                  <select name="rol" value={formData.rol} onChange={handleChange} required>
                    <option value="administrador">Administrador</option>
                    <option value="doctor">Médico</option>
                    <option value="trabajador">Personal Administrativo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Especialidad (solo médicos)</label>
                  <select name="especialidad" value={formData.especialidad} onChange={handleChange} disabled={formData.rol !== 'doctor'}>
                    <option value="">Seleccionar especialidad</option>
                    <option value="oftalmólogo">Oftalmólogo</option>
                    <option value="cirujano oftalmológico">Cirujano Oftalmológico</option>
                    <option value="optometrista">Optometrista</option>
                    <option value="retinólogo">Retinólogo</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Fecha Contratación *</label>
                <input type="date" name="fecha_contratacion" value={formData.fecha_contratacion} onChange={handleChange} required />
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn-save">
                  <i className="fas fa-save"></i> Guardar
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  <i className="fas fa-times"></i> Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export { Empleados }