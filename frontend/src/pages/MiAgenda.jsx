import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './MiAgenda.css'

function MiAgenda() {
  const navigate = useNavigate()
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    cargarCitas()
  }, [fecha])

  const cargarCitas = async () => {
    try {
      const res = await fetch(`/api/doctor/citas?fecha=${fecha}`)
      const data = await res.json()
      setCitas(data)
    } catch (error) {
      console.error('Error cargando citas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAtender = (cita) => {
    navigate(`/atender-paciente/${cita.id_cita}`, { state: { cita } })
  }

  const handleInasistencia = async (citaId) => {
    if (confirm('¿Marcar al paciente como inasistente?')) {
      try {
        await fetch(`/api/citas/${citaId}/inasistencia`, { method: 'PUT' })
        cargarCitas()
      } catch (error) {
        console.error('Error:', error)
      }
    }
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      agendada: 'Agendada',
      confirmada: 'Confirmada',
      en_curso: 'En curso',
      completada: 'Completada',
      cancelada: 'Cancelada'
    }
    return estados[estado] || estado
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <div className="agenda-container">
      <header className="agenda-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h1>Mi Agenda</h1>
      </header>

      <div className="fecha-selector">
        <label>Seleccionar fecha:</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>

      <div className="citas-list">
        <h2>Citas del día</h2>
        {citas.length === 0 ? (
          <p className="sin-citas">No hay citas programadas para esta fecha</p>
        ) : (
          <div className="citas-grid">
            {citas.map(cita => (
              <div key={cita.id_cita} className={`cita-card ${cita.estado === 'completada' ? 'completada' : ''}`}>
                <div className="cita-info">
                  <h3>{cita.paciente_nombre} {cita.paciente_apellidos}</h3>
                  <p><i className="fas fa-clock"></i> {new Date(cita.fecha_hora).toLocaleTimeString()}</p>
                  <p><i className="fas fa-id-card"></i> {cita.numero_documento}</p>
                  <p><i className="fas fa-phone"></i> {cita.telefono}</p>
                  <p><i className="fas fa-tag"></i> Estado: {getEstadoBadge(cita.estado)}</p>
                  {cita.motivo && <p><i className="fas fa-comment"></i> Motivo: {cita.motivo}</p>}
                </div>
                <div className="cita-actions">
                  {cita.estado !== 'completada' && cita.estado !== 'cancelada' && (
                    <>
                      <button onClick={() => handleAtender(cita)} className="btn-atender">
                        <i className="fas fa-stethoscope"></i> Atender
                      </button>
                      <button onClick={() => handleInasistencia(cita.id_cita)} className="btn-inasistencia">
                        <i className="fas fa-user-slash"></i> Inasistencia
                      </button>
                    </>
                  )}
                  {cita.estado === 'completada' && (
                    <span className="completada-badge">✓ Atendido</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { MiAgenda }