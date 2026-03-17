import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

// ──── Async Thunks ────────────────────────────────────────────
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.register(userData);
      localStorage.setItem('acadly_token', data.token);
      localStorage.setItem('acadly_user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.login(credentials);
      localStorage.setItem('acadly_token', data.token);
      localStorage.setItem('acadly_user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.getMe();
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.updateProfile(profileData);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Update failed');
    }
  }
);

// ──── Initial State ────────────────────────────────────────────────
const storedUser = localStorage.getItem('acadly_user');
const storedToken = localStorage.getItem('acadly_token');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
};

// ──── Slice ────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('acadly_token');
      localStorage.removeItem('acadly_user');
      toast.success('Logged out successfully');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserLocal: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('acadly_user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true; state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      toast.success('Account created! Welcome 🎉');
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      toast.error(action.payload);
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true; state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      toast.success(`Welcome back, ${action.payload.user.name}! 🎓`);
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      toast.error(action.payload);
    });

    // Fetch Me
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('acadly_user', JSON.stringify(action.payload));
    });
    builder.addCase(fetchCurrentUser.rejected, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('acadly_token');
      localStorage.removeItem('acadly_user');
    });

    // Update Profile
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      state.user = action.payload;
      localStorage.setItem('acadly_user', JSON.stringify(action.payload));
      toast.success('Profile updated!');
    });
  },
});

export const { logout, clearError, updateUserLocal } = authSlice.actions;
export default authSlice.reducer;
