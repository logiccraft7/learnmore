import { Component, useEffect, useState, type ReactNode } from 'react'

function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="overlay error-overlay">
      <div className="title-card small error-panel" role="alert">
        <div className="eyebrow">Ashport Police · Incident report</div>
        <h2>{title}</h2>
        <p className="error-msg">{message}</p>
        <button className="primary" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    </div>
  )
}

/** Catches render errors so a failure shows a message instead of unmounting everything to a black page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) return <ErrorPanel title="Something broke" message={this.state.error.message || String(this.state.error)} />
    return this.props.children
  }
}

/** Surfaces uncaught errors from outside React (event handlers, async code) in the same panel. */
export function GlobalErrors() {
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    const onError = (e: ErrorEvent) => setMessage(e.message || 'Unknown error')
    const onRejection = (e: PromiseRejectionEvent) => setMessage(String(e.reason?.message ?? e.reason ?? 'Unknown error'))
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return message ? <ErrorPanel title="Something broke" message={message} /> : null
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function NoWebGL() {
  return (
    <ErrorPanel
      title="3D is switched off"
      message="This browser isn't allowing 3D graphics (WebGL). Turn on hardware acceleration in your browser settings, or open the game in Chrome, Edge, Firefox or Safari, then reload."
    />
  )
}
