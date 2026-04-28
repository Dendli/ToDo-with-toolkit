import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './app/store';
import App from './App.jsx';
import './App.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Элемент #root не найден');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
}