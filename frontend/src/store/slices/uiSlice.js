import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    mobileMenuOpen: false,
    loading: false,
    notification: null,
  },
  reducers: {
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    showNotification: (state, action) => {
      state.notification = action.payload;
    },
    clearNotification: (state) => {
      state.notification = null;
    },
  },
});

export const {
  toggleMobileMenu,
  setLoading,
  showNotification,
  clearNotification,
} = uiSlice.actions;

export default uiSlice.reducer;
