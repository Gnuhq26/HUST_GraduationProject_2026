import type { JSX } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { ToastProvider } from './components/ToastProvider';
import './App.css'

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
