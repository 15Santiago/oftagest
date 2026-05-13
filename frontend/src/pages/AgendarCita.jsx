import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AgendarCita.css'

function AgendarCita({ usuario }) {
  const navigate = useNavigate()
  const [doctores, setDoctores] = useState([])
  const [doctorSeleccionado, setDoctorSeleccionado] = useState('')
  const [horarios, setHorarios] = useState({})
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [horaSeleccionada, setHoraSeleccionada] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [cargandoHorarios, setCargandoHorarios] = useState(false)

  useEffect(() => {
    cargarDoctores()
  }, [])

  const cargarDoctores = async () => {
    try {
      const res = await fetch('/api/paciente/doctores')
      const data = await res.json()
      setDoctores(data)
    } catch (error) {
      console.error('Error cargando doctores:', error)
    }
  }

  const cargarHorarios = async (doctorId) => {
    setCargandoHorarios(true)
    try {
      const res = await fetch(`/api/paciente/horarios/${doctorId}`)
      const data = await res.json()
      setHorarios(data)
    } catch (error) {
      console.error('Error cargando horarios:', error)
    } finally {
      setCargandoHorarios(false)
    }
  }

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value
    setDoctorSeleccionado(doctorId)
    setFechaSeleccionada('')
    setHoraSeleccionada('')
    if (doctorId) {
      cargarHorarios(doctorId)
    } else {
      setHorarios({})
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!doctorSeleccionado || !fechaSeleccionada || !horaSeleccionada) {
      alert('Por favor complete todos los campos')
      return
    }
    
    const fechaHora = `${fechaSeleccionada}T${horaSeleccionada}:00`
    
    setLoading(true)
    try {
      const res = await fetch('/api/paciente/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_doctor: doctorSeleccionado,
          fecha_hora: fechaHora,
          motivo: motivo
        })
      })
      
      if (res.ok) {
        alert('Cita agendada correctamente')
        navigate('/mis-citas')
      } else {
        const error = await res.json()
        alert(error.error || 'Error al agendar cita')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="agendar-cita-container">
      <header className="agendar-cita-header">
        <button onClick={() => navigate('/mis-citas')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h1>Agendar Nueva Cita</h1>
      </header>

      <form onSubmit={handleSubmit} className="agendar-form">
        <div className="form-group">
          <label>Seleccionar Especialista *</label>
          <select value={doctorSeleccionado} onChange={handleDoctorChange} required>
            <option value="">-- Seleccione un doctor --</option>
            {doctores.map(doc => (
              <option key={doc.id_empleado} value={doc.id_empleado}>
                Dr. {doc.nombre} {doc.apellidos} - {doc.especialidad || 'Oftalmólogo'}
              </option>
            ))}
          </select>
        </div>

        {doctorSeleccionado && (
          <div className="form-group">
            <label>Seleccionar Fecha *</label>
            {cargandoHorarios ? (
              <p>Cargando horarios...</p>
            ) : (
              <div className="fechas-grid">
                {Object.keys(horarios).map(fecha => (
                  <button
                    key={fecha}
                    type="button"
                    className={`fecha-btn ${fechaSeleccionada === fecha ? 'selected' : ''}`}
                    onClick={() => {
                      setFechaSeleccionada(fecha)
                      setHoraSeleccionada('')
                    }}
                  >
                    {new Date(fecha).toLocaleDateString()}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {fechaSeleccionada && horarios[fechaSeleccionada] && (
          <div className="form-group">
            <label>Seleccionar Hora *</label>
            <div className="horas-grid">
              {horarios[fechaSeleccionada].map(hora => (
                <button
                  key={hora}
                  type="button"
                  className={`hora-btn ${horaSeleccionada === hora ? 'selected' : ''}`}
                  onClick={() => setHoraSeleccionada(hora)}
                >
                  {hora}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Motivo de la consulta (opcional)</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows="3"
            placeholder="Describa el motivo de su consulta..."
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-agendar" disabled={loading}>
            {loading ? 'Agendando...' : 'Agendar Cita'}
          </button>
          <button type="button" onClick={() => navigate('/mis-citas')} className="btn-cancelar">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export { AgendarCita }