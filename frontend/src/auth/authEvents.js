const listeners = new Set()

export const onAuthFailure = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const emitAuthFailure = () => {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      // ignore
    }
  })
}
