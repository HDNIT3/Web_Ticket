/**
 * Hook upload ảnh lên Cloudinary (unsigned)
 * Cấu hình tại: .env
 *   VITE_CLOUDINARY_CLOUD_NAME=...
 *   VITE_CLOUDINARY_UPLOAD_PRESET=...
 */
import { useState, useCallback } from 'react'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

const MAX_FILE_SIZE_MB = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const upload = useCallback(async (file) => {
    setUploadError('')
    setUploadProgress(0)

    if (!CLOUD_NAME || CLOUD_NAME === 'your_cloud_name') {
      const msg = 'Chưa cấu hình Cloudinary. Vui lòng điền VITE_CLOUDINARY_CLOUD_NAME vào file .env'
      setUploadError(msg)
      throw new Error(msg)
    }

    if (!UPLOAD_PRESET || UPLOAD_PRESET === 'your_upload_preset') {
      const msg = 'Chưa cấu hình Cloudinary. Vui lòng điền VITE_CLOUDINARY_UPLOAD_PRESET vào file .env'
      setUploadError(msg)
      throw new Error(msg)
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      const msg = `Chỉ chấp nhận file ảnh: JPG, PNG, WEBP, GIF. File hiện tại: ${file.type}`
      setUploadError(msg)
      throw new Error(msg)
    }

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_FILE_SIZE_MB) {
      const msg = `File quá lớn (${sizeMB.toFixed(1)}MB). Tối đa ${MAX_FILE_SIZE_MB}MB.`
      setUploadError(msg)
      throw new Error(msg)
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)

      // Dùng XMLHttpRequest để có progress
      const secureUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data.secure_url)
            } catch {
              reject(new Error('Phản hồi từ Cloudinary không hợp lệ.'))
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText)
              reject(new Error(errData?.error?.message || `Upload thất bại (HTTP ${xhr.status})`))
            } catch {
              reject(new Error(`Upload thất bại (HTTP ${xhr.status})`))
            }
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Lỗi mạng khi upload ảnh.')))
        xhr.addEventListener('abort', () => reject(new Error('Upload bị huỷ.')))

        xhr.open('POST', UPLOAD_URL)
        xhr.send(formData)
      })

      setUploadProgress(100)
      return secureUrl
    } catch (err) {
      setUploadError(err.message)
      throw err
    } finally {
      setUploading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setUploadError('')
    setUploadProgress(0)
  }, [])

  return { upload, uploading, uploadError, uploadProgress, reset }
}
