import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './SolicitarHistoria.css'

function SolicitarHistoria({ usuario }) {
  const navigate = useNavigate()
  const [historia, setHistoria] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    cargarHistoria()
  }, [])

  const cargarHistoria = async () => {
    try {
      const res = await fetch('/api/paciente/historia-completa')
      const data = await res.json()
      setHistoria(data)
    } catch (error) {
      console.error('Error cargando historia:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSolicitar = async () => {
    setEnviando(true)
    try {
      const res = await fetch('/api/paciente/solicitar-historia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
      })
      
      if (res.ok) {
        setMostrarConfirmacion(true)
        setTimeout(() => {
          setMostrarConfirmacion(false)
          navigate('/dashboard')
        }, 3000)
      } else {
        alert('Error al enviar la solicitud')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setEnviando(false)
    }
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      agendada: 'Agendada',
      confirmrada: 'Confirmada',
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
    <div className="solicitar-container">
      <header className="solicitar-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h1>Historia Clínica</h1>
      </header>

      {mostrarConfirmacion && (
        <div className="confirmacion-modal">
          <div className="confirmacion-content">
            <i className="fas fa-check-circle"></i>
            <h3>Solicitud Enviada</h3>
            <p>Su solicitud ha sido registrada. En breve nos pondremos en contacto con usted para entregarle su historia clínica.</p>
          </div>
        </div>
      )}

      {historia && historia.paciente && (
        <div className="paciente-resumen">
          <h2>{historia.paciente.nombre} {historia.paciente.apellidos}</h2>
          <div className="info-grid">
            <p><strong>Documento:</strong> {historia.paciente.tipo_documento} - {historia.paciente.numero_documento}</p>
            <p><strong>Sexo:</strong> {historia.paciente.sexo === 'hombre' ? 'Hombre' : 'Mujer'}</p>
            <p><strong>Teléfono:</strong> {historia.paciente.telefono}</p>
            <p><strong>Correo:</strong> {historia.paciente.correo}</p>
            <p><strong>Paciente desde:</strong> {new Date(historia.paciente.fecha_registro).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {historia && (
        <div className="stats-resumen">
          <div className="stat-item">
            <i className="fas fa-calendar-check"></i>
            <span>{historia.citas?.length || 0} Citas</span>
          </div>
          <div className="stat-item">
            <i className="fas fa-flask"></i>
            <span>{historia.examenes?.length || 0} Exámenes</span>
          </div>
          <div className="stat-item">
            <i className="fas fa-prescription"></i>
            <span>{historia.citas?.filter(c => c.tratamiento).length || 0} Recetas</span>
          </div>
        </div>
      )}

      <div className="solicitud-formulario">
        <h3>Solicitar Historia Clínica</h3>
        <p className="info-solicitud">
          Si necesitas tu historia clínica completa en formato físico o digital, puedes solicitarla aquí.
          Te contactaremos para coordinar la entrega.
        </p>
        
        <div className="form-group">
          <label>Motivo de la solicitud (opcional)</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows="3"
            placeholder="Ej: Cambio de médico, Trámite médico legal, Referencia a otra institución, etc."
          />
        </div>
        
        <button 
          onClick={handleSolicitar} 
          className="btn-solicitar"
          disabled={enviando}
        >
          {enviando ? 'Enviando solicitud...' : 'Solicitar Historia Clínica'}
        </button>
      </div>

      {historia && historia.citas && historia.citas.length > 0 && (
        <div className="actividad-reciente">
          <h3>Actividad reciente</h3>
          <div className="actividad-lista">
            {historia.citas.slice(0, 5).map(cita => (
              <div key={cita.id_cita} className="actividad-item">
                <div className="actividad-fecha">
                  {new Date(cita.fecha_hora).toLocaleDateString()}
                </div>
                <div className="actividad-info">
                  <span className="actividad-tipo">Cita con Dr. {cita.doctor_nombre} {cita.doctor_apellidos}</span>
                  <span className={`actividad-estado ${cita.estado}`}>{getEstadoBadge(cita.estado)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { SolicitarHistoria }