import Anthropic from '@anthropic-ai/sdk';

// Constructing without an API key throws immediately, and a deployment
// without ANTHROPIC_API_KEY set should still boot (just with AI features
// disabled) rather than crashing the whole server.
function createClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    return new Anthropic();
  } catch {
    return null;
  }
}

export const anthropic = createClient();
export const AI_MODEL = 'claude-opus-4-8';
