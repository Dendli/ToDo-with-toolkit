import axios from 'axios';

// Базовый URL: замените на ваш репозиторий на typicode
const BASE_URL = 'https://my-json-server.typicode.com/King-757/ToDo-with-toolkit';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const todoAPI = {
  getAll: () => api.get('/todos'),
  getById: (id) => api.get(`/todos/${id}`),
  create: (data) => api.post('/todos', data),
  update: (id, data) => api.put(`/todos/${id}`, data),
  remove: (id) => api.delete(`/todos/${id}`),
  
  // Методы для подкатегорий
  addSubtask: (todoId, subtask) => 
    api.patch(`/todos/${todoId}`, {
      subtasks: [...(subtask.subtasks || []), subtask]
    }),
  
  updateSubtask: (todoId, subtaskId, updatedData) =>
    api.get(`/todos/${todoId}`).then(res => {
      const updatedSubtasks = res.data.subtasks?.map(st =>
        st.id === subtaskId ? { ...st, ...updatedData } : st
      ) || [];
      return api.patch(`/todos/${todoId}`, { subtasks: updatedSubtasks });
    }),
  
  removeSubtask: (todoId, subtaskId) =>
    api.get(`/todos/${todoId}`).then(res => {
      const filtered = res.data.subtasks?.filter(st => st.id !== subtaskId) || [];
      return api.patch(`/todos/${todoId}`, { subtasks: filtered });
    }),
};

export default api;