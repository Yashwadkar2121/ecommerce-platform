import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Registration failed"
      );
    }
  }
);

// Load User thunk
export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response.data;
    } catch (error) {
      // Clear invalid tokens
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      return rejectWithValue("Session expired. Please login again.");
    }
  }
);

// ADDED: Forgot Password - Send OTP
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to send OTP"
      );
    }
  }
);

// ADDED: Verify OTP
export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await authService.verifyOTP(email, otp);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Invalid OTP");
    }
  }
);

// ADDED: Reset Password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ resetToken, newPassword }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(resetToken, newPassword);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to reset password"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token"),
    resetToken: null, // ADDED: Store reset token temporarily
    isAuthenticated: !!localStorage.getItem("token"),
    isLoading: false,
    error: null,
    isUserLoaded: false,
    forgotPasswordSuccess: false, // ADDED: Track forgot password success
    verifyOTPSuccess: false, // ADDED: Track OTP verification success
    resetPasswordSuccess: false, // ADDED: Track reset password success
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isUserLoaded = true;
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessFlags: (state) => {
      // ADDED: Clear success flags when needed
      state.forgotPasswordSuccess = false;
      state.verifyOTPSuccess = false;
      state.resetPasswordSuccess = false;
      state.resetToken = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.tokens.accessToken;
      state.isAuthenticated = true;
      localStorage.setItem("token", action.payload.tokens.accessToken);
      localStorage.setItem("refreshToken", action.payload.tokens.refreshToken);
    },
  },
  extraReducers: (builder) => {
    builder
      // Load User cases
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isUserLoaded = true;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.isUserLoaded = true;
        state.user = null;
        state.token = null;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.tokens.accessToken;
        state.isAuthenticated = true;
        state.isUserLoaded = true;
        localStorage.setItem("token", action.payload.tokens.accessToken);
        localStorage.setItem(
          "refreshToken",
          action.payload.tokens.refreshToken
        );
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isUserLoaded = true;
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.tokens.accessToken;
        state.isAuthenticated = true;
        state.isUserLoaded = true;
        localStorage.setItem("token", action.payload.tokens.accessToken);
        localStorage.setItem(
          "refreshToken",
          action.payload.tokens.refreshToken
        );
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isUserLoaded = true;
      })

      // ADDED: Forgot Password cases
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.forgotPasswordSuccess = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.forgotPasswordSuccess = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.forgotPasswordSuccess = false;
      })

      // ADDED: Verify OTP cases
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.verifyOTPSuccess = false;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verifyOTPSuccess = true;
        state.resetToken = action.payload.resetToken; // Store reset token for next step
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.verifyOTPSuccess = false;
        state.resetToken = null;
      })

      // ADDED: Reset Password cases
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.resetPasswordSuccess = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.resetPasswordSuccess = true;
        state.resetToken = null; // Clear reset token after successful password reset
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.resetPasswordSuccess = false;
      });
  },
});

export const {
  logout,
  clearError,
  clearSuccessFlags, // ADDED: Export clearSuccessFlags
  setCredentials,
} = authSlice.actions;
export default authSlice.reducer;
