'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, CheckCircle, Circle, BookOpen, Lock, Sparkles, Award, RotateCcw } from 'lucide-react';

// ---------------------------------------------------------------
// "Saving Mo's Marsh": an interactive article. Every interactive step must be
// completed and the article read to the end before the lake can be restored.
// ---------------------------------------------------------------
type StepId = 'spot' | 'drain' | 'chain' | 'line' | 'speed' | 'pledge';

const STEP_LABELS: Record<StepId, string> = {
  spot: 'Spot the pollution',
  drain: 'Storm drain check',
  chain: 'Algae bloom chain',
  line: 'Fishing line question',
  speed: 'Safe boat speed',
  pledge: 'Marsh Protector pledge',
};

const POLLUTION_SOURCES = [
  {
    id: 'drain',
    icon: '🕳️',
    name: 'Street storm drain',
    fact: 'Rain washes oil, litter and lawn chemicals off streets and straight into storm drains, which often flow directly into the lake.',
  },
  {
    id: 'farm',
    icon: '🌾',
    name: 'Fertilized field',
    fact: 'Extra fertilizer on fields and lawns gets carried away by rain. Its nitrogen and phosphorus feed huge blooms of algae.',
  },
  {
    id: 'boat',
    icon: '🚤',
    name: 'Speeding boat',
    fact: 'Fast boats can hit manatees resting near the surface, and their propellers churn up mud and tear out seagrass beds.',
  },
];

const CHAIN_STEPS = [
  'Too much fertilizer is spread on lawns and farms',
  'Rain washes it into the lake',
  'Algae explode into a thick green bloom',
  'The bloom blocks sunlight and seagrass dies',
  'Rotting algae use up oxygen and fish suffocate',
];

const LINE_OPTIONS = ['About 6 months', 'About 60 years', 'About 600 years', 'It dissolves in a week'];
const LINE_ANSWER = 'About 600 years';

const PLEDGES = [
  'I will never dump anything down a storm drain',
  'I will recycle fishing line in special bins, never toss it',
  'I will use reusable bottles and bags',
  'I will remind boaters to go slow in manatee zones',
];

const SAFE_SPEED = 5;

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---- Small building blocks (module level so inputs keep focus between renders) ----
function StepBadge({ isDone }: { isDone: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 border flex-shrink-0 ${
        isDone ? 'bg-[#dcfce7] border-[#15803d] text-[#14532d]' : 'bg-[#fef3c7] border-[#b45309] text-[#78350f]'
      }`}
    >
      {isDone ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
      {isDone ? 'DONE' : 'TRY IT'}
    </span>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="font-pixel-heading text-[11px] text-[#0c4a6e] leading-snug">
        {n}. {title}
      </h4>
      {children}
    </section>
  );
}

function Interactive({ isDone, prompt, children }: { isDone: boolean; prompt: string; children: React.ReactNode }) {
  return (
    <div className={`border-2 p-3 space-y-2 ${isDone ? 'border-[#15803d] bg-[#f0fdf4]' : 'border-[#0284c7] bg-[#f0f9ff]'}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10.5px] font-bold text-[#0c4a6e]">{prompt}</span>
        <StepBadge isDone={isDone} />
      </div>
      {children}
    </div>
  );
}

