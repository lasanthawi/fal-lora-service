/**
 * Instagram caption + hashtag generator for young entrepreneurs.
 * Inspiring, sarcastic, philosophical vibes; business ideas & brainstorms; audience engagement.
 */

import type { ThemeOccasion, ShotType } from './prompts';
import { getRandomElement } from './prompts';

const MAX_CAPTION_CHARS = 2200;
const MAX_HASHTAGS = 30;

/** Opening hooks — inspiring, bold, founder energy */
const HOOKS_INSPIRING: string[] = [
  "The best business you'll ever build is the one that keeps you curious.",
  "Nobody is coming to save your idea. You ship it or it dies.",
  "Your comfort zone is where ideas go to retire. Get uncomfortable.",
  "Every 'overnight success' has a highlight reel. The real story is in the cuts.",
  "Build something you'd use at 2am. That's usually the one that matters.",
  "The gap between idea and execution is where most people quit. Don't.",
  "You don't need a better idea. You need better habits and one idea you won't drop.",
  "Side projects become main projects when you stop waiting for permission.",
  "The only pitch that matters is the one you make to yourself every morning.",
  "Hustle isn't about hours. It's about direction.",
];

/** Sarcastic / witty — positive but sharp */
const HOOKS_SARCASTIC: string[] = [
  "Yes, I'm 'just' working from a cafe. The cafe is my office. The office is a vibe.",
  "My therapist said touch grass. I'm building an app for that. (Kidding. Maybe.)",
  "Sleep is for people who haven't figured out their next feature yet.",
  "I optimise my morning routine so I can chaos-mode the rest of the day. Balanced.",
  "Another day of 'it's not a bug it's a feature' and believing it.",
  "Idea: a startup that reminds founders to drink water. We'd still forget.",
  "Building in public so my future self has receipts. You're welcome, future me.",
  "Work-life balance is when you love what you're building so much it doesn't feel like work. Or so they say.",
  "My to-do list is a suggestion. A very loud, very long suggestion.",
  "Hustle culture said rest. I said one more commit. We are not the same. (We should rest.)",
];

/** Philosophical / reflective */
const HOOKS_PHILOSOPHICAL: string[] = [
  "What you do daily compounds. The question is: toward what?",
  "Identity isn't 'I'm a founder.' It's 'I'm the kind of person who ships.'",
  "The goal isn't to be busy. It's to be effective in the direction that matters.",
  "You're not building a company. You're building a system that works without you.",
  "Clarity comes from doing, not from thinking about doing.",
  "Most limits are stories we tell ourselves. Some are real. Learn the difference.",
  "Success is a lagging indicator. The leading indicator is what you do when nobody's watching.",
  "The market doesn't care about your story. It cares about the problem you solve.",
  "You can't outthink the work. You can only go through it.",
  "The best time to start was yesterday. The second best is now. (Yes, still.)",
];

/** Business ideas / brainstorms — random prompts to spark thinking */
const BRAINSTORMS: string[] = [
  "Brainstorm: What's one problem your friends complain about that no app really fixes yet?",
  "Idea dump: A product that does one thing incredibly well. What's your one thing?",
  "What if the 'boring' industry you ignore is exactly where the opportunity is?",
  "Random thought: The next big thing might just be a small tweak to something that already exists.",
  "Challenge: Describe your idea in one sentence. If you can't, simplify until you can.",
  "What's a skill you have that others would pay to learn? That's a business.",
  "The best businesses often come from 'I wish someone would just…' — what's yours?",
  "Idea: Solve your own problem first. If it's real, others have it too.",
  "What if you launched in a week with half the features? What's the smallest version?",
  "Brainstorm: Who's already winning in your space, and what would you do 10x differently?",
  "The gap between 'everyone needs this' and 'I'm building this' is just a decision.",
  "What's one automation that would save you 5 hours a week? Build that.",
  "Idea: A community around one specific outcome. Not 'productivity' — 'shipping before midnight.'",
  "What problem do you keep coming back to? That's not a distraction. That's a signal.",
  "Random prompt: If you had to make $100 from one skill this month, what would you do?",
];

/** Audience engagement — questions and CTAs */
const ENGAGEMENT: string[] = [
  "What's one thing you're building or shipping this week? Drop it below 👇",
  "Save this if you needed the reminder. Share it if someone else does.",
  "Comment your current obsession (project, idea, or problem you're solving).",
  "What would you add to this? Let's brainstorm in the comments.",
  "Tag someone who needs to see this. Or who's already living it.",
  "What's the one idea you keep coming back to? Maybe it's time.",
  "Drop a 🔥 if you're building something. No judgment, only support.",
  "Reply with the last thing you shipped. Celebrate the small wins.",
  "What's holding you back from launching? Sometimes saying it out loud helps.",
  "If you're reading this, you're already in the right place. What's your next move?",
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

function pickHook(): string {
  const pools = [HOOKS_INSPIRING, HOOKS_SARCASTIC, HOOKS_PHILOSOPHICAL];
  const pool = getRandomElement(pools);
  return getRandomElement(pool);
}

function pickHashtags(themeCategory: string, count: number): string[] {
  const themeTags = TAGS_BY_THEME[themeCategory] ?? TAGS_BY_THEME.default;
  const combined = [...new Set([...EVERGREEN_TAGS, ...themeTags])];
  const shuffled = [...combined].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, MAX_HASHTAGS));
}

export interface CaptionResult {
  caption: string;
  tags: string[];
}

/**
 * Generate an engaging Instagram caption for young entrepreneurs: inspiring, sarcastic, or philosophical
 * hook + business idea/brainstorm + audience engagement + hashtags.
 */
export function generateCaptionForPost(theme: ThemeOccasion, _shotType: ShotType): CaptionResult {
  const category = matchThemeCategory(theme);
  const hook = pickHook();
  const brainstorm = getRandomElement(BRAINSTORMS);
  const engagement = getRandomElement(ENGAGEMENT);
  const tags = pickHashtags(category, MAX_HASHTAGS);
  const tagString = tags.map((t) => `#${t}`).join(' ');

  const caption = [hook, brainstorm, '', engagement, '', tagString]
    .join('\n')
    .slice(0, MAX_CAPTION_CHARS);

  return { caption, tags };
}
