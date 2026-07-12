export function AlertMessage({ message, variant = 'danger' }) {
  if (!message) return null
  return (
    <div className={`alert alert-${variant} alert-modern`} role="alert">
      {message}
    </div>
  )
}

