import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  status: 'idle', // 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart(state) {
      state.status = 'loading';
      state.error = null;
    },
    authSuccess(state, action) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = 'authenticated';
      state.error = null;
    },
    authFailure(state, action) {
      state.user = null;
      state.accessToken = null;
      state.status = 'unauthenticated';
      state.error = action.payload || null;
    },
    tokenRefreshed(state, action) {
      state.accessToken = action.payload.accessToken;
      if (action.payload.user) state.user = action.payload.user;
      state.status = 'authenticated';
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'unauthenticated';
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
  },
});

export const {
  authStart,
  authSuccess,
  authFailure,
  tokenRefreshed,
  logout,
  setUser,
} = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';
export const selectAuthLoading = (state) => state.auth.status === 'loading';
export const selectRole = (state) => state.auth.user?.role || null;

export default authSlice.reducer;
