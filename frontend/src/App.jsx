import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Index } from './pages/Index'
import { Registro } from './pages/Registro'
import { Empleados } from './pages/Empleados'
import { Reportes } from './pages/Reportes'
import { MiAgenda } from './pages/MiAgenda'
import { AtenderPaciente } from './pages/AtenderPaciente'
import { MisCitas } from './pages/MisCitas'
import { AgendarCita } from './pages/AgendarCita'
import { ResultadosExamenes } from './pages/ResultadosExamenes'
import { RecetasMedicas } from './pages/RecetasMedicas'
import { SolicitarHistoria } from './pages/SolicitarHistoria'
import { GestionarPaciente } from './pages/GestionarPaciente'
import { DoctoresDia } from './pages/DoctoresDia'
import './App.css'

function App() {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/verificar')
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setUsuario(data.usuario)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login setUsuario={setUsuario} />} />
      <Route path="/registro" element={<Registro />} />
      
      <Route path="/dashboard" element={
        usuario ? <Dashboard usuario={usuario} setUsuario={setUsuario} /> : <Navigate to="/login" />
      } />
      
      <Route path="/empleados" element={
        usuario && usuario.rol === 'administrador' ? <Empleados /> : <Navigate to="/dashboard" />
      } />
      <Route path="/reportes" element={
        usuario && usuario.rol === 'administrador' ? <Reportes /> : <Navigate to="/dashboard" />
      } />
      
      <Route path="/mi-agenda" element={
        usuario && usuario.rol === 'doctor' ? <MiAgenda usuario={usuario} /> : <Navigate to="/dashboard" />
      } />
      <Route path="/atender-paciente/:id_cita" element={
        usuario && usuario.rol === 'doctor' ? <AtenderPaciente usuario={usuario} /> : <Navigate to="/dashboard" />
      } />
      
      <Route path="/gestionar-paciente" element={
        usuario && usuario.rol === 'trabajador' ? <GestionarPaciente usuario={usuario} /> : <Navigate to="/dashboard" />
      } />
      <Route path="/doctores-agenda" element={
        usuario && usuario.rol === 'trabajador' ? <DoctoresDia usuario={usuario} /> : <Navigate to="/dashboard" />
      } />
      
      <Route path="/mis-citas" element={
        usuario && usuario.rol === 'paciente' ? <MisCitas usuario={usuario} /> : <Navigate to="/dashboard" />
      } />
      <Route path="/agendar-cita" element={
        usuario && usuario.rol === 'paciente' ? <AgendarCita usuario={usuario} /> : <Navigate to="/dashboard" />
      } />
      <Route path="/mis-resultados" element={
        usuario && usuario.rol === 'paciente' ? <ResultadosExamenes usuario={usuario} /> : <Navigate to="/dashboard" />
      } />
      <Route path="/mis-recetas" element={
        usuario && usuario.rol === 'paciente' ? <RecetasMedicas usuario={usuario} /> : <Navigate to="/dashboard" />
      } />
      <Route path="/solicitar-historia" element={
        usuario && usuario.rol === 'paciente' ? <SolicitarHistoria usuario={usuario} /> : <Navigate to="/dashboard" />
      } />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export { App }