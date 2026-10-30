import { useProgress } from '@react-three/drei'

export function Loading() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <div className="loading">
      <div className="bar" style={{ width: `${progress.toFixed(0)}%` }} />
    </div>
  )
}
