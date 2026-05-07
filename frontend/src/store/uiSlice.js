import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
  toasts: [], // { id, kind: 'info'|'success'|'warning'|'error', message, ttlMs }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    pushToast: {
      prepare(payload) {
        return {
          payload: {
            id: nanoid(),
            kind: 'info',
            ttlMs: 5000,
            ...payload,
          },
        };
      },
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts(state) {
      state.toasts = [];
    },
  },
});

export const { pushToast, dismissToast, clearToasts } = uiSlice.actions;
export const selectToasts = (state) => state.ui.toasts;

export default uiSlice.reducer;
