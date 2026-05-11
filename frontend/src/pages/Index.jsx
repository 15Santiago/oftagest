import { useNavigate } from 'react-router-dom'
import './Index.css'

function Index() {
  const navigate = useNavigate()

  return (
    <div className="index-container">
      <header className="index-header">
        <div className="logo">
          <i className="fas fa-eye"></i>
          <h1>OftaGest</h1>
        </div>
        <div className="header-buttons">
          <button onClick={() => navigate('/login')} className="btn-login">
            <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
          </button>
          <button onClick={() => navigate('/registro')} className="btn-register">
            <i className="fas fa-user-plus"></i> Registrarse
          </button>
        </div>
      </header>

      <main className="index-main">
        <section className="hero">
          <h2>Gestión Integral para Clínicas Oftalmológicas</h2>
          <p>Optimiza la atención de tus pacientes con nuestra plataforma especializada</p>
        </section>

        <section className="features">
          <h3>¿Qué ofrece OftaGest?</h3>
          <div className="features-grid">
            <div className="feature-card">
              <i className="fas fa-calendar-check"></i>
              <h4>Gestión de Citas</h4>
              <p>Programación eficiente de consultas y seguimiento de pacientes.</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-folder-medical"></i>
              <h4>Historias Clínicas</h4>
              <p>Registro digital con campos específicos para oftalmología.</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-chart-line"></i>
              <h4>Reportes</h4>
              <p>Estadísticas y análisis para la toma de decisiones.</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-users"></i>
              <h4>Gestión de Usuarios</h4>
              <p>Administra doctores, personal y pacientes.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="index-footer">
        <div className="footer-container">
          <div className="footer-section">
            <h4>OftaGest</h4>
            <p>Transformando la atención oftalmológica en Colombia</p>
          </div>
          <div className="footer-section">
            <h4>Contacto</h4>
            <p>+57 (601) 123 4567</p>
            <p>info@oftagest.com.co</p>
            <p>Bogotá D.C., Colombia</p>
          </div>
          <div className="footer-section">
            <h4>Horario</h4>
            <p>Lun a Vie: 7:00 AM - 7:00 PM</p>
            <p>Sábados: 8:00 AM - 2:00 PM</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 OftaGest - Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  )
}

export { Index }