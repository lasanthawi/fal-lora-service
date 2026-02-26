"use strict";
/**
 * Instagram caption + hashtag generator.
 * Produces catchy, theme-related descriptions and relevant tags (max 30 for Instagram).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCaptionForPost = generateCaptionForPost;
const prompts_1 = require("./prompts");
const MAX_CAPTION_CHARS = 2200;
const MAX_HASHTAGS = 30;
/** Theme keywords → catchy hooks (one picked at random per theme match) */
const HOOKS_BY_THEME = {
    work: [
        'Building in public. No filter, no fluff. 🚀',
        'The grind doesn’t stop. Neither do we.',
        'Office vibes, founder mindset.',
        'Where the magic happens. ✨',
    ],
    coffee: [
        'Fueled by coffee and big ideas.',
        'Best meetings happen over coffee.',
        'Coffee in hand, ideas in motion.',
    ],
    gym: [
        'No days off. Body and mind. 💪',
        'Train like an athlete, think like a founder.',
        'Strong body, sharp mind.',
    ],
    beach: [
        'Even founders need to unplug. 🌊',
        'Sun, sand, and strategy.',
        'Recharge by the water.',
    ],
    food: [
        'Good food, good people, good ideas.',
        'Lunch meeting > boring desk lunch.',
        'Fuel the hustle. 🍽️',
    ],
    travel: [
        'Location independent. Mind always building.',
        'Another city, same hustle.',
        'Travel light, build big. ✈️',
    ],
    outdoor: [
        'Fresh air, fresh perspective.',
        'Outside the office, still on mission.',
        'Nature and hustle. 🌿',
    ],
    default: [
        'Building in public. One day at a time.',
        'Real moments. Real hustle.',
        'Living the journey. 🚀',
    ],
};
/** Theme keywords → relevant hashtags (we pick a subset to stay under 30 total) */
const TAGS_BY_THEME = {
    work: ['entrepreneur', 'startup', 'founder', 'buildinpublic', 'hustle', 'mindset', 'grind', 'business', 'leadership', 'remotework'],
    coffee: ['coffee', 'entrepreneur', 'remotework', 'cafe', 'laptoplife', 'buildinpublic', 'mindset', 'productivity'],
    gym: ['fitness', 'entrepreneur', 'mindset', 'grind', 'discipline', 'health', 'hustle', 'motivation'],
    beach: ['beach', 'lifestyle', 'entrepreneur', 'mindset', 'recharge', 'travel', 'buildinpublic', 'balance'],
    food: ['food', 'entrepreneur', 'lifestyle', 'networking', 'buildinpublic', 'mindset', 'hustle'],
    travel: ['travel', 'entrepreneur', 'remotework', 'digitalnomad', 'buildinpublic', 'lifestyle', 'adventure'],
    outdoor: ['outdoor', 'lifestyle', 'entrepreneur', 'mindset', 'nature', 'buildinpublic', 'balance'],
    default: ['entrepreneur', 'lifestyle', 'buildinpublic', 'mindset', 'hustle', 'startup', 'grind'],
};
/** Evergreen hashtags included in every post (count toward 30) */
const EVERGREEN_TAGS = ['entrepreneur', 'lifestyle', 'buildinpublic', 'mindset'];
function matchThemeCategory(theme) {
    const t = theme.toLowerCase();
    if (/\b(coffee|cafe|co-working)\b/.test(t))
        return 'coffee';
    if (/\b(gym|workout|run)\b/.test(t))
        return 'gym';
    if (/\b(beach|waterfront|lake)\b/.test(t))
        return 'beach';
    if (/\b(restaurant|brunch|lunch)\b/.test(t))
        return 'food';
    if (/\b(airport|train|travel|hotel)\b/.test(t))
        return 'travel';
    if (/\b(park|outdoor|balcony)\b/.test(t))
        return 'outdoor';
    if (/\b(office|meeting|work)\b/.test(t))
        return 'work';
    return 'default';
}
function pickHashtags(themeCategory, count) {
    const themeTags = TAGS_BY_THEME[themeCategory] ?? TAGS_BY_THEME.default;
    const combined = [...new Set([...EVERGREEN_TAGS, ...themeTags])];
    const shuffled = [...combined].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, MAX_HASHTAGS));
}
/**
 * Generate a catchy Instagram caption and related hashtags from the post’s theme and shot type.
 * Stays within Instagram limits (2200 chars, max 30 hashtags).
 */
function generateCaptionForPost(theme, _shotType) {
    const category = matchThemeCategory(theme);
    const hooks = HOOKS_BY_THEME[category] ?? HOOKS_BY_THEME.default;
    const hook = (0, prompts_1.getRandomElement)(hooks);
    const tags = pickHashtags(category, MAX_HASHTAGS);
    const tagString = tags.map((t) => `#${t}`).join(' ');
    const caption = `${hook}\n\n${tagString}`.slice(0, MAX_CAPTION_CHARS);
    return { caption, tags };
}
