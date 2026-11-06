import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

// First paint par saved theme lagao, taaki light/dark flash kam ho.
try {
  document.documentElement.classList.toggle("dark", localStorage.getItem("theme") === "dark");
} catch { /* Storage blocked ho to light mode use hoga. */ }

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>

)
