import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import './AtenderPaciente.css'

function AtenderPaciente() {
  const navigate = useNavigate()
  const { id_cita } = useParams()
  const location = useLocation()
  const citaFromState = location.state?.cita
  
  const [cita, setCita] = useState(citaFromState || null)
  const [historia, setHistoria] = useState(null)
  const [tiposExamen, setTiposExamen] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
    examenes: []
  })
  
  const [receta, setReceta] = useState({
    medicamento: '',
    dosis: '',
    cadaHoras: '',
    duracionDias: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      if (!citaFromState) {
        const res = await fetch(`/api/citas/${id_cita}`)
        const data = await res.json()
        setCita(data)
      }
      
      const [historiaRes, tiposRes] = await Promise.all([
        fetch(`/api/paciente/historia/${citaFromState?.id_paciente || cita?.id_paciente}`),
        fetch('/api/tipos-examen')
      ])
      
      const historiaData = await historiaRes.json()
      const tiposData = await tiposRes.json()
      
      setHistoria(historiaData)
      setTiposExamen(tiposData)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAgregarExamen = () => {
    setFormData({
      ...formData,
      examenes: [...formData.examenes, { id_tipo_examen: '', resultados: '' }]
    })
  }

  const handleExamenChange = (index, field, value) => {
    const nuevosExamenes = [...formData.examenes]
    nuevosExamenes[index][field] = value
    setFormData({ ...formData, examenes: nuevosExamenes })
  }

  const handleEliminarExamen = (index) => {
    const nuevosExamenes = formData.examenes.filter((_, i) => i !== index)
    setFormData({ ...formData, examenes: nuevosExamenes })
  }

  const handleRegistrarExamen = async () => {
    for (const ex of formData.examenes) {
      if (ex.id_tipo_examen) {
        await fetch('/api/examenes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_cita: cita.id_cita,
            id_tipo_examen: ex.id_tipo_examen,
            resultados: ex.resultados
          })
        })
      }
    }
    setFormData({ ...formData, examenes: [] })
    alert('Exámenes registrados correctamente')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.diagnostico.trim()) {
      alert('El motivo de la consulta es obligatorio')
      return
    }
    
    let tratamientoCompleto = formData.tratamiento || ''
    if (receta.medicamento) {
      const recetaText = `\n\nRECETA:\nMedicamento: ${receta.medicamento}\nDosis: ${receta.dosis}\nCada: ${receta.cadaHoras} horas\nDuración: ${receta.duracionDias} días`
      tratamientoCompleto += recetaText
    }
    
    try {
      const res = await fetch('/api/doctor/atender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cita: cita.id_cita,
          diagnostico: formData.diagnostico,
          tratamiento: tratamientoCompleto,
          observaciones: formData.observaciones
        })
      })
      
      if (res.ok) {
        alert('Atención registrada correctamente')
        navigate('/mi-agenda')
      } else {
        alert('Error al registrar atención')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading || !cita || !historia) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <div className="atender-container">
      <header className="atender-header">
        <button onClick={() => navigate('/mi-agenda')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Volver a Mi Agenda
        </button>
        <h1>Atender Paciente</h1>
      </header>

      <div className="paciente-info">
        <h2>{historia.paciente?.nombre} {historia.paciente?.apellidos}</h2>
        <div className="info-grid">
          <p><strong>Documento:</strong> {historia.paciente?.numero_documento}</p>
          <p><strong>Teléfono:</strong> {historia.paciente?.telefono}</p>
          <p><strong>Correo:</strong> {historia.paciente?.correo}</p>
          <p><strong>Fecha y hora:</strong> {new Date(cita.fecha_hora).toLocaleString()}</p>
          {cita.motivo && <p><strong>Motivo de cita:</strong> {cita.motivo}</p>}
        </div>
      </div>

      <div className="historia-previa">
        <h3>Citas anteriores</h3>
        {historia.citas?.filter(c => c.id_cita !== cita.id_cita).length === 0 ? (
          <p className="sin-historia">No hay citas previas</p>
        ) : (
          <ul>
            {historia.citas?.filter(c => c.id_cita !== cita.id_cita).map(citaPrev => (
              <li key={citaPrev.id_cita}>
                <strong>{new Date(citaPrev.fecha_hora).toLocaleDateString()}</strong>
                <span>Dr. {citaPrev.doctor_nombre} {citaPrev.doctor_apellidos}</span>
                {citaPrev.diagnostico && <span className="diagnostico-preview">{citaPrev.diagnostico.substring(0, 80)}...</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="atencion-form">
        <div className="form-group">
          <label>Motivo de la consulta / Diagnóstico *</label>
          <textarea
            value={formData.diagnostico}
            onChange={(e) => setFormData({...formData, diagnostico: e.target.value})}
            required
            rows="3"
            placeholder="Describa el motivo de la consulta, síntomas y diagnóstico del paciente"
          />
        </div>

        <div className="form-group">
          <label>Tratamiento / Recomendaciones</label>
          <textarea
            value={formData.tratamiento}
            onChange={(e) => setFormData({...formData, tratamiento: e.target.value})}
            rows="2"
            placeholder="Indique el tratamiento o recomendaciones para el paciente"
          />
        </div>

        <div className="form-group">
          <label>Receta de medicamentos (opcional)</label>
          <div className="receta-grid">
            <input type="text" placeholder="Medicamento" value={receta.medicamento}
              onChange={(e) => setReceta({...receta, medicamento: e.target.value})} />
            <input type="text" placeholder="Dosis (ej: 500mg)" value={receta.dosis}
              onChange={(e) => setReceta({...receta, dosis: e.target.value})} />
            <input type="number" placeholder="Cada X horas" value={receta.cadaHoras}
              onChange={(e) => setReceta({...receta, cadaHoras: e.target.value})} />
            <input type="number" placeholder="Duración en días" value={receta.duracionDias}
              onChange={(e) => setReceta({...receta, duracionDias: e.target.value})} />
          </div>
        </div>

        <div className="form-group">
          <label>Exámenes médicos (opcional)</label>
          {formData.examenes.map((ex, idx) => (
            <div key={idx} className="examen-row">
              <select value={ex.id_tipo_examen} onChange={(e) => handleExamenChange(idx, 'id_tipo_examen', e.target.value)}>
                <option value="">Seleccionar examen</option>
                {tiposExamen.map(te => (
                  <option key={te.id_tipo_examen} value={te.id_tipo_examen}>{te.nombre_examen}</option>
                ))}
              </select>
              <input type="text" placeholder="Resultados / Observaciones" value={ex.resultados}
                onChange={(e) => handleExamenChange(idx, 'resultados', e.target.value)} />
              <button type="button" onClick={() => handleEliminarExamen(idx)} className="btn-eliminar">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAgregarExamen} className="btn-agregar">
            <i className="fas fa-plus"></i> Agregar examen
          </button>
          {formData.examenes.length > 0 && (
            <button type="button" onClick={handleRegistrarExamen} className="btn-guardar-examenes">
              <i className="fas fa-save"></i> Guardar exámenes
            </button>
          )}
        </div>

        <div className="form-group">
          <label>Observaciones adicionales</label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
            rows="2"
            placeholder="Notas adicionales, recomendaciones especiales, etc."
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-guardar">
            <i className="fas fa-save"></i> Guardar atención
          </button>
          <button type="button" onClick={() => navigate('/mi-agenda')} className="btn-cancelar">
            <i className="fas fa-times"></i> Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export { AtenderPaciente }