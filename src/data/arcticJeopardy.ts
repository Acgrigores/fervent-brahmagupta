// Arctic Jeopardy questions (4 categories x 3 difficulty levels).
// Each question's value (1-3) is how many lives/points it is worth: harder questions are worth more.
// Originally built for Nanuk's ice game; kept here to reuse in another game.

export interface JeopardyQuestion {
  value: 1 | 2 | 3;
  q: string;
  options: string[];
  answer: string;
  fact: string;
}

export const ARCTIC_JEOPARDY_CATEGORIES: { name: string; questions: JeopardyQuestion[] }[] = [
  {
    name: 'POLAR BEARS',
    questions: [
      {
        value: 1,
        q: 'What do polar bears mostly hunt?',
        options: ['Seals', 'Penguins', 'Berries', 'Reindeer'],
        answer: 'Seals',
        fact: 'Polar bears mainly eat seals. Penguins live at the opposite end of the Earth, in Antarctica!',
      },
      {
        value: 2,
        q: 'Why do polar bears need sea ice to survive?',
        options: ['They hunt seals from it', 'They drink the ice', 'They only sleep on it', "They don't need it"],
        answer: 'They hunt seals from it',
        fact: 'Polar bears wait at holes in the sea ice for seals to come up for air. Less ice means less food.',
      },
      {
        value: 3,
        q: "What color is a polar bear's skin under its fur?",
        options: ['Black', 'White', 'Pink', 'Light blue'],
        answer: 'Black',
        fact: "Their skin is black to soak up the sun's warmth, and their fur is actually see-through, not white!",
      },
    ],
  },
  {
    name: 'ARCTIC ICE',
    questions: [
      {
        value: 1,
        q: 'Which place is warming faster than most of the planet?',
        options: ['The Arctic', 'The Sahara Desert', 'The Amazon Rainforest', 'The middle of the Pacific'],
        answer: 'The Arctic',
        fact: 'The Arctic is warming about four times faster than the rest of the world.',
      },
      {
        value: 2,
        q: 'What is permafrost?',
        options: ['Ground that stays frozen for at least two years', 'Snow on top of mountains', 'A frozen lake', 'Ice cubes in the freezer'],
        answer: 'Ground that stays frozen for at least two years',
        fact: 'Permafrost covers huge parts of the tundra. When it thaws, the ground can sink and crumble.',
      },
      {
        value: 3,
        q: 'Which planet-warming gas can thawing permafrost release?',
        options: ['Methane', 'Oxygen', 'Helium', 'Neon'],
        answer: 'Methane',
        fact: 'Permafrost holds frozen plants from long ago. As it thaws, they rot and release methane and CO2.',
      },
    ],
  },
  {
    name: 'CLEAN ENERGY',
    questions: [
      {
        value: 1,
        q: 'Which of these is a clean energy source?',
        options: ['Wind', 'Coal', 'Oil', 'Gasoline'],
        answer: 'Wind',
        fact: 'Wind turbines make electricity without burning anything, so they release no smoke.',
      },
      {
        value: 2,
        q: 'Burning coal releases lots of which greenhouse gas?',
        options: ['Carbon dioxide', 'Oxygen', 'Hydrogen', 'Neon'],
        answer: 'Carbon dioxide',
        fact: 'Coal plants are one of the biggest sources of carbon dioxide, which traps heat in the atmosphere.',
      },
      {
        value: 3,
        q: 'When soot from coal smoke lands on Arctic snow, what happens?',
        options: [
          'The dark snow soaks up more sunlight and melts faster',
          'The snow gets colder',
          'Nothing at all',
          'The snow turns into glass',
        ],
        answer: 'The dark snow soaks up more sunlight and melts faster',
        fact: 'Clean white snow reflects sunlight. Sooty snow absorbs it, speeding up melting.',
      },
    ],
  },
  {
    name: 'POLLUTION',
    questions: [
      {
        value: 1,
        q: 'Where should an empty plastic water bottle go?',
        options: ['Recycling', 'Compost', 'The ocean', 'A campfire'],
        answer: 'Recycling',
        fact: 'Rinsed plastic bottles can be recycled into new bottles, clothes and more.',
      },
      {
        value: 2,
        q: 'About how long can a plastic bottle take to break down?',
        options: ['About 450 years', 'About 1 week', 'About 1 year', 'About 10 years'],
        answer: 'About 450 years',
        fact: 'Plastic lasts for centuries, slowly crumbling into smaller and smaller pieces.',
      },
      {
        value: 3,
        q: 'What are microplastics?',
        options: [
          'Tiny plastic bits smaller than 5 mm found even in Arctic ice',
          'Plastic made by tiny microbes',
          'Very small toy figures',
          'Computer microchips',
        ],
        answer: 'Tiny plastic bits smaller than 5 mm found even in Arctic ice',
        fact: 'Scientists have found microplastics frozen in Arctic sea ice, thousands of miles from cities.',
      },
    ],
  },
];

