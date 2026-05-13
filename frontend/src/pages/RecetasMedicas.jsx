import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './RecetasMedicas.css'

function RecetasMedicas({ usuario }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const citaId = searchParams.get('cita')
  
  const [recetas, setRecetas] = useState([])
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  useEffect(() => {
    cargarRecetas()
  }, [])

  const cargarRecetas = async () => {
    try {
      const res = await fetch('/api/paciente/recetas')
      const data = await res.json()
      setRecetas(data)
      
      if (citaId && data.length > 0) {
        const recetaDeCita = data.find(r => r.id_cita === parseInt(citaId))
        if (recetaDeCita) {
          verDetalle(recetaDeCita.id_diagnostico)
        }
      }
    } catch (error) {
      console.error('Error cargando recetas:', error)
    } finally {
      setLoading(false)
    }
  }

  const verDetalle = async (idDiagnostico) => {
    setCargandoDetalle(true)
    try {
      const res = await fetch(`/api/paciente/recetas/${idDiagnostico}`)
      const data = await res.json()
      setRecetaSeleccionada(data)
    } catch (error) {
      console.error('Error cargando detalle:', error)
    } finally {
      setCargandoDetalle(false)
    }
  }

  // Función para extraer la receta del texto de tratamiento
  const extraerReceta = (tratamiento) => {
    if (!tratamiento) return null
    
    const recetaMatch = tratamiento.match(/RECETA:\s*([\s\S]*?)(?=\n\n|$)/i)
    if (recetaMatch) {
      return recetaMatch[1].trim()
    }
    return tratamiento
  }

  // Verificar si tiene receta
  const tieneReceta = (tratamiento) => {
    return tratamiento && tratamiento.trim() !== ''
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  const recetasConTratamiento = recetas.filter(r => tieneReceta(r.tratamiento))

  return (
    <div className="recetas-container">
      <header className="recetas-header">
        <button onClick={() => navigate('/mis-citas')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h1>Mis Recetas Médicas</h1>
      </header>

      {recetasConTratamiento.length === 0 ? (
        <div className="sin-recetas">
          <i className="fas fa-prescription-bottle"></i>
          <p>No tienes recetas médicas registradas</p>
          <button onClick={() => navigate('/agendar-cita')} className="btn-agendar">
            Agendar una cita
          </button>
        </div>
      ) : (
        <div className="recetas-layout">
          <div className="recetas-lista">
            <h3>Mis Recetas</h3>
            {recetasConTratamiento.map(rec => (
              <div 
                key={rec.id_diagnostico} 
                className={`receta-card ${recetaSeleccionada?.id_diagnostico === rec.id_diagnostico ? 'active' : ''}`}
                onClick={() => verDetalle(rec.id_diagnostico)}
              >
                <div className="receta-icon">
                  <i className="fas fa-prescription"></i>
                </div>
                <div className="receta-info">
                  <h4>{new Date(rec.fecha_hora).toLocaleDateString()}</h4>
                  <p>Dr. {rec.doctor_nombre} {rec.doctor_apellidos}</p>
                </div>
                <div className="receta-flecha">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            ))}
          </div>

          <div className="receta-detalle">
            {cargandoDetalle ? (
              <div className="detalle-loading">Cargando detalles...</div>
            ) : recetaSeleccionada ? (
              <>
                <div className="detalle-header">
                  <h3>Receta Médica</h3>
                  <span className="receta-fecha">
                    {new Date(recetaSeleccionada.fecha_hora).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="detalle-doctor">
                  <i className="fas fa-user-md"></i>
                  <div>
                    <p><strong>Dr. {recetaSeleccionada.doctor_nombre} {recetaSeleccionada.doctor_apellidos}</strong></p>
                    <p className="especialidad">{recetaSeleccionada.especialidad || 'Oftalmólogo'}</p>
                  </div>
                </div>

                <div className="detalle-receta">
                  <h4>Indicaciones / Tratamiento</h4>
                  <div className="receta-contenido">
                    <pre>{extraerReceta(recetaSeleccionada.tratamiento)}</pre>
                  </div>
                </div>

                {recetaSeleccionada.observaciones && (
                  <div className="detalle-observaciones">
                    <h4>Observaciones adicionales</h4>
                    <p>{recetaSeleccionada.observaciones}</p>
                  </div>
                )}

                <div className="detalle-diagnostico">
                  <h4>Diagnóstico asociado</h4>
                  <p>{recetaSeleccionada.diagnostico}</p>
                </div>

                <button 
                  className="btn-imprimir"
                  onClick={() => window.print()}
                >
                  <i className="fas fa-print"></i> Imprimir / Guardar
                </button>
              </>
            ) : (
              <div className="detalle-placeholder">
                <i className="fas fa-prescription-bottle"></i>
                <p>Selecciona una receta para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { RecetasMedicas }