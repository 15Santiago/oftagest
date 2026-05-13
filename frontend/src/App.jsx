import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Index } from './pages/Index'
import { Registro } from './pages/Registro'
import { Empleados } from './pages/Empleados'
import { Reportes } from './pages/Reportes'
import './App.css'

// Componentes por rol (temporales)
const MiAgenda = () => <h2>Mi Agenda</h2>
const AtenderCita = () => <h2>Atender Cita</h2>
const GestionCitas = () => <h2>Gestión de Citas</h2>
const BuscarPaciente = () => <h2>Buscar Paciente</h2>
const MisCitas = () => <h2>Mis Citas</h2>

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
        usuario ? <Empleados /> : <Navigate to="/login" />
      } />
      <Route path="/reportes" element={
        usuario ? <Reportes /> : <Navigate to="/login" />
      } />
      <Route path="/mi-agenda" element={
        usuario ? <MiAgenda /> : <Navigate to="/login" />
      } />
      <Route path="/atender-cita/:id" element={
        usuario ? <AtenderCita /> : <Navigate to="/login" />
      } />
      <Route path="/gestion-citas" element={
        usuario ? <GestionCitas /> : <Navigate to="/login" />
      } />
      <Route path="/buscar-paciente" element={
        usuario ? <BuscarPaciente /> : <Navigate to="/login" />
      } />
      <Route path="/mis-citas" element={
        usuario ? <MisCitas /> : <Navigate to="/login" />
      } />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export { App }