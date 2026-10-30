import { useAssets } from '../state/assets'

export function Loading() {
  const { loaded, total, done } = useAssets()
  if (done || total === 0) return null
  return (
    <div className="loading" aria-label={`Loading models ${loaded} of ${total}`}>
      <div className="bar" style={{ width: `${((loaded / total) * 100).toFixed(0)}%` }} />
    </div>
  )
}
