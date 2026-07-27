import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("token");

let parsedUser = null;
try {
  parsedUser = storedUser ? JSON.parse(storedUser) : null;
} catch (e) {
  parsedUser = null;
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: parsedUser,
    token: storedToken || null,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      if (user) {
        state.user = user;
        localStorage.setItem("user", JSON.stringify(user));
      }
      if (token) {
        state.token = token;
        localStorage.setItem("token", token);
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    updateXp: (state, action) => {
      if (state.user) {
        state.user.xp = action.payload.xp;
        state.user.level = action.payload.level;
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { setCredentials, updateUser, updateXp, logout } = authSlice.actions;
export default authSlice.reducer;
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
