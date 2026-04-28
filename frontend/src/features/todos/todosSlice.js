import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { todoAPI } from '../../api';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Асинхронные thunk для серверных операций
export const fetchTodos = createAsyncThunk(
  'todos/fetchTodos',
  async (_, { rejectWithValue }) => {
    try {
      const res = await todoAPI.getAll();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createTodo = createAsyncThunk(
  'todos/createTodo',
  async (todo, { rejectWithValue }) => {
    try {
      const res = await todoAPI.create(todo);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateTodo = createAsyncThunk(
  'todos/updateTodo',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const res = await todoAPI.update(id, updates);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteTodoFromServer = createAsyncThunk(
  'todos/deleteTodoFromServer',
  async (id, { rejectWithValue }) => {
    try {
      await todoAPI.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const loadLocalTodos = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocalTodos = (todos) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('todos', JSON.stringify(todos));
  } catch (err) {
    console.error('Ошибка сохранения в localStorage:', err);
  }
};

const initialState = {
  items: loadLocalTodos(),
  syncMode: 'local', // 'local' | 'server'
  loading: false,
  error: null,
  selectedCategory: 'all',
};

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    setSyncMode: (state, action) => {
      state.syncMode = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    addTodoLocal: (state, action) => {
      const todo = {
        id: `local_${generateId()}`,
        title: action.payload.title.trim(),
        completed: false,
        category: action.payload.category,
        subtasks: [],
        createdAt: new Date().toISOString(),
      };
      state.items.push(todo);
      saveLocalTodos(state.items);
    },
    toggleTodoLocal: (state, action) => {
      const todo = state.items.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
        saveLocalTodos(state.items);
      }
    },
    deleteTodoLocal: (state, action) => {
      state.items = state.items.filter(t => t.id !== action.payload);
      saveLocalTodos(state.items);
    },
    addSubtaskLocal: (state, action) => {
      const { todoId, title } = action.payload;
      const todo = state.items.find(t => t.id === todoId);
      if (todo) {
        const subtask = {
          id: generateId(),
          title: title.trim(),
          completed: false,
        };
        if (!todo.subtasks) todo.subtasks = [];
        todo.subtasks.push(subtask);
        saveLocalTodos(state.items);
      }
    },
    toggleSubtaskLocal: (state, action) => {
      const { todoId, subtaskId } = action.payload;
      const todo = state.items.find(t => t.id === todoId);
      if (todo && todo.subtasks) {
        const subtask = todo.subtasks.find(st => st.id === subtaskId);
        if (subtask) {
          subtask.completed = !subtask.completed;
          saveLocalTodos(state.items);
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch todos
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        saveLocalTodos(action.payload);
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create todo
      .addCase(createTodo.fulfilled, (state, action) => {
        state.items.push(action.payload);
        saveLocalTodos(state.items);
      })
      // Update todo
      .addCase(updateTodo.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
          saveLocalTodos(state.items);
        }
      })
      // Delete todo
      .addCase(deleteTodoFromServer.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t.id !== action.payload);
        saveLocalTodos(state.items);
      });
  },
});

export const {
  setSyncMode,
  setSelectedCategory,
  addTodoLocal,
  toggleTodoLocal,
  deleteTodoLocal,
  addSubtaskLocal,
  toggleSubtaskLocal,
  clearError,
} = todosSlice.actions;

export default todosSlice.reducer;