import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

function Dashboard({ usuario, setUsuario }) {
  const navigate = useNavigate()

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

  const menuItems = {
    administrador: [
      { name: 'Administrar Usuarios', path: '/empleados', icon: '👥' },
      { name: 'Ver Reportes', path: '/reportes', icon: '📊' }
    ],
    doctor: [
      { name: 'Mi Agenda', path: '/mi-agenda', icon: '📅' }
    ],
    trabajador: [
      { name: 'Buscar Paciente', path: '/buscar-paciente', icon: '🔍' },
      { name: 'Gestionar Citas', path: '/gestion-citas', icon: '📋' }
    ],
    paciente: [
      { name: 'Mis Citas', path: '/mis-citas', icon: '📅' }
    ]
  }

  const items = menuItems[usuario.rol] || []

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <i className="fas fa-eye"></i>
          <h2>OftaGest</h2>
        </div>
        
        <div className="profile-section">
          <div className="profile-avatar">
            <i className="fas fa-user-circle"></i>
          </div>
          <div className="profile-info">
            <p className="profile-name">{usuario.nombre} {usuario.apellidos}</p>
            <p className="profile-email">{usuario.correo}</p>
            <p className="profile-rol">{usuario.rol === 'administrador' ? 'Administrador' : usuario.rol === 'doctor' ? 'Médico' : usuario.rol === 'trabajador' ? 'Administrativo' : 'Paciente'}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="nav-item"
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h1>Bienvenido, {usuario.nombre}</h1>
          <p>Panel de control de OftaGest</p>
        </div>

        {rol === 'administrador' && (
          <div className="quick-actions">
            <h3>Acciones Rápidas</h3>
            <div className="actions-grid">
              <div className="action-card" onClick={() => navigate('/empleados')}>
                <i className="fas fa-users"></i>
                <span>Gestionar Usuarios</span>
              </div>
              <div className="action-card" onClick={() => navigate('/reportes')}>
                <i className="fas fa-chart-bar"></i>
                <span>Ver Reportes</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export { Dashboard }