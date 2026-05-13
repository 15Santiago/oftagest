import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

function Dashboard({ usuario, setUsuario }) {
  const navigate = useNavigate()
  const [editando, setEditando] = useState(false)
  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || '',
    apellidos: usuario?.apellidos || '',
    telefono: usuario?.telefono || '',
    correo: usuario?.correo || ''
  })

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    setUsuario(null)
    navigate('/login')
  }

  if (!usuario) {
    navigate('/login')
    return null
  }

  const rol = usuario.rol

  const handleEditChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: usuario.id,
          tipo: usuario.tipo,
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          telefono: formData.telefono,
          correo: formData.correo
        })
      })
      const data = await res.json()
      if (data.success) {
        setUsuario({ ...usuario, ...formData })
        setEditando(false)
      } else {
        alert('Error al actualizar perfil')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const rolNombre = {
    administrador: 'Administrador',
    doctor: 'Médico',
    trabajador: 'Administrativo',
    paciente: 'Paciente'
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">
          <i className="fas fa-eye"></i>
          <h1>OftaGest</h1>
        </div>
        <button onClick={handleLogout} className="logout-btn-header">
          <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
        </button>
      </header>

      <main className="dashboard-main">
        <div className="profile-card">
          <div className="profile-avatar">
            <i className="fas fa-user-circle"></i>
          </div>
          <div className="profile-info">
            {!editando ? (
              <>
                <h2>{usuario.nombre} {usuario.apellidos}</h2>
                <p><i className="fas fa-envelope"></i> {usuario.correo}</p>
                <p><i className="fas fa-phone"></i> {usuario.telefono || 'No registrado'}</p>
                <p><i className="fas fa-tag"></i> {rolNombre[usuario.rol] || usuario.rol}</p>
                <button onClick={() => setEditando(true)} className="btn-edit">
                  <i className="fas fa-edit"></i> Editar Perfil
                </button>
              </>
            ) : (
              <div className="edit-form">
                <h3>Editar Perfil</h3>
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>Apellidos</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>Correo</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleEditChange}
                    disabled={usuario.tipo === 'empleado'}
                  />
                </div>
                <div className="edit-buttons">
                  <button onClick={handleSaveProfile} className="btn-save">
                    <i className="fas fa-save"></i> Guardar
                  </button>
                  <button onClick={() => setEditando(false)} className="btn-cancel">
                    <i className="fas fa-times"></i> Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {rol === 'administrador' && (
          <div className="actions-grid">
            <div className="action-card" onClick={() => navigate('/empleados')}>
              <i className="fas fa-users"></i>
              <span>Gestionar Personal</span>
            </div>
            <div className="action-card" onClick={() => navigate('/reportes')}>
              <i className="fas fa-chart-bar"></i>
              <span>Ver Reportes</span>
            </div>
          </div>
        )}

        {rol === 'doctor' && (
          <div className="actions-grid">
            <div className="action-card" onClick={() => navigate('/mi-agenda')}>
              <i className="fas fa-calendar-alt"></i>
              <span>Mi Agenda</span>
            </div>
          </div>
        )}

        {rol === 'trabajador' && (
          <div className="actions-grid">
            <div className="action-card" onClick={() => navigate('/buscar-paciente')}>
              <i className="fas fa-search"></i>
              <span>Buscar Paciente</span>
            </div>
            <div className="action-card" onClick={() => navigate('/gestion-citas')}>
              <i className="fas fa-calendar-check"></i>
              <span>Gestionar Citas</span>
            </div>
          </div>
        )}

        {rol === 'paciente' && (
          <div className="actions-grid">
            <div className="action-card" onClick={() => navigate('/mis-citas')}>
              <i className="fas fa-calendar-alt"></i>
              <span>Mis Citas</span>
            </div>
            <div className="action-card" onClick={() => navigate('/agendar-cita')}>
              <i className="fas fa-plus-circle"></i>
              <span>Agendar Cita</span>
            </div>
            <div className="action-card" onClick={() => navigate('/mis-resultados')}>
              <i className="fas fa-flask"></i>
              <span>Resultados</span>
            </div>
            <div className="action-card" onClick={() => navigate('/mis-recetas')}>
              <i className="fas fa-prescription-bottle"></i>
              <span>Recetas</span>
            </div>
            <div className="action-card" onClick={() => navigate('/solicitar-historia')}>
              <i className="fas fa-folder-medical"></i>
              <span>Historia Clínica</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export { Dashboard }