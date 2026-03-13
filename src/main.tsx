import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { QueryProvider } from './providers/QueryProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider>
            <SettingsProvider>
                <QueryProvider>
                    <App />
                </QueryProvider>
            </SettingsProvider>
        </AuthProvider>
    </React.StrictMode>,
)
