"use strict";
/**
 * Prompt builder for entrepreneur lifestyle LoRA.
 * Character: darker salt-and-pepper hair (more black), left forearm tattoo only, casual clothes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSES_AND_MOODS = exports.CLOTHING_OPTIONS = exports.SHOT_TYPES = exports.OCCASIONS = void 0;
exports.getRandomElement = getRandomElement;
exports.buildEntrepreneurPrompt = buildEntrepreneurPrompt;
const OCCASIONS = [
    'working from a modern coffee shop with laptop',
    'at the gym, mid-workout, natural lighting',
    'relaxing on a sunny beach',
    'at a casual restaurant, having lunch',
    'in a city park on a bench',
    'traveling at an airport or train station',
    'in a home office with minimalist setup',
    'at a rooftop bar at golden hour',
    'walking through a vibrant street market',
    'at a co-working space',
    'out for a morning run in the city',
    'at a bookstore browsing',
    'having coffee on a balcony',
    'at a casual team meeting in an office',
    'exploring a new city on foot',
    'at a weekend brunch spot',
    'in a hotel lobby, travel vibes',
    'at a networking event, holding a drink',
    'by a lake or waterfront',
    'in a cozy cafe reading',
];
exports.OCCASIONS = OCCASIONS;
const SHOT_TYPES = [
    'candid shot, natural expression, documentary style',
    'portrait, shallow depth of field, professional',
    'full-body shot, environmental portrait',
    'street style photography, urban backdrop',
    'lifestyle shot, authentic and relaxed',
    'medium shot from waist up, editorial feel',
    'over-the-shoulder moment, storytelling',
    'wide environmental shot, person in context',
];
exports.SHOT_TYPES = SHOT_TYPES;
const CLOTHING_OPTIONS = [
    'fitted black t-shirt',
    'grey hoodie, casual',
    'navy casual shirt, sleeves rolled',
    'white crew neck t-shirt',
    'olive green casual shirt',
    'charcoal henley',
    'light grey sweatshirt',
    'plain dark tee and jeans',
];
exports.CLOTHING_OPTIONS = CLOTHING_OPTIONS;
const POSES_AND_MOODS = [
    'arms crossed confidently with forearms prominently displayed',
    'relaxed, confident smile, approachable',
    'focused, thoughtful expression',
    'laughing naturally, candid moment',
    'calm, contemplative, sleeves rolled to mid-forearm',
    'engaged, talking or listening, hands visible',
    'walking casually, authentic moment',
    'sitting back at ease, left forearm visible',
    'standing with hands in pockets, upper body and forearms in frame',
];
exports.POSES_AND_MOODS = POSES_AND_MOODS;
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
/**
 * Build a professional-photography style prompt matching the LoRA character:
 * darker salt-and-pepper hair (more black), left forearm tattoo only, casual/tailored variety.
 */
function buildEntrepreneurPrompt() {
    const theme = getRandomElement(OCCASIONS);
    const shotType = getRandomElement(SHOT_TYPES);
    const clothing = getRandomElement(CLOTHING_OPTIONS);
    const pose = getRandomElement(POSES_AND_MOODS);
    const prompt = [
        'A professional photograph capturing a distinguished gentleman in his mid-30s,',
        theme + ',',
        pose + ',',
        'well-groomed salt-and-pepper hair with more black than grey, styled with subtle volume, exuding sophistication and approachability.',
        'He wears ' + clothing + ', with sleeves rolled up to mid-forearm when applicable.',
        'Only his left forearm shows detailed, artistic tattoo work in sharp detail; no other visible tattoos.',
        'The composition focuses on upper body and forearms, with hands and tattoo clearly visible and well-lit.',
        shotType + '.',
        'Natural lighting creates gentle highlights and shadows, emphasizing tattoo details and facial features.',
        'Shot with a professional 50mm lens at f/2.8 for shallow depth of field, candid authentic moment.',
        'Cinematic color grading with warm, professional tones.',
        'Photorealistic quality, 8K resolution, high-end photography aesthetic.',
    ].join(' ');
    return { prompt, theme, shotType };
}
