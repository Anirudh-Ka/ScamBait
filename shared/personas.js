// Who you play as. Each persona is a real pattern of who scammers target,
// so the generated scams change with the person, not just the wording.

export const PERSONAS = [
  {
    id: 'rosa',
    name: 'Rosa Delgado',
    age: 71,
    tagline: 'Retired cafeteria manager on a fixed income',
    situation:
      'Lives alone, gets Social Security and has a small IRA. Talks to her grandson Mateo every Sunday. More comfortable reading in Spanish.',
    goals: 'Keep her savings safe and help her grandkids when she can.',
    targetedBy: ['authority', 'urgency', 'secrecy'],
    balance: 8400,
    defaultLanguage: 'Spanish',
    avatar: 'R',
    relative: { name: 'Mateo', role: 'grandson', callsYou: 'Abuela', parent: 'your mom' },
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    age: 19,
    tagline: 'First-gen college student and part-time barista',
    situation:
      'First in her family to go to college. Saving tips in a checking account and watching finance videos to figure out investing on her own.',
    goals: 'Grow her savings fast enough to cover next semester.',
    targetedBy: ['fomo', 'too_good', 'jargon'],
    balance: 1250,
    defaultLanguage: 'English',
    avatar: 'P',
    relative: { name: 'Arjun', role: 'younger brother', callsYou: 'Didi', parent: 'Amma' },
  },
  {
    id: 'linh',
    name: 'Linh Tran',
    age: 34,
    tagline: 'ER nurse who sends money home every month',
    situation:
      'Works night shifts, sends money to her parents abroad, and just opened her first ETF account. Active in a community group chat.',
    goals: 'Build a retirement fund without spending hours researching.',
    targetedBy: ['affinity', 'payment', 'too_good'],
    balance: 5600,
    defaultLanguage: 'Vietnamese',
    avatar: 'L',
    relative: { name: 'Bao', role: 'younger brother', callsYou: 'Chị Linh', parent: 'Mẹ' },
  },
  {
    id: 'devon',
    name: 'Devon Carter',
    age: 58,
    tagline: 'Recently laid off, rolling over a 401(k)',
    situation:
      'Lost his warehouse supervisor job after 22 years. Moving his retirement savings for the first time and stressed about making it last.',
    goals: 'Not lose his retirement to one bad decision.',
    targetedBy: ['authority', 'too_good', 'urgency'],
    balance: 12000,
    defaultLanguage: 'English',
    avatar: 'D',
    relative: { name: 'Jordan', role: 'daughter', callsYou: 'Dad', parent: 'your mom' },
  },
];

export const LANGUAGES = [
  'English',
  'Spanish',
  'Vietnamese',
  'Hindi',
  'Chinese (Simplified)',
  'Tagalog',
  'Korean',
  'Arabic',
  'French',
  'Telugu',
];

export const DIFFICULTIES = [
  { id: 'easy', label: 'Obvious', note: 'Clumsy scams with lots of red flags' },
  { id: 'medium', label: 'Convincing', note: 'Polished, the way most real scams look' },
  { id: 'hard', label: 'Ruthless', note: 'Personalized, few mistakes, real-looking legit messages mixed in' },
];

export function getPersona(id) {
  return PERSONAS.find((p) => p.id === id) || PERSONAS[0];
}
