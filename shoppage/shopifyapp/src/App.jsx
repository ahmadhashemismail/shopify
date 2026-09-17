import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import Admin from './pages/Admin'
import MainPage from './pages/mainpage'
import Profile from './pages/profile'
import './App.css'

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/admin" element={<Admin />} />
     
      </Routes>
    </>
  )
}

export default App
