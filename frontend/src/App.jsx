import React, { useState, useEffect } from 'react';
import { todoAPI } from './api';
import { useLocalStorage } from './hooks/useLocalStorage';
import './App.css';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

function App() {
  const [todos, setTodos] = useLocalStorage('todos', []);
  const [newTodo, setNewTodo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [syncMode, setSyncMode] = useState('local'); // 'local' | 'server'

  // Загрузка с сервера при переключении режима
  useEffect(() => {
    if (syncMode === 'server') {
      loadFromServer();
    }
  }, [syncMode]);

  const loadFromServer = async () => {
    setLoading(true);
    try {
      const res = await todoAPI.getAll();
      setTodos(res.data);
    } catch (err) {
      console.error('Ошибка загрузки с сервера:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveToServer = async (updatedTodos) => {
    if (syncMode !== 'server') return;
    try {
      // Отправляем каждую задачу отдельно 
      for (const todo of updatedTodos) {
        if (todo.id && !todo.id.startsWith('local_')) {
          await todoAPI.update(todo.id, todo);
        } else {
          await todoAPI.create(todo);
        }
      }
    } catch (err) {
      console.error('Ошибка сохранения на сервер:', err);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const todo = {
      id: syncMode === 'server' ? undefined : `local_${generateId()}`,
      title: newTodo.trim(),
      completed: false,
      category: selectedCategory !== 'all' ? selectedCategory : 'general',
      subtasks: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [...todos, todo];
    setTodos(updated);
    setNewTodo('');
    await saveToServer(updated);
  };

  const toggleTodo = async (id) => {
    const updated = todos.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTodos(updated);
    await saveToServer(updated);
  };

  const deleteTodo = async (id) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    if (syncMode === 'server' && !id.startsWith('local_')) {
      try {
        await todoAPI.remove(id);
      } catch (err) {
        console.error('Ошибка удаления с сервера:', err);
      }
    } else {
      await saveToServer(updated);
    }
  };

  const addSubtask = async (todoId, title) => {
    if (!title.trim()) return;
    const subtask = { id: generateId(), title, completed: false };
    const updated = todos.map(t =>
      t.id === todoId
        ? { ...t, subtasks: [...(t.subtasks || []), subtask] }
        : t
    );
    setTodos(updated);
    await saveToServer(updated);
  };

  const toggleSubtask = async (todoId, subtaskId) => {
    const updated = todos.map(t => {
      if (t.id === todoId) {
        return {
          ...t,
          subtasks: t.subtasks?.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
        };
      }
      return t;
    });
    setTodos(updated);
    await saveToServer(updated);
  };

  const categories = ['all', 'general', 'work', 'personal', 'shopping'];

  const filteredTodos = selectedCategory === 'all'
    ? todos
    : todos.filter(t => t.category === selectedCategory);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 ToDo List</h1>
        <div className="sync-toggle">
          <label>
            <input
              type="radio"
              checked={syncMode === 'local'}
              onChange={() => setSyncMode('local')}
            />
            Локально
          </label>
          <label>
            <input
              type="radio"
              checked={syncMode === 'server'}
              onChange={() => setSyncMode('server')}
            />
            Сервер
          </label>
          {syncMode === 'server' && (
            <button onClick={loadFromServer} disabled={loading}>
              {loading ? 'Загрузка...' : 'Обновить'}
            </button>
          )}
        </div>
      </header>

      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Новая задача..."
          className="todo-input"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'Все категории' : cat}
            </option>
          ))}
        </select>
        <button type="submit" className="add-btn">+</button>
      </form>

      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <div className="todo-header">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span className="todo-title">{todo.title}</span>
              <span className="todo-category">{todo.category}</span>
              <button onClick={() => deleteTodo(todo.id)} className="delete-btn">×</button>
            </div>

            {/* Подкатегории */}
            <ul className="subtasks">
              {todo.subtasks?.map(sub => (
                <li key={sub.id} className={`subtask ${sub.completed ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => toggleSubtask(todo.id, sub.id)}
                  />
                  <span>{sub.title}</span>
                </li>
              ))}
            </ul>
            <AddSubtaskForm onAdd={(title) => addSubtask(todo.id, title)} />
          </li>
        ))}
      </ul>

      {filteredTodos.length === 0 && (
        <p className="empty-state">Задач нет. Добавьте первую!</p>
      )}
    </div>
  );
}

// Компонент добавления подзадачи
function AddSubtaskForm({ onAdd }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value);
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-subtask-form">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="+ подзадача"
        className="subtask-input"
      />
    </form>
  );
}

export default App;