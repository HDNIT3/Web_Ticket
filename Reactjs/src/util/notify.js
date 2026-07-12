function dispatch(type, message) {
  window.dispatchEvent(
    new CustomEvent('app:toast', { detail: { type, message, id: Date.now() + Math.random() } })
  )
}

export function notifySuccess(message) {
  dispatch('success', message)
}

export function notifyError(message) {
  dispatch('error', message)
}

export function notifyInfo(message) {
  dispatch('info', message)
}

export function notifyWarning(message) {
  dispatch('warning', message)
}
