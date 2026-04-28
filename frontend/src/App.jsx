import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodoFromServer,
  setSyncMode,
  setSelectedCategory,
  addTodoLocal,
  toggleTodoLocal,
  deleteTodoLocal,
  addSubtaskLocal,
  toggleSubtaskLocal,
  clearError,
} from './features/todos/todosSlice';
import './App.css';

function App() {
  const [newTodo, setNewTodo] = useState('');
  const [newSubtask, setNewSubtask] = useState({});
  
  const dispatch = useDispatch();
  const todos = useSelector(state => state.todos.items);
  const syncMode = useSelector(state => state.todos.syncMode);
  const selectedCategory = useSelector(state => state.todos.selectedCategory);
  const loading = useSelector(state => state.todos.loading);
  const error = useSelector(state => state.todos.error);

  const categories = ['all', 'general', 'work', 'personal', 'shopping'];

  const filteredTodos = selectedCategory === 'all'
    ? todos
    : todos.filter(t => t.category === selectedCategory);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const todoData = {
      title: newTodo.trim(),
      category: selectedCategory !== 'all' ? selectedCategory : 'general',
    };

    if (syncMode === 'server') {
      dispatch(createTodo(todoData));
    } else {
      dispatch(addTodoLocal(todoData));
    }
    setNewTodo('');
  };

  const handleToggleTodo = async (id) => {
    if (syncMode === 'server') {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        dispatch(updateTodo({ id, updates: { ...todo, completed: !todo.completed } }));
      }
    } else {
      dispatch(toggleTodoLocal(id));
    }
  };

  const handleDeleteTodo = async (id) => {
    if (syncMode === 'server' && !id.startsWith('local_')) {
      dispatch(deleteTodoFromServer(id));
    } else {
      dispatch(deleteTodoLocal(id));
    }
  };

  const handleAddSubtask = async (todoId, title) => {
    if (!title.trim()) return;

    if (syncMode === 'server') {
      const todo = todos.find(t => t.id === todoId);
      if (todo) {
        const updatedSubtasks = [...(todo.subtasks || []), {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          title: title.trim(),
          completed: false,
        }];
        dispatch(updateTodo({ id: todoId, updates: { ...todo, subtasks: updatedSubtasks } }));
      }
    } else {
      dispatch(addSubtaskLocal({ todoId, title }));
    }
    setNewSubtask(prev => ({ ...prev, [todoId]: '' }));
  };

  const handleToggleSubtask = async (todoId, subtaskId) => {
    if (syncMode === 'server') {
      const todo = todos.find(t => t.id === todoId);
      if (todo && todo.subtasks) {
        const updatedSubtasks = todo.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        dispatch(updateTodo({ id: todoId, updates: { ...todo, subtasks: updatedSubtasks } }));
      }
    } else {
      dispatch(toggleSubtaskLocal({ todoId, subtaskId }));
    }
  };

  const handleSyncModeChange = (mode) => {
    dispatch(setSyncMode(mode));
    if (mode === 'server') {
      dispatch(fetchTodos());
    }
  };

  const handleRefresh = () => {
    if (syncMode === 'server') {
      dispatch(fetchTodos());
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 ToDo List</h1>
        <div className="sync-toggle">
          <label>
            <input
              type="radio"
              checked={syncMode === 'local'}
              onChange={() => handleSyncModeChange('local')}
            />
            Локально
          </label>
          <label>
            <input
              type="radio"
              checked={syncMode === 'server'}
              onChange={() => handleSyncModeChange('server')}
            />
            Сервер
          </label>
          {syncMode === 'server' && (
            <button onClick={handleRefresh} disabled={loading}>
              {loading ? 'Загрузка...' : 'Обновить'}
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => dispatch(clearError())}>×</button>
        </div>
      )}

      <form onSubmit={handleAddTodo} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Новая задача..."
          className="todo-input"
        />
        <select
          value={selectedCategory}
          onChange={(e) => dispatch(setSelectedCategory(e.target.value))}
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
                onChange={() => handleToggleTodo(todo.id)}
              />
              <span className="todo-title">{todo.title}</span>
              <span className="todo-category">{todo.category}</span>
              <button onClick={() => handleDeleteTodo(todo.id)} className="delete-btn">×</button>
            </div>

            <ul className="subtasks">
              {todo.subtasks?.map(sub => (
                <li key={sub.id} className={`subtask ${sub.completed ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => handleToggleSubtask(todo.id, sub.id)}
                  />
                  <span>{sub.title}</span>
                </li>
              ))}
            </ul>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleAddSubtask(todo.id, newSubtask[todo.id] || '');
              }} 
              className="add-subtask-form"
            >
              <input
                type="text"
                value={newSubtask[todo.id] || ''}
                onChange={(e) => setNewSubtask(prev => ({ ...prev, [todo.id]: e.target.value }))}
                placeholder="+ подзадача"
                className="subtask-input"
              />
            </form>
          </li>
        ))}
      </ul>

      {filteredTodos.length === 0 && (
        <p className="empty-state">Задач нет. Добавьте первую!</p>
      )}
    </div>
  );
}

export default App;