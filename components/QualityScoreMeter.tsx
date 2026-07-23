import type { Grade } from "@/lib/analysis/types";
import { scoreColorVar } from "@/lib/ui/colors";

const SWEEP_DEGREES = 270;
const START_DEGREES = 135;
const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 92;
const STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SWEEP_LEN = (SWEEP_DEGREES / 360) * CIRCUMFERENCE;

function polarPoint(fraction: number) {
  const angle = ((START_DEGREES + SWEEP_DEGREES * fraction) * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

export function QualityScoreMeter({ score, grade }: { score: number; grade: Grade }) {
  const fraction = score / 100;
  const valueLen = SWEEP_LEN * fraction;
  const colorVar = scoreColorVar(score);
  const tip = polarPoint(fraction);

  return (
    <figure className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Quality score ${score} out of 100, grade ${grade}`}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--gridline)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${SWEEP_LEN} ${CIRCUMFERENCE - SWEEP_LEN}`}
            transform={`rotate(${START_DEGREES} ${CENTER} ${CENTER})`}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={`var(${colorVar})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${valueLen} ${CIRCUMFERENCE - valueLen}`}
            transform={`rotate(${START_DEGREES} ${CENTER} ${CENTER})`}
            style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.3s ease" }}
          />
          {score > 0 && (
            <circle cx={tip.x} cy={tip.y} r={7} fill={`var(${colorVar})`} stroke="var(--surface-1)" strokeWidth={2.5} />
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[64px] font-semibold leading-none tabular-nums-off" style={{ fontVariantNumeric: "proportional-nums" }}>
            {score}
          </span>
          <span className="mt-1 text-xs font-medium tracking-wide text-[var(--text-muted)]">/ 100</span>
          <span
            className="mt-3 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: `var(${colorVar})` }}
          >
            {grade}
          </span>
        </div>
      </div>
      <figcaption className="text-sm font-medium text-[var(--text-secondary)]">Quality score</figcaption>
    </figure>
  );
}
