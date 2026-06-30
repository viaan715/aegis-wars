// Personality traits layered onto the existing enemy `role` field, giving
// enemy types more behavioral variety: how far they like to fight from,
// how readily they flank vs charge straight in, and when they break off
// to retreat and self-repair instead of fighting to the death.
const PERSONALITIES = {
  sniper:    {kind:'sniper',     idealMult:1.3, flankiness:0.85, retreatThreshold:0.50, fightToDeath:false},
  boss:      {kind:'aggressive', idealMult:1.0, flankiness:0.20, retreatThreshold:0.12, fightToDeath:true},
  fortress:  {kind:'defensive',  idealMult:1.1, flankiness:0.30, retreatThreshold:0.30, fightToDeath:false},
  assault:   {kind:'aggressive', idealMult:0.85,flankiness:0.35, retreatThreshold:0.18, fightToDeath:false},
  flanker:   {kind:'aggressive', idealMult:0.8, flankiness:0.55, retreatThreshold:0.22, fightToDeath:false},
  scout:     {kind:'aggressive', idealMult:0.8, flankiness:0.6,  retreatThreshold:0.25, fightToDeath:false},
  hunter:    {kind:'aggressive', idealMult:0.8, flankiness:0.5,  retreatThreshold:0.2,  fightToDeath:false},
  gunship:   {kind:'aggressive', idealMult:0.85,flankiness:0.45, retreatThreshold:0.25, fightToDeath:false},
};
const DEFAULT_PERSONALITY = {kind:'defensive', idealMult:1.0, flankiness:0.4, retreatThreshold:0.25, fightToDeath:false};

export function getPersonality(role){
  return PERSONALITIES[role] || DEFAULT_PERSONALITY;
}
