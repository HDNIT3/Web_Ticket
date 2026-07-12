import axios from 'axios'
import { request, requestJson } from './api.client.js'
import { buildApiUrl } from '../util/api.js'

const axiosClient = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.response.use(
  (response) => {
    const { data } = response
    if (!data?.success) {
      return Promise.reject(new Error(data?.message || 'Đã xảy ra lỗi.'))
    }
    return data.data
  },
  (error) => {
    const data = error.response?.data
    const fieldErrors = data?.errors?.map((e) => e.message).join(' • ')
    const message = fieldErrors || data?.message || error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'
    return Promise.reject(new Error(message))
  },
)

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
}

function getApiErrorMessage(error) {
  const data = error.response?.data
  const fieldErrors = data?.errors?.map((e) => e.message).join(' • ')
  return fieldErrors || data?.message || error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

async function postWithMessage(path, payload) {
  try {
    const response = await axios.post(buildApiUrl(path), payload, {
      withCredentials: true,
      headers: DEFAULT_HEADERS,
    })

    const data = response?.data
    if (!data?.success) {
      throw new Error(data?.message || 'Đã xảy ra lỗi.')
    }

    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error), { cause: error })
  }
}

export async function registerWithCredentials(credentials) {
  return axiosClient.post(buildApiUrl('/auth/register'), credentials)
}

export async function verifyOtpCode(payload) {
  return axiosClient.post(buildApiUrl('/auth/verify-otp'), payload)
}

export async function resendOtpCode(email) {
  return axiosClient.post(buildApiUrl('/auth/resend-otp'), { email })
}

export async function forgotPassword(email) {
  return postWithMessage('/auth/forgot-password', { email })
}

export async function resetPassword(payload) {
  return postWithMessage('/auth/reset-password', payload)
}

export async function refreshAuthSession() {
  return requestJson('/auth/refresh', { method: 'POST' })
}

export async function bootstrapAuthSession() {
  return requestJson('/auth/session', { method: 'GET' })
}

export async function loginWithCredentials(credentials) {
  return requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function logoutSession() {
  await request('/auth/logout', { method: 'POST' })
}

export async function loginWithGoogle(token) {
  return requestJson('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}