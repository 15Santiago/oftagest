import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GestionarPaciente.css'

function GestionarPaciente({ usuario }) {
  const navigate = useNavigate()
  const [documento, setDocumento] = useState('')
  const [paciente, setPaciente] = useState(null)
  const [citasPendientes, setCitasPendientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Estados para agendar cita
  const [mostrarAgendar, setMostrarAgendar] = useState(false)
  const [doctores, setDoctores] = useState([])
  const [doctorSeleccionado, setDoctorSeleccionado] = useState('')
  const [horarios, setHorarios] = useState({})
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [horaSeleccionada, setHoraSeleccionada] = useState('')
  const [motivoCita, setMotivoCita] = useState('')
  
  // Estados para cancelar/reprogramar
  const [accionCita, setAccionCita] = useState(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [reprogramandoId, setReprogramandoId] = useState(null)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevaHora, setNuevaHora] = useState('')

  const buscarPaciente = async () => {
    if (!documento.trim()) {
      setError('Ingrese un número de documento')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`/api/admin/buscar-paciente/${documento}`)
      if (res.status === 404) {
        setError('Paciente no encontrado')
        setPaciente(null)
        setCitasPendientes([])
      } else if (res.ok) {
        const data = await res.json()
        setPaciente(data)
        // Cargar citas pendientes
        const citasRes = await fetch(`/api/admin/citas-pendientes/${data.id_paciente}`)
        const citasData = await citasRes.json()
        setCitasPendientes(citasData)
      } else {
        setError('Error al buscar paciente')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const cargarDoctores = async () => {
    const res = await fetch('/api/admin/doctores')
    const data = await res.json()
    setDoctores(data)
  }

  const cargarHorarios = async (doctorId) => {
    const res = await fetch(`/api/admin/horarios/${doctorId}`)
    const data = await res.json()
    setHorarios(data)
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

  const handleAgendarCita = async () => {
    if (!doctorSeleccionado || !fechaSeleccionada || !horaSeleccionada) {
      alert('Complete todos los campos')
      return
    }
    
    const fechaHora = `${fechaSeleccionada}T${horaSeleccionada}:00`
    
    try {
      const res = await fetch('/api/admin/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_paciente: paciente.id_paciente,
          id_doctor: doctorSeleccionado,
          fecha_hora: fechaHora,
          motivo: motivoCita
        })
      })
      
      if (res.ok) {
        alert('Cita agendada correctamente')
        setMostrarAgendar(false)
        setDoctorSeleccionado('')
        setFechaSeleccionada('')
        setHoraSeleccionada('')
        setMotivoCita('')
        // Recargar citas pendientes
        const citasRes = await fetch(`/api/admin/citas-pendientes/${paciente.id_paciente}`)
        const citasData = await citasRes.json()
        setCitasPendientes(citasData)
      } else {
        const error = await res.json()
        alert(error.error || 'Error al agendar cita')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const handleCancelarCita = async (idCita) => {
    if (!motivoCancelacion.trim()) {
      alert('El motivo de cancelación es obligatorio')
      return
    }
    
    try {
      const res = await fetch(`/api/admin/citas/${idCita}/cancelar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo_cancelacion: motivoCancelacion })
      })
      
      if (res.ok) {
        alert('Cita cancelada correctamente')
        setAccionCita(null)
        setMotivoCancelacion('')
        // Recargar citas pendientes
        const citasRes = await fetch(`/api/admin/citas-pendientes/${paciente.id_paciente}`)
        const citasData = await citasRes.json()
        setCitasPendientes(citasData)
      } else {
        const error = await res.json()
        alert(error.error || 'Error al cancelar cita')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const handleReprogramarCita = async (idCita) => {
    if (!nuevaFecha || !nuevaHora) {
      alert('Seleccione nueva fecha y hora')
      return
    }
    
    const nuevaFechaHora = `${nuevaFecha}T${nuevaHora}:00`
    
    try {
      const res = await fetch(`/api/admin/citas/${idCita}/reprogramar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nueva_fecha_hora: nuevaFechaHora,
          motivo: `Reprogramada por administrativo. Nueva fecha: ${nuevaFecha} ${nuevaHora}`
        })
      })
      
      if (res.ok) {
        alert('Cita reprogramada correctamente')
        setReprogramandoId(null)
        setNuevaFecha('')
        setNuevaHora('')
        // Recargar citas pendientes
        const citasRes = await fetch(`/api/admin/citas-pendientes/${paciente.id_paciente}`)
        const citasData = await citasRes.json()
        setCitasPendientes(citasData)
      } else {
        const error = await res.json()
        alert(error.error || 'Error al reprogramar cita')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  return (
    <div className="gestionar-container">
      <header className="gestionar-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h1>Gestionar Paciente</h1>
      </header>

      {/* Buscador */}
      <div className="buscador-section">
        <div className="buscador-input">
          <input
            type="text"
            placeholder="Número de documento"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && buscarPaciente()}
          />
          <button onClick={buscarPaciente} disabled={loading}>
            {loading ? 'Buscando...' : <><i className="fas fa-search"></i> Buscar</>}
          </button>
        </div>
        {error && <p className="error-mensaje">{error}</p>}
      </div>

      {/* Datos del paciente */}
      {paciente && (
        <div className="paciente-info">
          <h2>{paciente.nombre} {paciente.apellidos}</h2>
          <div className="info-grid">
            <p><strong>Documento:</strong> {paciente.tipo_documento} - {paciente.numero_documento}</p>
            <p><strong>Teléfono:</strong> {paciente.telefono}</p>
            <p><strong>Correo:</strong> {paciente.correo}</p>
          </div>
          
          <div className="acciones-rapidas">
            <button onClick={() => {
              setMostrarAgendar(true)
              cargarDoctores()
            }} className="btn-agendar-rapido">
              <i className="fas fa-calendar-plus"></i> Agendar Cita
            </button>
          </div>
        </div>
      )}

      {/* Formulario agendar cita */}
      {mostrarAgendar && paciente && (
        <div className="modal-overlay" onClick={() => setMostrarAgendar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Agendar Cita para {paciente.nombre}</h3>
            
            <div className="form-group">
              <label>Doctor *</label>
              <select value={doctorSeleccionado} onChange={handleDoctorChange}>
                <option value="">-- Seleccione --</option>
                {doctores.map(doc => (
                  <option key={doc.id_empleado} value={doc.id_empleado}>
                    Dr. {doc.nombre} {doc.apellidos} - {doc.especialidad || 'Oftalmólogo'}
                  </option>
                ))}
              </select>
            </div>

            {doctorSeleccionado && (
              <>
                <div className="form-group">
                  <label>Fecha *</label>
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
                </div>

                {fechaSeleccionada && horarios[fechaSeleccionada] && (
                  <div className="form-group">
                    <label>Hora *</label>
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
              </>
            )}

            <div className="form-group">
              <label>Motivo (opcional)</label>
              <textarea value={motivoCita} onChange={(e) => setMotivoCita(e.target.value)} rows="2" />
            </div>

            <div className="modal-buttons">
              <button onClick={handleAgendarCita} className="btn-guardar">Agendar</button>
              <button onClick={() => setMostrarAgendar(false)} className="btn-cancelar">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Citas pendientes */}
      {citasPendientes.length > 0 && (
        <div className="citas-pendientes">
          <h3>Citas Pendientes</h3>
          <div className="citas-list">
            {citasPendientes.map(cita => (
              <div key={cita.id_cita} className="cita-item">
                <div className="cita-info">
                  <p><strong>Dr. {cita.doctor_nombre} {cita.doctor_apellidos}</strong></p>
                  <p>{new Date(cita.fecha_hora).toLocaleDateString()} - {new Date(cita.fecha_hora).toLocaleTimeString()}</p>
                  <p>Motivo: {cita.motivo || 'No especificado'}</p>
                </div>
                <div className="cita-acciones">
                  {reprogramandoId === cita.id_cita ? (
                    <div className="reprogramar-form">
                      <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
                      <input type="time" value={nuevaHora} onChange={(e) => setNuevaHora(e.target.value)} step="1800" />
                      <button onClick={() => handleReprogramarCita(cita.id_cita)} className="btn-confirmar">Confirmar</button>
                      <button onClick={() => setReprogramandoId(null)} className="btn-cancelar-small">Cancelar</button>
                    </div>
                  ) : accionCita === cita.id_cita ? (
                    <div className="cancelar-form">
                      <textarea
                        placeholder="Motivo de cancelación *"
                        value={motivoCancelacion}
                        onChange={(e) => setMotivoCancelacion(e.target.value)}
                        rows="2"
                      />
                      <div className="cancelar-buttons">
                        <button onClick={() => handleCancelarCita(cita.id_cita)} className="btn-confirmar">Confirmar</button>
                        <button onClick={() => setAccionCita(null)} className="btn-cancelar-small">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setReprogramandoId(cita.id_cita)} className="btn-reprogramar">
                        <i className="fas fa-calendar-alt"></i> Reprogramar
                      </button>
                      <button onClick={() => setAccionCita(cita.id_cita)} className="btn-cancelar">
                        <i className="fas fa-times"></i> Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {paciente && citasPendientes.length === 0 && (
        <div className="sin-citas">
          <p>No hay citas pendientes para este paciente</p>
        </div>
      )}
    </div>
  )
}

export { GestionarPaciente }