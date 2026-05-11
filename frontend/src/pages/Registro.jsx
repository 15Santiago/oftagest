import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Registro.css'

function Registro() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    tipo_documento: 'CC',
    numero_documento: '',
    sexo: 'hombre',
    telefono: '',
    correo: '',
    contrasena: '',
    confirmar_contrasena: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validar que las contraseñas coincidan
    if (formData.contrasena !== formData.confirmar_contrasena) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    // Validar longitud mínima de contraseña
    if (formData.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          tipo_documento: formData.tipo_documento,
          numero_documento: formData.numero_documento,
          sexo: formData.sexo,
          telefono: formData.telefono,
          correo: formData.correo,
          contrasena: formData.contrasena
        })
      })

      const data = await res.json()

      if (data.success) {
        setSuccess('Registro exitoso. Ahora puedes iniciar sesión.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(data.error || 'Error al registrar usuario')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="registro-container">
      <div className="registro-card">
        <div className="registro-header">
          <button onClick={() => navigate('/')} className="back-home">
            <i className="fas fa-arrow-left"></i> Volver al inicio
          </button>
          <div className="logo">
            <i className="fas fa-eye"></i>
            <h1>OftaGest</h1>
          </div>
          <h2>Registro de Paciente</h2>
          <p>Crea tu cuenta para acceder al sistema</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="registro-form">
          <div className="form-row">
            <div className="form-group">
              <label><i className="fas fa-user"></i> Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ingresa tu nombre"
                required
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-user"></i> Apellidos</label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                placeholder="Ingresa tus apellidos"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><i className="fas fa-id-card"></i> Tipo Documento</label>
              <select
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleChange}
                required
              >
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="TI">Tarjeta de Identidad (TI)</option>
              </select>
            </div>

            <div className="form-group">
              <label><i className="fas fa-hashtag"></i> Número Documento</label>
              <input
                type="text"
                name="numero_documento"
                value={formData.numero_documento}
                onChange={handleChange}
                placeholder="Ingresa tu número de documento"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><i className="fas fa-venus-mars"></i> Sexo</label>
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                required
              >
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
              </select>
            </div>

            <div className="form-group">
              <label><i className="fas fa-phone"></i> Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ingresa tu teléfono"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label><i className="fas fa-envelope"></i> Correo Electrónico</label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><i className="fas fa-lock"></i> Contraseña</label>
              <input
                type="password"
                name="contrasena"
                value={formData.contrasena}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="form-group">
              <label><i className="fas fa-check-circle"></i> Confirmar Contraseña</label>
              <input
                type="password"
                name="confirmar_contrasena"
                value={formData.confirmar_contrasena}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-registro" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>

          <div className="registro-footer">
            <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a></p>
          </div>
        </form>
      </div>
    </div>
  )
}

export { Registro }