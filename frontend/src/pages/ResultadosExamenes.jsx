import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './ResultadosExamenes.css'

function ResultadosExamenes({ usuario }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const citaId = searchParams.get('cita')
  
  const [examenes, setExamenes] = useState([])
  const [examenSeleccionado, setExamenSeleccionado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  useEffect(() => {
    cargarExamenes()
  }, [])

  const cargarExamenes = async () => {
    try {
      let url = '/api/paciente/examenes'
      const res = await fetch(url)
      const data = await res.json()
      setExamenes(data)
      
      if (citaId && data.length > 0) {
        const examenDeCita = data.find(ex => ex.id_cita === parseInt(citaId))
        if (examenDeCita) {
          verDetalle(examenDeCita.id_examen)
        }
      }
    } catch (error) {
      console.error('Error cargando exámenes:', error)
    } finally {
      setLoading(false)
    }
  }

  const verDetalle = async (idExamen) => {
    setCargandoDetalle(true)
    try {
      const res = await fetch(`/api/paciente/examenes/${idExamen}`)
      const data = await res.json()
      setExamenSeleccionado(data)
    } catch (error) {
      console.error('Error cargando detalle:', error)
    } finally {
      setCargandoDetalle(false)
    }
  }

  const getEstadoResultado = (resultados) => {
    if (!resultados || resultados === 'Pendiente' || resultados === '') {
      return { texto: 'Pendiente', clase: 'pendiente' }
    }
    return { texto: 'Completado', clase: 'completado' }
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <div className="resultados-container">
      <header className="resultados-header">
        <button onClick={() => navigate('/mis-citas')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h1>Resultados de Exámenes</h1>
      </header>

      {examenes.length === 0 ? (
        <div className="sin-examenes">
          <i className="fas fa-flask"></i>
          <p>No tienes exámenes registrados</p>
          <button onClick={() => navigate('/agendar-cita')} className="btn-agendar">
            Agendar una cita
          </button>
        </div>
      ) : (
        <div className="examenes-layout">
          {/* Lista de exámenes */}
          <div className="examenes-lista">
            <h3>Mis Exámenes</h3>
            {examenes.map(ex => {
              const estado = getEstadoResultado(ex.resultados)
              return (
                <div 
                  key={ex.id_examen} 
                  className={`examen-card ${examenSeleccionado?.id_examen === ex.id_examen ? 'active' : ''}`}
                  onClick={() => verDetalle(ex.id_examen)}
                >
                  <div className="examen-icon">
                    <i className="fas fa-microscope"></i>
                  </div>
                  <div className="examen-info">
                    <h4>{ex.nombre_examen}</h4>
                    <p>{new Date(ex.fecha_realizacion).toLocaleDateString()}</p>
                    <p className="doctor-nombre">Dr. {ex.doctor_nombre} {ex.doctor_apellidos}</p>
                  </div>
                  <div className="examen-estado">
                    <span className={`estado-badge estado-${estado.clase}`}>
                      {estado.texto}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="examen-detalle">
            {cargandoDetalle ? (
              <div className="detalle-loading">Cargando detalles...</div>
            ) : examenSeleccionado ? (
              <>
                <h3>Detalle del Examen</h3>
                <div className="detalle-info">
                  <p><strong>Examen:</strong> {examenSeleccionado.nombre_examen}</p>
                  <p><strong>Fecha:</strong> {new Date(examenSeleccionado.fecha_realizacion).toLocaleString()}</p>
                  <p><strong>Doctor:</strong> Dr. {examenSeleccionado.doctor_nombre} {examenSeleccionado.doctor_apellidos}</p>
                  {examenSeleccionado.precio_base && (
                    <p><strong>Precio base:</strong> ${examenSeleccionado.precio_base.toLocaleString()}</p>
                  )}
                </div>
                
                <div className="detalle-resultados">
                  <h4>Resultados</h4>
                  <div className="resultados-contenido">
                    {examenSeleccionado.resultados && examenSeleccionado.resultados !== 'Pendiente' ? (
                      <pre>{examenSeleccionado.resultados}</pre>
                    ) : (
                      <p className="pendiente-mensaje">
                        <i className="fas fa-hourglass-half"></i> 
                        Los resultados de este examen están pendientes. Serán publicados por el médico tratante.
                      </p>
                    )}
                  </div>
                </div>

                {examenSeleccionado.archivo_adjunto && (
                  <div className="detalle-archivo">
                    <h4>Archivo adjunto</h4>
                    <a href={examenSeleccionado.archivo_adjunto} target="_blank" rel="noopener noreferrer">
                      <i className="fas fa-file-pdf"></i> Ver documento
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="detalle-placeholder">
                <i className="fas fa-flask"></i>
                <p>Selecciona un examen para ver sus resultados</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { ResultadosExamenes }