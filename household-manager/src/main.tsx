import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppDataProvider } from './lib/store.tsx'
import AppLock from './components/AppLock.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppDataProvider>
      <AppLock>
        <App />
      </AppLock>
    </AppDataProvider>
  </StrictMode>,
)
