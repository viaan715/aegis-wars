// Per-match weather: rain reduces AI engagement/visibility range, wind
// drifts deployed smoke. Rolled once at the start of each match.
export function rollWeather(){
  const rain = Math.random() < 0.3;
  const windAngle = Math.random()*Math.PI*2;
  const windStrength = 0.15 + Math.random()*0.35;
  return {
    type: rain ? 'rain' : 'clear',
    visibilityMult: rain ? 0.8 : 1,
    windX: Math.cos(windAngle)*windStrength,
    windY: Math.sin(windAngle)*windStrength,
  };
}
