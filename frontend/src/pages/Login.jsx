import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login({ setUsuario }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena })
      })

      const data = await res.json()

      if (data.success) {
        setUsuario(data.usuario)
        navigate('/dashboard')
      } else {
        setError('Usuario o contraseña incorrectos')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <i className="fas fa-eye"></i>
            <h1>OftaGest</h1>
          </div>
          <h2>Bienvenido de vuelta</h2>
          <p>Ingresa tus credenciales para acceder al sistema</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>
              <i className="fas fa-user"></i> Correo electrónico
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingresa tu correo"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-lock"></i> Contraseña
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p>¿No tienes una cuenta? <a href="/registro">Regístrate aquí</a></p>
        </div>
      </div>
    </div>
  )
}

export { Login }