import { StrictMode } from 'react'; 
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Элемент #root не найден');
} else {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode> {}
      <App />
    </StrictMode>
  );
}