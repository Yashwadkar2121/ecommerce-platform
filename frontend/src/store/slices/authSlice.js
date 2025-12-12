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

// Update Profile thunk
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      return response.data;
    } catch (error) {
      // Extract validation errors if present
      if (error.response?.data?.details) {
        const errorMessages = error.response.data.details
          .map((err) => err.msg)
          .join(", ");
        return rejectWithValue(errorMessages);
      }
      return rejectWithValue(
        error.response?.data?.error || "Failed to update profile"
      );
    }
  }
);

// Change Password thunk
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(
        currentPassword,
        newPassword
      );
      return response.data;
    } catch (error) {
      // Extract validation errors if present
      if (error.response?.data?.details) {
        const errorMessages = error.response.data.details
          .map((err) => err.msg)
          .join(", ");
        return rejectWithValue(errorMessages);
      }
      return rejectWithValue(
        error.response?.data?.error || "Failed to change password"
      );
    }
  }
);

// Forgot Password - Send OTP
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

// Resend OTP
export const resendOTP = createAsyncThunk(
  "auth/resendOTP",
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.resendOTP(email);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to resend OTP"
      );
    }
  }
);

// Verify OTP
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

// Reset Password
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
    resetToken: null,
    isAuthenticated: !!localStorage.getItem("token"),
    isLoading: false,
    error: null,
    isUserLoaded: false,
    forgotPasswordSuccess: false,
    resendOTPSuccess: false,
    verifyOTPSuccess: false,
    resetPasswordSuccess: false,
    updateSuccess: false,
    changePasswordSuccess: false,
    resendOTPAttempts: 0,
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
      state.forgotPasswordSuccess = false;
      state.resendOTPSuccess = false;
      state.verifyOTPSuccess = false;
      state.resetPasswordSuccess = false;
      state.updateSuccess = false;
      state.changePasswordSuccess = false;
      state.resetToken = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.tokens.accessToken;
      state.isAuthenticated = true;
      localStorage.setItem("token", action.payload.tokens.accessToken);
      localStorage.setItem("refreshToken", action.payload.tokens.refreshToken);
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    incrementResendAttempts: (state) => {
      state.resendOTPAttempts += 1;
    },
    resetResendAttempts: (state) => {
      state.resendOTPAttempts = 0;
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

      // Update Profile cases
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.updateSuccess = true;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.updateSuccess = false;
      })

      // Change Password cases
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.changePasswordSuccess = false;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.changePasswordSuccess = true;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.changePasswordSuccess = false;
      })

      // Forgot Password cases
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

      // Resend OTP cases - NEW
      .addCase(resendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.resendOTPSuccess = false;
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.isLoading = false;
        state.resendOTPSuccess = true;
        state.resendOTPAttempts += 1;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.resendOTPSuccess = false;
      })

      // Verify OTP cases
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.verifyOTPSuccess = false;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verifyOTPSuccess = true;
        state.resetToken = action.payload.resetToken;
        // Reset resend attempts when OTP is verified
        state.resendOTPAttempts = 0;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.verifyOTPSuccess = false;
        state.resetToken = null;
      })

      // Reset Password cases
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.resetPasswordSuccess = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.resetPasswordSuccess = true;
        state.resetToken = null;
        // Reset resend attempts when password is reset
        state.resendOTPAttempts = 0;
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
  clearSuccessFlags,
  setCredentials,
  updateUserProfile,
  incrementResendAttempts,
  resetResendAttempts,
} = authSlice.actions;
export default authSlice.reducer;
