/**
 * Instagram caption + hashtag generator.
 * Natural, scene-based captions that match the photo vibe — minimal, observational, conversational.
 * Some variety: light thought, soft question, or gentle CTA without sounding self-appreciating.
 */

import type { ThemeOccasion, ShotType } from './prompts';
import { getRandomElement } from './prompts';

const MAX_CAPTION_CHARS = 2200;
const MAX_HASHTAGS = 30;

/** Minimal one-liners — scene vibe, no preaching (theme-agnostic) */
const MINIMAL_VIBE: string[] = [
  'Monday fuel.',
  'Where it happens.',
  'Good spot.',
  'This view.',
  'No rush.',
  'Corner table energy.',
  'The right kind of busy.',
  'Small moments.',
  'Could stay here.',
  'One of those days.',
  'Rain or shine.',
  'Exactly where I need to be.',
];

/** Observational — describes the moment without making it about the poster */
const OBSERVATIONAL: string[] = [
  "The kind of morning that fixes Mondays.",
  "Where the best ideas aren't forced.",
  "Coffee and clarity. Sometimes that's enough.",
  "Some days the best meeting is the one you don't take.",
  "The view from here never gets old.",
  "Quiet corner, loud thoughts.",
  "Post-flight thoughts hit different.",
  "Could get used to this.",
  "This spot never gets old.",
  "Where wifi and good light actually exist.",
  "The in-between moments.",
  "Nothing fancy. Just right.",
];

/** Conversational — like talking to a friend */
const CONVERSATIONAL: string[] = [
  "Could stay here all day. (Don't tell my calendar.)",
  "This is the one meeting I don't mind.",
  "Still figuring out if I'm working or just caffeinating. Both?",
  "Took the long way. No regrets.",
  "New city, same ritual.",
  "When the venue does half the work.",
  "Not a bad office for the day.",
  "Sometimes the best plan is no plan.",
  "Found the good light.",
  "One of those 'this is why I do it' moments.",
];

/** Light questions — fit the scene, invite reply without demanding */
const LIGHT_QUESTIONS: string[] = [
  "Coffee first or inbox first?",
  "Where's your go-to when you need to think?",
  "Sunrise or sunset person?",
  "Best meeting you had this week — was it on a screen or in a room?",
  "What's your Monday ritual?",
  "One place you keep going back to?",
  "Where do you get your best ideas?",
];

/** Theme-specific lines — short, vibe-matched (no hustle talk) */
const BY_THEME: Record<string, string[]> = {
  coffee: [
    'Coffee and clarity.',
    'Corner table, good wifi.',
    'Where the second cup is always justified.',
    'Monday fuel.',
    'The cafe as office. No complaints.',
  ],
  work: [
    'Heads down.',
    'Whiteboard full, mind clearer.',
    'The good kind of deep work.',
    'Where it gets built.',
  ],
  gym: [
    'Reps and thoughts.',
    'Clear head, full tank.',
    'The only meeting that never gets rescheduled.',
    'Morning fuel.',
  ],
  travel: [
    'Next stop: unknown.',
    'Same me, different skyline.',
    'The in-between.',
    'One bag, many places.',
  ],
  beach: [
    'Salt and reset.',
    'Offline mode: on.',
    'The kind of break that actually fixes things.',
  ],
  food: [
    "The meeting that doesn't need a calendar.",
    'Good food, better conversation.',
    'Where the real sync happens.',
  ],
  outdoor: [
    'Fresh air, same thoughts.',
    'Outside office hours.',
    'Where the ideas catch up.',
  ],
  default: [
    'Small moments.',
    'The right kind of busy.',
    'Exactly where I need to be.',
  ],
};

/** Rare thoughtful line — not preachy, just a single reflection (used sparingly) */
const THOUGHT_ONE_LINER: string[] = [
  "What you do daily compounds. The question is: toward what?",
  "Clarity comes from doing, not from thinking about doing.",
  "The best time to start was yesterday. The second best is now.",
  "Most limits are stories we tell ourselves. Some are real.",
  "Success is a lagging indicator. The leading one is what you do when nobody's watching.",
];

/** Soft engagement — optional, short, not "drop it below" */
const SOFT_ENGAGEMENT: string[] = [
  "Where's your spot? 👇",
  "Tag your favourite place.",
  "Save for when you need the reminder.",
  "",
  "",
];

