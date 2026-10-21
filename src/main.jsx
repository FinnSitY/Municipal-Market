import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import SetupRequired from './components/SetupRequired.jsx'
import AuthProvider from './context/AuthProvider.jsx'
import CartProvider from './context/CartProvider.jsx'
import MarketProvider from './context/MarketProvider.jsx'
import './index.css'
import { backendMode, configError } from './services/index.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {backendMode === 'unconfigured' ? (
      <SetupRequired reason={configError} />
    ) : (
      <BrowserRouter>
        <AuthProvider>
          <MarketProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </MarketProvider>
        </AuthProvider>
      </BrowserRouter>
    )}
  </StrictMode>,
)
