import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './MisCitas.css'

function MisCitas({ usuario }) {
  const navigate = useNavigate()
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [reprogramando, setReprogramando] = useState(null)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevaHora, setNuevaHora] = useState('')

  useEffect(() => {
    cargarCitas()
  }, [])

  const cargarCitas = async () => {
    try {
      const res = await fetch('/api/paciente/citas')
      const data = await res.json()
      setCitas(data)
    } catch (error) {
      console.error('Error cargando citas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = async (idCita) => {
    if (confirm('¿Estás seguro de cancelar esta cita?')) {
      try {
        const res = await fetch(`/api/paciente/citas/${idCita}/cancelar`, {
          method: 'PUT'
        })
        if (res.ok) {
          alert('Cita cancelada correctamente')
          cargarCitas()
        } else {
          alert('Error al cancelar cita')
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
  }

  const handleReprogramarSubmit = async (idCita) => {
    if (!nuevaFecha || !nuevaHora) {
      alert('Seleccione una nueva fecha y hora')
      return
    }
    
    const nuevaFechaHora = `${nuevaFecha}T${nuevaHora}:00`
    
    try {
      const res = await fetch(`/api/paciente/citas/${idCita}/reprogramar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nueva_fecha_hora: nuevaFechaHora })
      })
      
      if (res.ok) {
        alert('Cita reprogramada correctamente')
        setReprogramando(null)
        cargarCitas()
      } else {
        const error = await res.json()
        alert(error.error || 'Error al reprogramar')
      }
    } catch (error) {
      console.error('Error:', error)
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

  const getEstadoClass = (estado) => {
    return `estado-badge estado-${estado}`
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <div className="mis-citas-container">
      <header className="mis-citas-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h1>Mis Citas</h1>
        <button onClick={() => navigate('/agendar-cita')} className="btn-agendar">
          <i className="fas fa-plus"></i> Agendar Cita
        </button>
      </header>

      {citas.length === 0 ? (
        <div className="sin-citas">
          <i className="fas fa-calendar-times"></i>
          <p>No tienes citas agendadas</p>
          <button onClick={() => navigate('/agendar-cita')} className="btn-agendar-primario">
            Agendar una cita
          </button>
        </div>
      ) : (
        <div className="citas-list">
          {citas.map(cita => (
            <div key={cita.id_cita} className="cita-card">
              <div className="cita-fecha">
                <span className="fecha-dia">{new Date(cita.fecha_hora).toLocaleDateString()}</span>
                <span className="fecha-hora">{new Date(cita.fecha_hora).toLocaleTimeString()}</span>
              </div>
              <div className="cita-info">
                <h3>Dr. {cita.doctor_nombre} {cita.doctor_apellidos}</h3>
                <p><i className="fas fa-stethoscope"></i> {cita.especialidad || 'Oftalmólogo'}</p>
                {cita.motivo && <p><i className="fas fa-comment"></i> Motivo: {cita.motivo}</p>}
              </div>
              <div className="cita-estado">
                <span className={getEstadoClass(cita.estado)}>
                  {getEstadoBadge(cita.estado)}
                </span>
              </div>
              <div className="cita-actions">
                {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                  <>
                    {reprogramando === cita.id_cita ? (
                      <div className="reprogramar-form">
                        <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
                        <input type="time" value={nuevaHora} onChange={(e) => setNuevaHora(e.target.value)} step="1800" />
                        <button onClick={() => handleReprogramarSubmit(cita.id_cita)} className="btn-confirmar">
                          Confirmar
                        </button>
                        <button onClick={() => setReprogramando(null)} className="btn-cancelar-small">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => {
                          setReprogramando(cita.id_cita)
                          const fecha = new Date(cita.fecha_hora)
                          setNuevaFecha(fecha.toISOString().split('T')[0])
                          setNuevaHora(fecha.toTimeString().slice(0,5))
                        }} className="btn-reprogramar">
                          <i className="fas fa-calendar-alt"></i> Reprogramar
                        </button>
                        <button onClick={() => handleCancelar(cita.id_cita)} className="btn-cancelar">
                          <i className="fas fa-times"></i> Cancelar
                        </button>
                      </>
                    )}
                  </>
                )}
                {cita.estado === 'completada' && (
                  <div className="cita-completada-actions">
                    <button onClick={() => navigate(`/mis-resultados?cita=${cita.id_cita}`)} className="btn-resultados">
                      <i className="fas fa-flask"></i> Ver Resultados
                    </button>
                    <button onClick={() => navigate(`/mis-recetas?cita=${cita.id_cita}`)} className="btn-receta">
                      <i className="fas fa-prescription-bottle"></i> Ver Receta
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { MisCitas }