import { CONCEPTS, concept } from './concepts'
import { level, type Learning } from './mastery'
import type { Problem, VoiceId } from './types'
import { createRng } from '../sim/rng'

/** A voice's level is the average star count of its concepts, rounded down. */
export function voiceLevel(voice: VoiceId, learning: Learning): number {
  const mine = CONCEPTS.filter((c) => c.voice === voice)
  return Math.floor(mine.reduce((s, c) => s + level(learning[c.id]), 0) / mine.length)
}

export const voiceLevels = (learning: Learning): Record<VoiceId, number> => ({
  logician: voiceLevel('logician', learning),
  economist: voiceLevel('economist', learning),
  empath: voiceLevel('empath', learning),
  skeptic: voiceLevel('skeptic', learning),
})

/**
 * The hint a voice gives, deeper the stronger the voice:
 * level 0 a nudge, 1 the method, 2+ the method and the first worked step.
 */
export function hintFor(p: Problem, learning: Learning): { voice: VoiceId; lines: string[] } {
  const voice = concept(p.concept).voice
  const lvl = voiceLevel(voice, learning)
  const lines = [p.hint.nudge]
  if (lvl >= 1) lines.push(p.hint.method)
  if (lvl >= 2 && p.worked.length > 1) lines.push(`Start here: ${p.worked[0]}`)
  return { voice, lines }
}

const LINES: Record<VoiceId, { right: string[]; wrong: string[]; levelUp: string }> = {
  logician: {
    right: ['Clean. The numbers never lie; people do.', 'Correct. File it.', 'Exactly. Now do it faster.', 'Precise. I approve.'],
    wrong: ['No. Slow down and write every step.', 'Wrong. Check which number you divided by.', 'Close is not correct. Again.', 'You guessed. I can tell.'],
    levelUp: 'The Logician sharpens. Hints will go deeper.',
  },
  economist: {
    right: ['Every choice has a price, and you just read it right.', 'That is what the money says.', 'Good. Margins are where fortunes hide.', 'Right. Remember it when the price moves.'],
    wrong: ['You priced it like a mark. Look again at what was given up.', 'The market just took your money. Read the worked solution.', 'Wrong. Follow the cash, step by step.', 'No. Think at the margin: what does one more change?'],
    levelUp: 'The Economist leans in. You are starting to see the money behind everything.',
  },
  empath: {
    right: ['Yes. You felt what they felt.', 'People are simple once you see what moves them.', 'Right. Use it gently.', 'That is exactly how they would play you.'],
    wrong: ['You saw the words, not the person.', 'No. Ask what they want, not what they said.', 'Missed it. Who spoke first? Who gave first?', 'They would have taken you for a ride.'],
    levelUp: 'The Empath stirs. Faces will start telling you more.',
  },
  skeptic: {
    right: ['Good. Trust nothing that has not earned it.', 'Correct. Gut feelings are cheap; base rates are not.', 'Right. Everybody rats eventually.', 'That is why I never believe the first story.'],
    wrong: ['You believed the evidence because it felt sure. It was not.', 'Wrong. Start from how common the thing is.', 'No. Check what each of them gains by talking.', 'You trusted. Never trust.'],
    levelUp: 'The Skeptic grows louder. Lies will be harder to sell you.',
  },
}

export function voiceLine(voice: VoiceId, correct: boolean, seed: number): string {
  const rng = createRng(seed)
  return rng.pick(correct ? LINES[voice].right : LINES[voice].wrong)
}
export const levelUpLine = (voice: VoiceId) => LINES[voice].levelUp
