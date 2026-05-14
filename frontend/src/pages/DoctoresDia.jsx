import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './DoctoresDia.css'

function DoctoresDia({ usuario }) {
  const navigate = useNavigate()
  const [doctores, setDoctores] = useState([])
  const [cargandoDoctores, setCargandoDoctores] = useState(true)
  const [doctorSeleccionado, setDoctorSeleccionado] = useState(null)
  const [agenda, setAgenda] = useState([])
  const [cargandoAgenda, setCargandoAgenda] = useState(false)
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(() => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + 7)
    return fecha.toISOString().split('T')[0]
  })
  const [rangoSeleccionado, setRangoSeleccionado] = useState('semana')

  useEffect(() => {
    cargarDoctores()
  }, [])

  const cargarDoctores = async () => {
    try {
      const res = await fetch('/api/admin/doctores-activos')
      const data = await res.json()
      setDoctores(data)
    } catch (error) {
      console.error('Error cargando doctores:', error)
    } finally {
      setCargandoDoctores(false)
    }
  }

  const cargarAgenda = async (doctorId) => {
    setCargandoAgenda(true)
    try {
      const res = await fetch(`/api/admin/agenda-doctor?doctorId=${doctorId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
      const data = await res.json()
      setAgenda(data)
    } catch (error) {
      console.error('Error cargando agenda:', error)
    } finally {
      setCargandoAgenda(false)
    }
  }

  const handleSeleccionarDoctor = (doctor) => {
    setDoctorSeleccionado(doctor)
    cargarAgenda(doctor.id_empleado)
  }

  const handleCambioRango = (tipo) => {
    const hoy = new Date()
    let inicio, fin
    
    switch (tipo) {
      case 'dia':
        inicio = hoy.toISOString().split('T')[0]
        fin = hoy.toISOString().split('T')[0]
        setRangoSeleccionado('dia')
        break
      case 'semana':
        inicio = hoy.toISOString().split('T')[0]
        fin = new Date(hoy.setDate(hoy.getDate() + 7)).toISOString().split('T')[0]
        setRangoSeleccionado('semana')
        break
      case 'mes':
        inicio = hoy.toISOString().split('T')[0]
        fin = new Date(hoy.setDate(hoy.getDate() + 30)).toISOString().split('T')[0]
        setRangoSeleccionado('mes')
        break
      default:
        return
    }
    
    setFechaInicio(inicio)
    setFechaFin(fin)
    
    if (doctorSeleccionado) {
      cargarAgenda(doctorSeleccionado.id_empleado)
    }
  }

  const handleFechasManual = () => {
    if (doctorSeleccionado && fechaInicio && fechaFin) {
      cargarAgenda(doctorSeleccionado.id_empleado)
      setRangoSeleccionado('personalizado')
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

  // Agrupar citas por fecha
  const agruparPorFecha = (citas) => {
    const grupos = {}
    citas.forEach(cita => {
      const fecha = new Date(cita.fecha_hora).toLocaleDateString()
      if (!grupos[fecha]) {
        grupos[fecha] = []
      }
      grupos[fecha].push(cita)
    })
    return grupos
  }

  const citasAgrupadas = agruparPorFecha(agenda)

  if (cargandoDoctores) {
    return <div className="loading">Cargando doctores...</div>
  }

  return (
    <div className="doctores-container">
      <header className="doctores-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h1>Doctores y Agenda</h1>
      </header>

      <div className="doctores-lista">
        <h3>Doctores Activos</h3>
        <div className="doctores-grid">
          {doctores.map(doctor => (
            <div
              key={doctor.id_empleado}
              className={`doctor-card ${doctorSeleccionado?.id_empleado === doctor.id_empleado ? 'active' : ''}`}
              onClick={() => handleSeleccionarDoctor(doctor)}
            >
              <div className="doctor-avatar">
                <i className="fas fa-user-md"></i>
              </div>
              <div className="doctor-info">
                <h4>Dr. {doctor.nombre} {doctor.apellidos}</h4>
                <p>{doctor.especialidad || 'Oftalmólogo'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {doctorSeleccionado && (
        <div className="agenda-section">
          <div className="agenda-header">
            <h3>Agenda del Dr. {doctorSeleccionado.nombre} {doctorSeleccionado.apellidos}</h3>
            
            {/* Selector de rango */}
            <div className="rango-selector">
              <button 
                className={`rango-btn ${rangoSeleccionado === 'dia' ? 'active' : ''}`}
                onClick={() => handleCambioRango('dia')}
              >
                Día
              </button>
              <button 
                className={`rango-btn ${rangoSeleccionado === 'semana' ? 'active' : ''}`}
                onClick={() => handleCambioRango('semana')}
              >
                Semana
              </button>
              <button 
                className={`rango-btn ${rangoSeleccionado === 'mes' ? 'active' : ''}`}
                onClick={() => handleCambioRango('mes')}
              >
                Mes
              </button>
            </div>

            {/* Fechas personalizadas */}
            <div className="fechas-personalizadas">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
              <span>hasta</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
              <button onClick={handleFechasManual} className="btn-aplicar">
                Aplicar
              </button>
            </div>
          </div>

          {cargandoAgenda ? (
            <div className="cargando-agenda">Cargando agenda...</div>
          ) : agenda.length === 0 ? (
            <div className="sin-citas">
              <i className="fas fa-calendar-times"></i>
              <p>No hay citas programadas en este rango de fechas</p>
            </div>
          ) : (
            <div className="agenda-contenido">
              {Object.keys(citasAgrupadas).sort().map(fecha => (
                <div key={fecha} className="agenda-dia">
                  <h4 className="dia-titulo">{fecha}</h4>
                  <div className="citas-dia">
                    {citasAgrupadas[fecha].map(cita => (
                      <div key={cita.id_cita} className="cita-agenda-item">
                        <div className="cita-hora">
                          {new Date(cita.fecha_hora).toLocaleTimeString()}
                        </div>
                        <div className="cita-paciente">
                          <strong>{cita.paciente_nombre} {cita.paciente_apellidos}</strong>
                          <span className="cita-documento">({cita.numero_documento})</span>
                          {cita.telefono && <span className="cita-telefono">📞 {cita.telefono}</span>}
                        </div>
                        <div className="cita-estado">
                          <span className={getEstadoClass(cita.estado)}>
                            {getEstadoBadge(cita.estado)}
                          </span>
                        </div>
                        {cita.motivo && (
                          <div className="cita-motivo">
                            <small>Motivo: {cita.motivo}</small>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!doctorSeleccionado && doctores.length > 0 && (
        <div className="seleccionar-mensaje">
          <i className="fas fa-arrow-left"></i>
          <p>Seleccione un doctor para ver su agenda</p>
        </div>
      )}
    </div>
  )
}

export { DoctoresDia }