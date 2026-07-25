import { createSlice } from "@reduxjs/toolkit";
import { getUserRoles, hasAnyRole } from "@/utils/role";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
      if (action.payload) state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setLoading, setUser, logout, setError } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectAuthUser = (state) => state.auth.user;
export const selectUserRoles = (state) => getUserRoles(state.auth.user);
export const selectHasAnyRole = (state, roles = []) => hasAnyRole(state.auth.user, roles);

export default authSlice.reducer;
