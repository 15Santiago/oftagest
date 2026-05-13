import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Reportes.css'

function Reportes() {
  const navigate = useNavigate()
  const [estadisticas, setEstadisticas] = useState(null)
  const [citasFiltradas, setCitasFiltradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    doctorId: '',
    estado: ''
  })
  const [doctores, setDoctores] = useState([])

  useEffect(() => {
    cargarDatos()
    cargarDoctores()
  }, [])

  const cargarDatos = async () => {
    try {
      const res = await fetch('/api/reportes/estadisticas')
      const data = await res.json()
      setEstadisticas(data)
    } catch (error) {
      console.error('Error cargando estadisticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarDoctores = async () => {
    try {
      const res = await fetch('/api/doctores')
      const data = await res.json()
      setDoctores(data)
    } catch (error) {
      console.error('Error cargando doctores:', error)
    }
  }

  const handleFiltroChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    })
  }

  const aplicarFiltros = async () => {
    try {
      const params = new URLSearchParams()
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio)
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin)
      if (filtros.doctorId) params.append('doctorId', filtros.doctorId)
      if (filtros.estado) params.append('estado', filtros.estado)

      const res = await fetch(`/api/reportes/citas?${params}`)
      const data = await res.json()
      setCitasFiltradas(data)
    } catch (error) {
      console.error('Error filtrando citas:', error)
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
    <div className="reportes-container">
      <header className="reportes-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        <h1>Reportes de Gestión</h1>
      </header>

      {estadisticas && (
        <div className="stats-grid">
          <div className="stat-card">
            <i className="fas fa-users"></i>
            <div className="stat-info">
              <h3>{estadisticas.totalPacientes}</h3>
              <p>Pacientes Registrados</p>
            </div>
          </div>
          <div className="stat-card">
            <i className="fas fa-calendar-check"></i>
            <div className="stat-info">
              <h3>{estadisticas.totalCitas}</h3>
              <p>Total de Citas</p>
            </div>
          </div>
          <div className="stat-card">
            <i className="fas fa-user-md"></i>
            <div className="stat-info">
              <h3>{estadisticas.doctoresActivos}</h3>
              <p>Doctores Activos</p>
            </div>
          </div>
        </div>
      )}

      {estadisticas && estadisticas.citasPorEstado && (
        <div className="chart-section">
          <h3>Citas por Estado</h3>
          <div className="estados-grid">
            {estadisticas.citasPorEstado.map((item, idx) => (
              <div key={idx} className="estado-item">
                <span className="estado-nombre">{getEstadoBadge(item.estado)}</span>
                <span className="estado-cantidad">{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filtros-section">
        <h3>Filtrar Citas</h3>
        <div className="filtros-grid">
          <div className="form-group">
            <label>Fecha Inicio</label>
            <input type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={handleFiltroChange} />
          </div>
          <div className="form-group">
            <label>Fecha Fin</label>
            <input type="date" name="fechaFin" value={filtros.fechaFin} onChange={handleFiltroChange} />
          </div>
          <div className="form-group">
            <label>Doctor</label>
            <select name="doctorId" value={filtros.doctorId} onChange={handleFiltroChange}>
              <option value="">Todos</option>
              {doctores.map(doc => (
                <option key={doc.id_empleado} value={doc.id_empleado}>
                  {doc.nombre} {doc.apellidos}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select name="estado" value={filtros.estado} onChange={handleFiltroChange}>
              <option value="">Todos</option>
              <option value="agendada">Agendada</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_curso">En curso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
        <button onClick={aplicarFiltros} className="btn-filtrar">
          <i className="fas fa-search"></i> Aplicar Filtros
        </button>
      </div>

      {citasFiltradas.length > 0 && (
        <div className="citas-table-container">
          <h3>Resultados ({citasFiltradas.length} citas)</h3>
          <table className="citas-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Doctor</th>
                <th>Fecha y Hora</th>
                <th>Estado</th>
                <th>Motivo</th>
               </tr>
            </thead>
            <tbody>
              {citasFiltradas.map(cita => (
                <tr key={cita.id_cita}>
                  <td>{cita.paciente_nombre} {cita.paciente_apellidos}</td>
                  <td>{cita.doctor_nombre} {cita.doctor_apellidos}</td>
                  <td>{new Date(cita.fecha_hora).toLocaleString()}</td>
                  <td>{getEstadoBadge(cita.estado)}</td>
                  <td>{cita.motivo || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {citasFiltradas.length === 0 && (
        <div className="sin-resultados">
          <p>No hay citas para mostrar. Aplica filtros para buscar.</p>
        </div>
      )}
    </div>
  )
}

export { Reportes }