import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { registerWithCredentials, verifyOtpCode, resendOtpCode } from '../services/auth.api.js'


export const registerUser = createAsyncThunk(
  'register/registerUser',
  async (formData, { rejectWithValue }) => {
    try {
      return await registerWithCredentials(formData)
    } catch (error) {
      return rejectWithValue(error.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    }
  },
)

export const verifyOtp = createAsyncThunk(
  'register/verifyOtp',
  async (payload, { rejectWithValue }) => {
    try {
      return await verifyOtpCode(payload)
    } catch (error) {
      return rejectWithValue(error.message || 'Mã OTP không hợp lệ. Vui lòng thử lại.')
    }
  },
)

export const resendOtp = createAsyncThunk(
  'register/resendOtp',
  async (email, { rejectWithValue }) => {
    try {
      return await resendOtpCode(email)
    } catch (error) {
      return rejectWithValue(error.message || 'Không thể gửi lại mã. Vui lòng thử lại.')
    }
  },
)


const initialState = {
  step: 'idle',
  email: '',
  loading: false,
  error: null,
}

const registerSlice = createSlice({
  name: 'register',
  initialState,
  reducers: {
    resetRegister: () => initialState,
    clearError: (state) => {
      state.error = null
    },
    setEmail: (state, action) => {
      state.email = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
        state.step = 'registering'
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.step = 'pending_otp'
        state.email = action.meta.arg.email
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.step = 'idle'
      })

    builder
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true
        state.error = null
        state.step = 'verifying'
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.loading = false
        state.step = 'success'
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.step = 'pending_otp'
      })
  },
})

export const { resetRegister, clearError, setEmail } = registerSlice.actions
export default registerSlice.reducer

