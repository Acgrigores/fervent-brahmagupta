'use client';

import React, { useMemo, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { AnimalInfo, Quest } from '@/types/game';
import { X, Recycle, Leaf, AlertTriangle, Trash2, Lightbulb, RotateCcw, ArrowRight, Coins } from 'lucide-react';

type BinId = 'recycling' | 'compost' | 'hazardous' | 'landfill';

interface SortItem {
  id: string;
  name: string;
  bin: BinId;
  correct: string;
  wrong: string;
  hint: string;
}

const BINS: { id: BinId; label: string; examples: string; icon: React.ElementType; classes: string }[] = [
  { id: 'recycling', label: 'RECYCLING', examples: 'Paper, cans, bottles, glass', icon: Recycle, classes: 'bg-[#dbeafe] border-[#1d4ed8] text-[#1e3a8a]' },
  { id: 'compost', label: 'COMPOST', examples: 'Food & plant scraps', icon: Leaf, classes: 'bg-[#dcfce7] border-[#15803d] text-[#14532d]' },
  { id: 'hazardous', label: 'HAZARDOUS DROP-OFF', examples: 'Batteries, chemicals, electronics', icon: AlertTriangle, classes: 'bg-[#ffedd5] border-[#c2410c] text-[#7c2d12]' },
  { id: 'landfill', label: 'LANDFILL TRASH', examples: "Can't be recycled or composted", icon: Trash2, classes: 'bg-[#e7e5e4] border-[#57534e] text-[#292524]' },
];

const ITEMS: SortItem[] = [
  {
    id: 'plastic_bottle',
    name: 'Plastic Bottle',
    bin: 'recycling',
    correct: 'Splash-tastic! Rinsed plastic bottles get made into new bottles. One less bottle floating past my nose!',
    wrong: "Not that one! This bottle's plastic can be made into something new, so it shouldn't be buried or composted.",
    hint: 'Look for the little number triangle on the bottom. This bottle can have a second life!',
  },
  {
    id: 'aluminum_can',
    name: 'Soda Can',
    bin: 'recycling',
    correct: 'Yes! Aluminum cans can be recycled forever and be back on a shelf in about 60 days!',
    wrong: 'Hmm, metal cans are too valuable to throw away. They can be melted and reused again and again.',
    hint: 'Metal like this can be melted down and reused forever.',
  },
  {
    id: 'glass_jar',
    name: 'Glass Jar',
    bin: 'recycling',
    correct: 'Clink! Clean glass jars can be recycled over and over without wearing out.',
    wrong: "Oops! Glass doesn't rot like food and isn't toxic. It can be melted into new jars.",
    hint: 'Give it a rinse and it can become a brand-new jar.',
  },
  {
    id: 'newspaper',
    name: 'Newspaper',
    bin: 'recycling',
    correct: 'Right! Old newspapers get turned into new paper, saving trees for my forest friends.',
    wrong: 'Not quite! Clean, dry paper can be turned back into new paper.',
    hint: 'Clean, dry paper gets a second life as new paper.',
  },
  {
    id: 'cardboard_box',
    name: 'Cardboard Box',
    bin: 'recycling',
    correct: 'Perfect! Flattened cardboard is one of the easiest things to recycle.',
    wrong: 'Close! Clean cardboard is great for making new boxes.',
    hint: 'Flatten it first. It can become a new box!',
  },
  {
    id: 'banana_peel',
    name: 'Banana Peel',
    bin: 'compost',
    correct: 'Mmm, compost! Banana peels break down into rich soil for the farm crops.',
    wrong: 'That peel came from a plant. It can rot down into soil instead of piling up.',
    hint: 'This came from a plant. What happens to plants when they break down?',
  },
  {
    id: 'apple_core',
    name: 'Apple Core',
    bin: 'compost',
    correct: 'Crunch! Apple cores turn into yummy compost that helps the farm grow.',
    wrong: "Apple cores rot naturally. They don't belong in bins that can't handle food.",
    hint: 'Food scraps can become food for the soil!',
  },
  {
    id: 'eggshells',
    name: 'Eggshells',
    bin: 'compost',
    correct: 'Yes! Crushed eggshells add calcium to compost. Plants love it!',
    wrong: 'Eggshells are natural and break down. They make soil healthier!',
    hint: 'Natural kitchen scraps like this help gardens grow.',
  },
  {
    id: 'coffee_grounds',
    name: 'Coffee Grounds',
    bin: 'compost',
    correct: 'Great sort! Coffee grounds and paper filters are compost gold for worms.',
    wrong: 'Coffee grounds and the paper filter both come from plants and can break down.',
    hint: 'Worms love this stuff. Where do worms like to live?',
  },
  {
    id: 'battery',
    name: 'Battery',
    bin: 'hazardous',
    correct: 'Thank you! Batteries leak metals that poison my lake, so they need a special drop-off.',
    wrong: 'Careful! Batteries have metals inside that can leak, and they can even start fires in regular bins.',
    hint: 'This can leak harmful metals. It needs special handling.',
  },
  {
    id: 'paint_can',
    name: 'Old Paint',
    bin: 'hazardous',
    correct: 'Good thinking! Leftover paint has chemicals that must never wash into the water.',
    wrong: 'Uh-oh! Old paint has chemicals that could seep into the ground and into my lake.',
    hint: "There's leftover chemical goop inside. Where do dangerous liquids go?",
  },
  {
    id: 'old_phone',
    name: 'Old Phone',
    bin: 'hazardous',
    correct: 'Smart! Old phones are e-waste. Special centers recover the metals safely.',
    wrong: "Phones have batteries and metals inside. They shouldn't go in regular bins.",
    hint: 'Electronics have batteries and metals hiding inside.',
  },
  {
    id: 'fluorescent_bulb',
    name: 'Twisty Light Bulb',
    bin: 'hazardous',
    correct: 'Bright idea! These twisty bulbs have a little mercury, so they go to a safe drop-off.',
    wrong: 'Careful! These twisty bulbs contain a bit of mercury, which is toxic to fish.',
    hint: 'These twisty bulbs hide a tiny bit of something toxic.',
  },
  {
    id: 'chip_bag',
    name: 'Chip Bag',
    bin: 'landfill',
    correct: "Right! Shiny chip bags are plastic and foil stuck together, so they can't be recycled.",
    wrong: "Tricky one! Chip bags are plastic and foil glued together. Machines can't separate them, and they never rot.",
    hint: "It's shiny plastic and foil glued together. Machines can't split it apart.",
  },
  {
    id: 'foam_cup',
    name: 'Foam Cup',
    bin: 'landfill',
    correct: 'Yep! Most recycling programs can\'t take foam cups. Bring a reusable cup next time!',
    wrong: "Foam cups look recyclable, but most recycling centers can't take them, and they never break down.",
    hint: "Most places can't recycle foam. Better yet, use a reusable cup!",
  },
  {
    id: 'plastic_straw',
    name: 'Plastic Straw',
    bin: 'landfill',
    correct: 'Correct! Straws are too small for recycling machines. Even better: skip the straw!',
    wrong: "Straws are too tiny for recycling machines and they don't rot. Even better, skip them!",
    hint: "It's too small for the sorting machines, and it never rots.",
  },
  {
    id: 'candy_wrapper',
    name: 'Candy Wrapper',
    bin: 'landfill',
    correct: "Nice! Candy wrappers are mixed materials that can't be recycled.",
    wrong: "Candy wrappers are mixed plastic and foil. They can't be recycled or composted.",
    hint: 'Like chip bags, wrappers are made of mixed materials.',
  },
];

const COINS_PER_FIRST_TRY = 5;
const INTRO = "Hi friend! Now that my lake is clean, let's keep it that way! Drag each item into the right bin (or tap an item, then tap a bin). Stuck? Ask me for a hint!";

type MoMood = 'intro' | 'correct' | 'wrong' | 'hint' | 'done';

const BUBBLE_STYLES: Record<MoMood, string> = {
  intro: 'bg-[#fffbf2] border-[#5c2c16]',
  correct: 'bg-[#dcfce7] border-[#15803d]',
  wrong: 'bg-[#fef3c7] border-[#b45309]',
  hint: 'bg-[#e0f2fe] border-[#0284c7]',
  done: 'bg-[#dcfce7] border-[#15803d]',
};

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const itemImage = (id: string) => `/assets/recycling/${id}.png`;

interface Props {
  animal: AnimalInfo;
  isHappy: boolean;
  quest?: Quest;
  onClose: () => void;
  onStartQuest: () => void;
}

export default function MoSortingGame({ animal, isHappy, quest, onClose, onStartQuest }: Props) {
  const { addCoins } = useGameState();

  const [tray, setTray] = useState<SortItem[]>(() => shuffle(ITEMS));
  const [sorted, setSorted] = useState<Record<BinId, SortItem[]>>({ recycling: [], compost: [], hazardous: [], landfill: [] });
  const [missed, setMissed] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOverBin, setDragOverBin] = useState<BinId | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mo, setMo] = useState<{ mood: MoMood; text: string }>({ mood: 'intro', text: INTRO });

  const firstTryCount = useMemo(
    () => Object.values(sorted).flat().filter((item) => !missed.has(item.id)).length,
    [sorted, missed]
  );
  const isFinished = tray.length === 0;

  const moSays = (mood: MoMood, text: string) => {
    sounds.playAnimalChirp(animal.voicePitch);
    setMo({ mood, text });
  };

  const placeItem = (itemId: string, binId: BinId) => {
    const item = tray.find((i) => i.id === itemId);
    if (!item) return;
    setSelectedId(null);
    setDragOverBin(null);

    if (item.bin !== binId) {
      sounds.playClick();
      setMissed((prev) => new Set(prev).add(item.id));
      moSays('wrong', item.wrong);
      return;
    }

    sounds.playCoin();
    if (!missed.has(item.id)) addCoins(animal.biome, COINS_PER_FIRST_TRY);
    const remaining = tray.filter((i) => i.id !== item.id);
    setTray(remaining);
    setSorted((prev) => ({ ...prev, [binId]: [...prev[binId], item] }));

    if (remaining.length === 0) {
      const total = ITEMS.length;
      const firstTry = firstTryCount + (missed.has(item.id) ? 0 : 1);
      sounds.playFanfare();
      moSays(
        'done',
        firstTry === total
          ? `WOW! You sorted all ${total} items perfectly on the first try! My lake has never felt so safe!`
          : `You did it! Every item is in the right bin. You got ${firstTry} of ${total} on the first try. Thanks for keeping my lake clean!`
      );
    } else {
      moSays('correct', item.correct);
    }
  };

  const giveHint = () => {
    const item = tray.find((i) => i.id === selectedId) || tray[0];
    if (!item) return;
    setHintsUsed((n) => n + 1);
    setSelectedId(item.id);
    moSays('hint', `${item.name}: ${item.hint}`);
  };

  const restart = () => {
    sounds.playClick();
    setTray(shuffle(ITEMS));
    setSorted({ recycling: [], compost: [], hazardous: [], landfill: [] });
    setMissed(new Set());
    setSelectedId(null);
    setHintsUsed(0);
    setMo({ mood: 'intro', text: INTRO });
  };

  const avatar = isHappy ? animal.avatar : animal.avatar.replace('.png', '_sad.png');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-pixel">
      <div className="relative w-full max-w-3xl pixel-panel overflow-hidden flex flex-col max-h-[90vh] text-[#2e1005] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-2 border-[#fde68a] bg-[#2e1005] overflow-hidden flex-shrink-0">
              <img src={avatar} alt={animal.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xs font-pixel-heading text-[#fde68a] tracking-wider">
                {isHappy ? `${animal.name.toUpperCase()}'S SORTING GAME` : animal.name.toUpperCase()}
              </h3>
              <p className="text-[8.5px] text-[#fde68a]/80 mt-0.5">{animal.biomeName} • Keep the lake clean</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 pixel-btn-red text-[9px]" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isHappy ? (
          /* Locked until the lake is restored */
          <div className="p-6 bg-[#fcf6e8] flex flex-col items-center text-center gap-3">
            <img src={avatar} alt={`${animal.name} looking sad`} className="w-28 h-28" style={{ imageRendering: 'pixelated' }} />
            <div className="pixel-card p-3 max-w-md text-[10px] leading-relaxed">
              <strong>{animal.name}:</strong> &quot;I&apos;m too sad to play right now... my lake is full of trash and pollution.
              Can you clean it up first? Then come back and we&apos;ll play my sorting game!&quot;
            </div>
            {quest && !quest.completed && (
              <button onClick={onStartQuest} className="pixel-btn-green px-3 py-1.5 text-[9px] font-bold flex items-center gap-1">
                <span>START ACTION PLAN: {quest.title.toUpperCase()}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-[#fcf6e8] p-3.5 space-y-3">
            {/* Mo's speech bubble */}
            <div className="flex items-start gap-3">
              <img src={avatar} alt={animal.name} className="w-14 h-14 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
              <div className={`flex-1 border-2 p-2.5 text-[10px] leading-relaxed shadow-[2px_2px_0px_#2e1005] ${BUBBLE_STYLES[mo.mood]}`} aria-live="polite">
                <strong>{animal.name}:</strong> {mo.text}
              </div>
            </div>

            {/* Score strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] font-bold text-[#5c2c16]">
              <span>
                SORTED {ITEMS.length - tray.length}/{ITEMS.length} • FIRST TRY: {firstTryCount} • HINTS: {hintsUsed}
              </span>
              <span className="flex items-center gap-1 text-[#b45309]">
                <Coins className="w-3 h-3" /> +{COINS_PER_FIRST_TRY} {animal.coinName.toUpperCase()} PER FIRST-TRY SORT
              </span>
            </div>

            {/* Item tray */}
            {!isFinished ? (
              <div className="pixel-card p-2.5 bg-[#fefce8]">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-1.5">
                  {tray.map((item) => (
                    <button
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', item.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setSelectedId(item.id);
                      }}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedId((cur) => (cur === item.id ? null : item.id));
                      }}
                      className={`flex flex-col items-center p-1 border-2 cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-0.5 ${
                        selectedId === item.id ? 'border-[#b45309] bg-[#fde68a]' : 'border-transparent hover:border-[#5c2c16]/40'
                      }`}
                      aria-pressed={selectedId === item.id}
                    >
                      <img
                        src={itemImage(item.id)}
                        alt=""
                        draggable={false}
                        className="w-12 h-12"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <span className="text-[7.5px] leading-tight text-center mt-0.5">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pixel-card p-3 bg-[#dcfce7] flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold">
                <span>ALL SORTED! {firstTryCount}/{ITEMS.length} ON THE FIRST TRY</span>
                <button onClick={restart} className="pixel-btn px-3 py-1.5 text-[9px] flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> PLAY AGAIN
                </button>
              </div>
            )}

            {/* Bins */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {BINS.map((bin) => {
                const Icon = bin.icon;
                const active = dragOverBin === bin.id;
                return (
                  <button
                    key={bin.id}
                    onClick={() => selectedId && placeItem(selectedId, bin.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverBin(bin.id);
                    }}
                    onDragLeave={() => setDragOverBin((cur) => (cur === bin.id ? null : cur))}
                    onDrop={(e) => {
                      e.preventDefault();
                      placeItem(e.dataTransfer.getData('text/plain'), bin.id);
                    }}
                    className={`border-4 p-2 text-left flex flex-col min-h-[120px] shadow-[3px_3px_0px_#2e1005] transition-transform ${bin.classes} ${
                      active || (selectedId && !isFinished) ? 'scale-[1.02]' : ''
                    } ${active ? 'ring-4 ring-[#fde68a]' : ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[9px] font-bold leading-tight">{bin.label}</span>
                    </div>
                    <span className="text-[7.5px] opacity-80 mt-0.5">{bin.examples}</span>
                    <div className="flex flex-wrap gap-0.5 mt-1.5">
                      {sorted[bin.id].map((item) => (
                        <img
                          key={item.id}
                          src={itemImage(item.id)}
                          alt={item.name}
                          title={item.name}
                          className="w-6 h-6"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            {!isFinished && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button onClick={giveHint} className="pixel-btn px-3 py-1.5 text-[9px] flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-[#b45309]" /> ASK {animal.name.toUpperCase()} FOR A HINT
                </button>
                <button onClick={restart} className="pixel-btn px-3 py-1.5 text-[9px] flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> START OVER
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
