import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { classAPI } from '../../utils/api';
import toast from 'react-hot-toast';

// ──── Async Thunks ────────────────────────────────────────────────

export const fetchClasses = createAsyncThunk(
  'classes/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await classAPI.getClasses();
      return data.classes;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch classes');
    }
  }
);

export const fetchClass = createAsyncThunk(
  'classes/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await classAPI.getClass(id);
      return data.class;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch class');
    }
  }
);

export const fetchClassBySession = createAsyncThunk(
  'classes/fetchBySession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const { data } = await classAPI.getClassBySession(sessionId);
      return data.class;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Invalid session code');
    }
  }
);

export const createClass = createAsyncThunk(
  'classes/create',
  async (classData, { rejectWithValue }) => {
    try {
      const { data } = await classAPI.createClass(classData);
      return data.class;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create class');
    }
  }
);

export const updateClass = createAsyncThunk(
  'classes/update',
  async ({ id, ...classData }, { rejectWithValue }) => {
    try {
      const { data } = await classAPI.updateClass(id, classData);
      return data.class;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update class');
    }
  }
);

export const deleteClass = createAsyncThunk(
  'classes/delete',
  async (id, { rejectWithValue }) => {
    try {
      await classAPI.deleteClass(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete class');
    }
  }
);

export const joinClassBySession = createAsyncThunk(
  'classes/join',
  async (sessionId, { rejectWithValue }) => {
    try {
      const { data } = await classAPI.joinClass({ sessionId });
      return data.class;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to join class');
    }
  }
);

// ──── Slice ────────────────────────────────────────────────────────
const classSlice = createSlice({
  name: 'classes',
  initialState: {
    classes: [],
    currentClass: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentClass: (state) => {
      state.currentClass = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateClassLiveStatus: (state, action) => {
      const { classId, isLive } = action.payload;
      const cls = state.classes.find((c) => c._id === classId || c.sessionId === classId);
      if (cls) cls.isLive = isLive;
      if (state.currentClass?._id === classId || state.currentClass?.sessionId === classId) {
        state.currentClass.isLive = isLive;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder.addCase(fetchClasses.pending, (state) => { state.loading = true; });
    builder.addCase(fetchClasses.fulfilled, (state, action) => {
      state.loading = false;
      state.classes = action.payload;
    });
    builder.addCase(fetchClasses.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch single
    builder.addCase(fetchClass.pending, (state) => { state.loading = true; });
    builder.addCase(fetchClass.fulfilled, (state, action) => {
      state.loading = false;
      state.currentClass = action.payload;
    });
    builder.addCase(fetchClass.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch by session
    builder.addCase(fetchClassBySession.pending, (state) => { state.loading = true; });
    builder.addCase(fetchClassBySession.fulfilled, (state, action) => {
      state.loading = false;
      state.currentClass = action.payload;
    });
    builder.addCase(fetchClassBySession.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      toast.error(action.payload);
    });

    // Create
    builder.addCase(createClass.fulfilled, (state, action) => {
      state.classes.unshift(action.payload);
      toast.success('Class created! 🎉');
    });
    builder.addCase(createClass.rejected, (state, action) => {
      toast.error(action.payload);
    });

    // Update
    builder.addCase(updateClass.fulfilled, (state, action) => {
      const idx = state.classes.findIndex((c) => c._id === action.payload._id);
      if (idx !== -1) state.classes[idx] = action.payload;
      if (state.currentClass?._id === action.payload._id) {
        state.currentClass = action.payload;
      }
      toast.success('Class updated!');
    });
    builder.addCase(updateClass.rejected, (state, action) => {
      toast.error(action.payload);
    });

    // Delete
    builder.addCase(deleteClass.fulfilled, (state, action) => {
      state.classes = state.classes.filter((c) => c._id !== action.payload);
      toast.success('Class deleted');
    });
    builder.addCase(deleteClass.rejected, (state, action) => {
      toast.error(action.payload);
    });

    // Join
    builder.addCase(joinClassBySession.fulfilled, (state, action) => {
      state.currentClass = action.payload;
      toast.success('Joined class! Redirecting to classroom...');
    });
    builder.addCase(joinClassBySession.rejected, (state, action) => {
      toast.error(action.payload);
    });
  },
});

export const { clearCurrentClass, clearError, updateClassLiveStatus } = classSlice.actions;
export default classSlice.reducer;
