import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { isSupabaseConfigured, supabaseConfigError } from './supabaseClient.js'
import ConfigurationRequired from './ConfigurationRequired.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <App />
    ) : (
      <ConfigurationRequired message={supabaseConfigError} />
    )}
  </StrictMode>,
)