/** Theme-specific hashtag pools (combined with evergreen for variety) */
const TAGS_BY_THEME: Record<string, string[]> = {
  work: [
    'entrepreneur', 'startuplife', 'founder', 'buildinpublic', 'hustle', 'mindset', 'grind', 'business', 'leadership',
    'remotework', 'startup', 'entrepreneurlife', 'businessowner', 'motivation', 'success', 'workfromanywhere',
    'sidehustle', 'businessideas', 'startupideas', 'indiehacker', 'solopreneur', 'digitalnomad',
  ],
  coffee: [
    'coffee', 'entrepreneur', 'remotework', 'cafe', 'laptoplife', 'buildinpublic', 'mindset', 'productivity',
    'coffeelover', 'workfromcafe', 'freelancer', 'startuplife', 'founder', 'hustle', 'sidehustle', 'businessideas',
  ],
  gym: [
    'fitness', 'entrepreneur', 'mindset', 'grind', 'discipline', 'health', 'hustle', 'motivation', 'founder',
    'buildinpublic', 'fitnessmotivation', 'entrepreneurlife', 'success', 'growth', 'mentalstrength',
  ],
  beach: [
    'beach', 'lifestyle', 'entrepreneur', 'mindset', 'recharge', 'travel', 'buildinpublic', 'balance',
    'digitalnomad', 'remotework', 'founder', 'worklifebalance', 'entrepreneurlife', 'travel', 'wanderlust',
  ],
  food: [
    'food', 'entrepreneur', 'lifestyle', 'networking', 'buildinpublic', 'mindset', 'hustle', 'founder',
    'businessideas', 'startuplife', 'entrepreneurlife', 'foodie', 'meeting', 'collab',
  ],
  travel: [
    'travel', 'entrepreneur', 'remotework', 'digitalnomad', 'buildinpublic', 'lifestyle', 'adventure',
    'founder', 'locationindependent', 'startuplife', 'wanderlust', 'entrepreneurlife', 'workfromanywhere',
  ],
  outdoor: [
    'outdoor', 'lifestyle', 'entrepreneur', 'mindset', 'nature', 'buildinpublic', 'balance', 'founder',
    'freshair', 'thinking', 'ideas', 'entrepreneurlife', 'clarity', 'creativity',
  ],
  default: [
    'entrepreneur', 'lifestyle', 'buildinpublic', 'mindset', 'hustle', 'startup', 'grind', 'founder',
    'entrepreneurlife', 'business', 'motivation', 'success', 'sidehustle', 'businessideas', 'startupideas',
    'indiehacker', 'solopreneur', 'leadership', 'growth',
  ],
};

const EVERGREEN_TAGS = [
  'entrepreneur', 'buildinpublic', 'mindset', 'founder', 'startuplife', 'businessideas', 'entrepreneurlife',
];

function matchThemeCategory(theme: string): string {
  const t = theme.toLowerCase();
  if (/\b(coffee|cafe|co-working)\b/.test(t)) return 'coffee';
  if (/\b(gym|workout|run)\b/.test(t)) return 'gym';
  if (/\b(beach|waterfront|lake)\b/.test(t)) return 'beach';
  if (/\b(restaurant|brunch|lunch)\b/.test(t)) return 'food';
  if (/\b(airport|train|travel|hotel)\b/.test(t)) return 'travel';
  if (/\b(park|outdoor|balcony)\b/.test(t)) return 'outdoor';
  if (/\b(office|meeting|work)\b/.test(t)) return 'work';
  return 'default';
}

function pickHashtags(themeCategory: string, count: number): string[] {
  const themeTags = TAGS_BY_THEME[themeCategory] ?? TAGS_BY_THEME.default;
  const combined = [...new Set([...EVERGREEN_TAGS, ...themeTags])];
  const shuffled = [...combined].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, MAX_HASHTAGS));
}

/** Pick main caption line from style distribution: theme-based, observational, conversational, question, or thought. */
function pickMainCaption(themeCategory: string): string {
  const themePool = BY_THEME[themeCategory] ?? BY_THEME.default;
  const roll = getRandomElement([
    'theme',
    'theme',
    'theme',
    'minimal',
    'minimal',
    'observational',
    'observational',
    'conversational',
    'conversational',
    'question',
    'thought',
  ]);
  switch (roll) {
    case 'theme':
      return getRandomElement(themePool);
    case 'minimal':
      return getRandomElement(MINIMAL_VIBE);
    case 'observational':
      return getRandomElement(OBSERVATIONAL);
    case 'conversational':
      return getRandomElement(CONVERSATIONAL);
    case 'question':
      return getRandomElement(LIGHT_QUESTIONS);
    case 'thought':
      return getRandomElement(THOUGHT_ONE_LINER);
    default:
      return getRandomElement(themePool);
  }
}

export interface CaptionResult {
  caption: string;
  tags: string[];
}

/**
 * Generate a natural, vibe-matching caption: one main line (scene-based or observational),
 * optional soft engagement, then hashtags. No self-appreciating or preachy blocks.
 */
export function generateCaptionForPost(theme: ThemeOccasion, _shotType: ShotType): CaptionResult {
  const category = matchThemeCategory(theme);
  const main = pickMainCaption(category);
  const engagement = getRandomElement(SOFT_ENGAGEMENT);
  const tags = pickHashtags(category, MAX_HASHTAGS);
  const tagString = tags.map((t) => `#${t}`).join(' ');

  const parts = [main];
  if (engagement.trim()) parts.push('', engagement);
  parts.push('', tagString);

  const caption = parts.join('\n').slice(0, MAX_CAPTION_CHARS);

  return { caption, tags };
}
