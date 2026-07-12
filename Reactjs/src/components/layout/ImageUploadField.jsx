/**
 * ImageUploadField - component dùng chung cho tất cả form có trường ảnh
 *
 * Props:
 *   label       - tên label hiển thị (vd: "URL Poster", "Hình ảnh")
 *   value       - giá trị URL hiện tại (string)
 *   onChange    - callback(newUrl: string) khi URL thay đổi
 *   placeholder - placeholder cho input URL (tùy chọn)
 *   required    - required hay không (tùy chọn)
 *   folder      - tên thư mục Cloudinary lưu ảnh (tùy chọn, vd: "movies", "services")
 *   previewHeight - chiều cao preview ảnh (mặc định 120px)
 */
import { useRef, useState } from 'react'
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload'
import { notifySuccess, notifyError } from '../../util/notify'

export default function ImageUploadField({
  label = 'Hình ảnh',
  value = '',
  onChange,
  placeholder = 'https://...',
  required = false,
  previewHeight = 120,
  onBlur,
}) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [tab, setTab] = useState('url') // 'url' | 'upload'

  const { upload, uploading, uploadError, uploadProgress, reset } = useCloudinaryUpload()

  const handleFileChange = async (file) => {
    if (!file) return
    reset()
    try {
      const url = await upload(file)
      onChange(url)
      notifySuccess('Upload ảnh thành công!')
      setTab('url')
    } catch (err) {
      notifyError(err.message)
    }
  }

  const handleInputFile = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFileChange(file)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileChange(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  return (
    <div>
      {/* Label + Tab switcher */}
      <div className="d-flex align-items-center justify-content-between mb-1">
        <label className="form-label fw-semibold mb-0">
          {label} {required && <span className="text-danger">*</span>}
        </label>
        <div className="d-flex gap-0 border rounded overflow-hidden" style={{ fontSize: '0.75rem' }}>
          <button
            type="button"
            className={`px-2 py-1 border-0 ${tab === 'url' ? 'bg-primary text-white' : 'bg-white text-secondary'}`}
            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
            onClick={() => setTab('url')}
          >
            🔗 URL
          </button>
          <button
            type="button"
            className={`px-2 py-1 border-0 ${tab === 'upload' ? 'bg-primary text-white' : 'bg-white text-secondary'}`}
            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
            onClick={() => setTab('upload')}
          >
            📁 Upload
          </button>
        </div>
      </div>

      {/* URL input */}
      {tab === 'url' && (
        <input
          type="url"
          className="form-control"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required && !value}
        />
      )}

      {/* Upload tab */}
      {tab === 'upload' && (
        <div>
          {/* Dropzone */}
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border: `2px dashed ${dragOver ? '#2563eb' : uploading ? '#94a3b8' : '#cbd5e1'}`,
              borderRadius: 12,
              padding: '18px 12px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: dragOver ? 'rgba(37,99,235,0.04)' : uploading ? '#f8fafc' : '#fafbfc',
              transition: 'all 0.2s',
              userSelect: 'none',
            }}
          >
            {uploading ? (
              <div>
                <div className="text-primary fw-semibold mb-2" style={{ fontSize: '0.88rem' }}>
                  Đang upload... {uploadProgress}%
                </div>
                <div className="progress" style={{ height: 6, borderRadius: 999 }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    style={{ width: `${uploadProgress}%`, borderRadius: 999 }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 28 }}>🖼️</div>
                <div className="text-secondary mt-1" style={{ fontSize: '0.82rem' }}>
                  <span className="text-primary fw-semibold">Nhấn để chọn ảnh</span> hoặc kéo thả vào đây
                </div>
                <div className="text-secondary mt-1" style={{ fontSize: '0.74rem' }}>
                  JPG, PNG, WEBP, GIF — tối đa 5MB
                </div>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            style={{ display: 'none' }}
            onChange={handleInputFile}
            disabled={uploading}
          />

          {uploadError && (
            <div className="alert alert-danger py-2 px-3 small mt-2 mb-0">{uploadError}</div>
          )}

          {/* Hiện URL đã upload */}
          {value && !uploading && (
            <div className="mt-2 d-flex align-items-center gap-2">
              <span className="text-success small">✓ Đã upload:</span>
              <span
                className="text-truncate small text-secondary"
                style={{ maxWidth: 200 }}
                title={value}
              >
                {value}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary py-0 px-1"
                style={{ fontSize: '0.7rem' }}
                onClick={() => onChange('')}
              >
                ✕ Xoá
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview ảnh (hiển thị khi có URL, bất kể tab nào) */}
      {value && (
        <div className="mt-2 position-relative d-inline-block">
          <img
            src={value}
            alt="preview"
            className="rounded border"
            style={{
              height: previewHeight,
              maxWidth: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
            onLoad={(e) => {
              e.currentTarget.style.display = 'block'
            }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(0,0,0,0.65)',
              color: '#fff',
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
            title="Xoá ảnh"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
