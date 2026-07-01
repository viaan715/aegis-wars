export default function TemperProgress({ percent }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="temper-progress" role="progressbar" aria-valuenow={Math.round(clamped)} aria-valuemin={0} aria-valuemax={100}>
      <div className="temper-progress-mask" style={{ width: `${100 - clamped}%` }} />
    </div>
  );
}