export default function LakeRecyclingModal() {
  const { activeQuestModal, closeQuestModal, completeQuest, quests, restoration } = useGameState();

  // Step progress
  const [revealed, setRevealed] = useState<string[]>([]);
  const [drainAnswer, setDrainAnswer] = useState<'true' | 'false' | null>(null);
  const [chainOrder, setChainOrder] = useState<number[]>([]);
  const [chainWrong, setChainWrong] = useState<number | null>(null);
  const [lineAnswer, setLineAnswer] = useState<string | null>(null);
  const [lineWrong, setLineWrong] = useState<string[]>([]);
  const [speed, setSpeed] = useState(25);
  const [speedSet, setSpeedSet] = useState<number | null>(null);
  const [pledged, setPledged] = useState<boolean[]>(PLEDGES.map(() => false));
  const [readToEnd, setReadToEnd] = useState(false);
  const chainShuffled = useMemo(() => shuffle(CHAIN_STEPS.map((_, i) => i)), []);
  const lineOptions = useMemo(() => shuffle(LINE_OPTIONS), []);
  const articleRef = useRef<HTMLDivElement>(null);

  // Always start the guide fresh when it opens (this window stays mounted while closed,
  // so old progress would otherwise carry over, even after the game progress is reset)
  useEffect(() => {
    if (activeQuestModal !== 'lake_recycling') return;
    setRevealed([]);
    setDrainAnswer(null);
    setChainOrder([]);
    setChainWrong(null);
    setLineAnswer(null);
    setLineWrong([]);
    setSpeed(25);
    setSpeedSet(null);
    setPledged(PLEDGES.map(() => false));
    setReadToEnd(false);
    articleRef.current?.scrollTo({ top: 0 });
  }, [activeQuestModal]);

  // If the whole article fits on screen, there's nothing to scroll, so it counts as read
  useEffect(() => {
    const el = articleRef.current;
    if (activeQuestModal === 'lake_recycling' && el && el.scrollHeight <= el.clientHeight + 24) setReadToEnd(true);
  }, [activeQuestModal]);

  if (activeQuestModal !== 'lake_recycling') return null;

  const lakeQuest = quests.find((q) => q.id === 'quest_lake');
  const restored = !!lakeQuest?.completed && (restoration.lake || 0) >= 80;

  const done: Record<StepId, boolean> = {
    spot: revealed.length === POLLUTION_SOURCES.length,
    drain: drainAnswer === 'false',
    chain: chainOrder.length === CHAIN_STEPS.length,
    line: lineAnswer === LINE_ANSWER,
    speed: speedSet !== null && speedSet <= SAFE_SPEED,
    pledge: pledged.every(Boolean),
  };
  const stepsDone = Object.values(done).filter(Boolean).length;
  const totalSteps = Object.keys(done).length;
  const allDone = stepsDone === totalSteps && readToEnd;

  // ---- Interactions ----
  const reveal = (id: string) => {
    if (revealed.includes(id)) return;
    sounds.playCoin();
    setRevealed((r) => [...r, id]);
  };

  const answerDrain = (value: 'true' | 'false') => {
    if (drainAnswer === 'false') return;
    setDrainAnswer(value);
    if (value === 'false') sounds.playCoin();
    else sounds.playClick();
  };

  const pickChain = (stepIndex: number) => {
    if (chainOrder.includes(stepIndex) || done.chain) return;
    if (stepIndex === chainOrder.length) {
      sounds.playCoin();
      setChainOrder((o) => [...o, stepIndex]);
      setChainWrong(null);
    } else {
      sounds.playClick();
      setChainWrong(stepIndex);
    }
  };

  const answerLine = (option: string) => {
    if (lineAnswer === LINE_ANSWER || lineWrong.includes(option)) return;
    if (option === LINE_ANSWER) {
      sounds.playCoin();
      setLineAnswer(option);
    } else {
      sounds.playClick();
      setLineWrong((w) => [...w, option]);
    }
  };

  const confirmSpeed = () => {
    setSpeedSet(speed);
    if (speed <= SAFE_SPEED) sounds.playCoin();
    else sounds.playClick();
  };

  const togglePledge = (i: number) => {
    sounds.playClick();
    setPledged((p) => p.map((v, j) => (j === i ? !v : v)));
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!readToEnd && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setReadToEnd(true);
  };

  const restore = () => {
    if (!allDone) return;
    completeQuest(
      'quest_lake',
      'Read the full "Saving Mo\'s Marsh" guide, mapped the pollution sources, traced the algae bloom chain, set safe boat speeds and took the Marsh Protector pledge.'
    );
  };

  const resetArticle = () => {
    sounds.playClick();
    setRevealed([]);
    setDrainAnswer(null);
    setChainOrder([]);
    setChainWrong(null);
    setLineAnswer(null);
    setLineWrong([]);
    setSpeed(25);
    setSpeedSet(null);
    setPledged(PLEDGES.map(() => false));
    setReadToEnd(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div className="relative w-full max-w-2xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl max-h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb] flex-shrink-0">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#fde68a]" />
            <div>
              <h3 className="font-pixel-heading text-xs text-[#fde68a] tracking-wider">SAVING MO&apos;S MARSH</h3>
              <p className="text-[9.5px] text-[#fde68a]/80 mt-0.5">Crystal Marsh • An interactive guide to clean lakes</p>
            </div>
          </div>
          <button onClick={closeQuestModal} className="p-1 pixel-btn-red" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress checklist */}
        <div className="px-3.5 py-2 bg-[#e0f2fe] border-b-2 border-[#0369a1] flex-shrink-0">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#0c4a6e] mb-1">
            <span>
              {restored ? 'LAKE RESTORED!' : `STEPS DONE: ${stepsDone}/${totalSteps}`} • {readToEnd ? 'READ TO THE END ✓' : 'SCROLL TO THE END'}
            </span>
            <span>{Math.round(((stepsDone + (readToEnd ? 1 : 0)) / (totalSteps + 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-[#0c4a6e]/20 h-2.5 border border-[#0c4a6e]">
            <div
              className="h-full bg-[#0284c7] transition-all duration-300"
              style={{ width: `${((stepsDone + (readToEnd ? 1 : 0)) / (totalSteps + 1)) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[9px]">
            {(Object.keys(STEP_LABELS) as StepId[]).map((id) => (
              <span key={id} className={`flex items-center gap-1 ${done[id] ? 'text-[#15803d]' : 'text-[#64748b]'}`}>
                {done[id] ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                {STEP_LABELS[id]}
              </span>
            ))}
          </div>
        </div>

        {/* Article */}
        <div ref={articleRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#fffbf2] text-[11.5px] leading-relaxed" onScroll={onScroll}>
          <p className="text-[12px]">
            Mo the Manatee&apos;s lake used to be so clear you could see the seagrass swaying on the bottom. Lately the water has turned
            murky and green, and Mo&apos;s favorite seagrass meadows are disappearing. Where is all this pollution coming from, and how do we
            stop it? Read on, and try each activity along the way.
          </p>

          <Section n={1} title="Pollution Has Many Sources">
            <p>
              Lake pollution rarely comes from one big pipe. Most of it is <strong>nonpoint source pollution</strong>: lots of small amounts
              from streets, farms, yards and boats that add up. Scientists say it&apos;s the biggest water quality problem in many lakes and
              rivers.
            </p>
            <Interactive isDone={done.spot} prompt="Tap each source to discover how it pollutes Mo's lake.">
              <div className="grid sm:grid-cols-3 gap-2">
                {POLLUTION_SOURCES.map((src) => {
                  const open = revealed.includes(src.id);
                  return (
                    <button
                      key={src.id}
                      onClick={() => reveal(src.id)}
                      className={`text-left p-2 border-2 shadow-[2px_2px_0px_#0c4a6e] transition-colors ${
                        open ? 'bg-[#dcfce7] border-[#15803d]' : 'bg-white border-[#0369a1] hover:bg-[#e0f2fe]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-[10.5px]">
                        <span className="text-lg">{src.icon}</span> {src.name}
                      </div>
                      <p className="text-[10px] mt-1">{open ? src.fact : 'Tap to reveal...'}</p>
                    </button>
                  );
                })}
              </div>
            </Interactive>
          </Section>

          <Section n={2} title="Where Does Rainwater Go?">
            <p>
              When it rains, water runs off roofs, driveways and roads. That&apos;s called <strong>stormwater runoff</strong>. As it flows, it
              picks up everything in its path: motor oil, pet waste, litter, soap from car washing and lawn fertilizer.
            </p>
            <Interactive isDone={done.drain} prompt="True or false: Water that goes down a street storm drain gets cleaned at a treatment plant before it reaches the lake.">
              <div className="flex gap-2">
                {(['true', 'false'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => answerDrain(v)}
                    className={`flex-1 py-1.5 border-2 text-[11px] font-bold ${
                      drainAnswer === v
                        ? v === 'false'
                          ? 'bg-[#dcfce7] border-[#15803d]'
                          : 'bg-[#fee2e2] border-[#b91c1c]'
                        : 'bg-white border-[#0369a1] hover:bg-[#e0f2fe]'
                    }`}
                  >
                    {v.toUpperCase()}
                  </button>
                ))}
              </div>
              {drainAnswer === 'true' && (
                <p className="text-[10.5px] text-[#b91c1c]">Not quite! Try again. Think about where those street grates lead.</p>
              )}
              {drainAnswer === 'false' && (
                <p className="text-[10.5px] text-[#14532d]">
                  Correct! In most towns, storm drains flow straight into lakes, rivers and the ocean with no cleaning at all. Only the water
                  from sinks and toilets goes to a treatment plant.
                </p>
              )}
            </Interactive>
          </Section>

          <Section n={3} title="Green Water and Dead Zones">
            <p>
              Fertilizer is great for crops, but in a lake it&apos;s a feast for <strong>algae</strong>. Extra nitrogen and phosphorus can make
              algae grow out of control into an <strong>algae bloom</strong> that turns the water bright green. Some blooms, made by
              blue-green algae, are even toxic to pets and people.
            </p>
            <Interactive isDone={done.chain} prompt="Put the chain reaction in order: tap the steps from first to last.">
              <ol className="space-y-1">
                {chainOrder.map((idx, n) => (
                  <li key={idx} className="text-[10.5px] px-2 py-1 bg-[#dcfce7] border-2 border-[#15803d]">
                    {n + 1}. {CHAIN_STEPS[idx]}
                  </li>
                ))}
              </ol>
              {!done.chain && (
                <div className="grid gap-1.5">
                  {chainShuffled
                    .filter((idx) => !chainOrder.includes(idx))
                    .map((idx) => (
                      <button
                        key={idx}
                        onClick={() => pickChain(idx)}
                        className={`text-left text-[10.5px] px-2 py-1.5 border-2 ${
                          chainWrong === idx ? 'bg-[#fee2e2] border-[#b91c1c]' : 'bg-white border-[#0369a1] hover:bg-[#e0f2fe]'
                        }`}
                      >
                        {CHAIN_STEPS[idx]}
                      </button>
                    ))}
                </div>
              )}
              {chainWrong !== null && !done.chain && (
                <p className="text-[10.5px] text-[#b91c1c]">That happens later in the chain. What comes next?</p>
              )}
              {done.chain && (
                <p className="text-[10.5px] text-[#14532d]">
                  Exactly! Areas with almost no oxygen are called <strong>dead zones</strong>, because few animals can survive there.
                </p>
              )}
            </Interactive>
          </Section>

          <Section n={4} title="Plastic That Never Leaves">
            <p>
              Plastic doesn&apos;t rot. Sunlight and waves just break it into smaller and smaller bits called <strong>microplastics</strong>,
              which fish and birds swallow by mistake. Lost fishing line is especially dangerous. It wraps around flippers, beaks and
              propellers, and manatees can lose flippers to tangled line.
            </p>
            <Interactive isDone={done.line} prompt="About how long can a piece of fishing line last in the water?">
              <div className="grid sm:grid-cols-2 gap-1.5">
                {lineOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => answerLine(opt)}
                    disabled={done.line || lineWrong.includes(opt)}
                    className={`text-left text-[10.5px] px-2 py-1.5 border-2 ${
                      lineAnswer === opt
                        ? 'bg-[#dcfce7] border-[#15803d]'
                        : lineWrong.includes(opt)
                          ? 'bg-[#fee2e2] border-[#b91c1c] line-through opacity-70'
                          : 'bg-white border-[#0369a1] hover:bg-[#e0f2fe]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {done.line && (
                <p className="text-[10.5px] text-[#14532d]">
                  Yes, around 600 years! That&apos;s why many docks have special recycling tubes just for used fishing line.
                </p>
              )}
            </Interactive>
          </Section>

          <Section n={5} title="Gentle Giants in the Slow Lane">
            <p>
              Manatees are gentle plant-eaters that munch about a tenth of their body weight in seagrass every day. They swim slowly and
              rest just below the surface, so they can&apos;t always get out of the way of fast boats. Boat strikes are one of the biggest
              human-caused dangers to manatees, so many lakes and rivers have <strong>slow-speed zones</strong> where boats must go at idle
              speed.
            </p>
            <Interactive isDone={done.speed} prompt={`You're driving a boat into Mo's manatee zone. Set a safe speed (${SAFE_SPEED} mph or less), then confirm.`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">🚤</span>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={speed}
                  onChange={(e) => {
                    setSpeed(Number(e.target.value));
                    if (!done.speed) setSpeedSet(null);
                  }}
                  disabled={done.speed}
                  className="flex-1 accent-[#0284c7]"
                  aria-label="Boat speed in miles per hour"
                />
                <span className={`w-16 text-right font-bold text-[11px] ${speed <= SAFE_SPEED ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
                  {speed} MPH
                </span>
                <button onClick={confirmSpeed} disabled={done.speed} className="pixel-btn px-2.5 py-1 text-[10px] disabled:opacity-50">
                  CONFIRM
                </button>
              </div>
              {speedSet !== null && speedSet > SAFE_SPEED && (
                <p className="text-[10.5px] text-[#b91c1c]">Too fast! A manatee could be resting right under the surface. Slow down.</p>
              )}
              {done.speed && (
                <p className="text-[10.5px] text-[#14532d]">
                  Perfect. At idle speed, you have time to spot Mo and steer around, and your wake won&apos;t tear up the seagrass.
                </p>
              )}
            </Interactive>
          </Section>

          <Section n={6} title="Nature's Water Filters">
            <p>
              The good news: lakes have natural helpers. <strong>Wetlands</strong>, the marshy edges full of cattails and reeds, act like
              giant sponges and filters. Their roots trap mud and soak up extra fertilizer before it reaches open water. Planting{' '}
              <strong>buffer strips</strong> of native plants along shorelines and farm edges does the same job. Protecting wetlands is one
              of the best ways to keep a lake clear.
            </p>
            <Interactive isDone={done.pledge} prompt="Become a Marsh Protector: check every promise you'll keep.">
              <div className="space-y-1.5">
                {PLEDGES.map((p, i) => (
                  <label key={p} className="flex items-center gap-2 text-[10.5px] cursor-pointer">
                    <input type="checkbox" checked={pledged[i]} onChange={() => togglePledge(i)} className="w-4 h-4 accent-[#15803d]" />
                    <span className={pledged[i] ? 'text-[#14532d] font-bold' : ''}>{p}</span>
                  </label>
                ))}
              </div>
            </Interactive>
          </Section>

          <section className="space-y-2">
            <h4 className="font-pixel-heading text-[11px] text-[#0c4a6e]">Small Choices, Clear Water</h4>
            <p>
              Every storm drain, garden and boat ride connects to Mo&apos;s home. When we use less fertilizer, keep trash and chemicals out of
              drains, recycle fishing line and slow down for wildlife, the algae fade, the seagrass grows back and the water turns crystal
              clear again. You&apos;ve made it to the end. Mo is so proud of you!
            </p>
          </section>

          {/* Restore */}
          <div className="border-t-2 border-[#5c2c16] pt-4 pb-1 text-center space-y-2">
            {restored ? (
              <>
                <div className="inline-flex p-2.5 bg-[#e0f2fe] border-2 border-[#0284c7]">
                  <Award className="w-7 h-7 text-[#0369a1]" />
                </div>
                <p className="font-pixel-heading text-[11px]">CRYSTAL MARSH RESTORED!</p>
                <p className="text-[10.5px] text-[#15803d] font-bold">+300 Azure Ripple Coins & 100% lake flourish</p>
                <button onClick={closeQuestModal} className="pixel-btn-green px-4 py-2 text-[10.5px]">
                  BACK TO WORLD
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={restore}
                  disabled={!allDone}
                  className="pixel-btn-green px-5 py-2.5 text-[11px] font-bold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {allDone ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  RESTORE THE LAKE
                </button>
                <p className="text-[10px] text-[#78350f]">
                  {allDone
                    ? 'Everything is complete. Restore Crystal Marsh for Mo! (+300 coins)'
                    : `Finish all ${totalSteps} activities and read to the end to unlock. (${stepsDone}/${totalSteps} activities done)`}
                </p>
                {stepsDone > 0 && (
                  <button onClick={resetArticle} className="text-[9.5px] underline text-[#78350f] inline-flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Start the activities over
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
