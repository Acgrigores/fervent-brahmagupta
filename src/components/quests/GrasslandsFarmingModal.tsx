'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { sounds } from '@/utils/soundEffects';
import { X, ArrowRight, CheckCircle, Circle, Radar, Flag, Sparkles, Award, Handshake } from 'lucide-react';

// ---------------------------------------------------------------
// Bayer Precision Buffer & Pollinator Program
// Growers use precision yield data to find underperforming cropland, then
// convert those spots into field borders, streambank buffers or pollinator habitat.
// ---------------------------------------------------------------
const COLS = 10;
const ROWS = 6;
const ACRES_PER_PLOT = 5;
const LOW_YIELD = 60;

type Zone = 'stream' | 'edge' | 'interior';
type Conversion = 'stream' | 'border' | 'pollinator';

const CONVERSIONS: Record<Conversion, { label: string; icon: string; fits: Zone; tip: string; color: string }> = {
  stream: {
    label: 'Streambank Buffer',
    icon: '🌳',
    fits: 'stream',
    tip: 'Trees and deep-rooted grasses along the creek hold the bank in place and filter fertilizer before it reaches the water.',
    color: 'bg-[#166534]',
  },
  border: {
    label: 'Field Border',
    icon: '🌿',
    fits: 'edge',
    tip: 'A strip of native grasses along the field edge stops soil from washing or blowing away and gives wildlife a safe corridor.',
    color: 'bg-[#65a30d]',
  },
  pollinator: {
    label: 'Pollinator & Prairie Habitat',
    icon: '🌸',
    fits: 'interior',
    tip: 'A patch of native wildflowers and prairie grasses feeds bees and monarch butterflies that pollinate nearby crops.',
    color: 'bg-[#c026d3]',
  },
};

// Underperforming plots (row, col): two by the creek, two on the field edges, two wet low spots inside the field
const LOW_PLOTS = new Set(['2-0', '3-0', '0-5', '4-9', '3-4', '4-6']);

function zoneOf(r: number, c: number): Zone {
  if (c === 0) return 'stream';
  if (r === 0 || r === ROWS - 1 || c === COLS - 1) return 'edge';
  return 'interior';
}

function yieldOf(r: number, c: number) {
  if (LOW_PLOTS.has(`${r}-${c}`)) return 34 + ((r * 7 + c * 5) % 18);
  return 72 + ((r * 13 + c * 11) % 27);
}

function yieldColor(y: number) {
  if (y < LOW_YIELD) return 'bg-[#dc2626]';
  if (y < 80) return 'bg-[#facc15]';
  if (y < 90) return 'bg-[#84cc16]';
  return 'bg-[#16a34a]';
}

type Stage = 'learn' | 'scan' | 'flag' | 'convert' | 'results';
const STAGES: { id: Stage; label: string }[] = [
  { id: 'learn', label: 'Learn' },
  { id: 'scan', label: 'Scan yields' },
  { id: 'flag', label: 'Flag low spots' },
  { id: 'convert', label: 'Convert' },
  { id: 'results', label: 'Enroll' },
];

export default function GrasslandsFarmingModal() {
  const { activeQuestModal, closeQuestModal, completeQuest, quests, restoration } = useGameState();
  const [stage, setStage] = useState<Stage>('learn');
  const [scanned, setScanned] = useState(false);
  const [flagged, setFlagged] = useState<string[]>([]);
  const [converted, setConverted] = useState<Record<string, Conversion>>({});
  const [tool, setTool] = useState<Conversion>('stream');
  const [message, setMessage] = useState<{ good: boolean; text: string } | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(36);
  const mapStage = stage === 'scan' || stage === 'flag' || stage === 'convert';

  // Always start fresh from step 1 when the task opens (this window stays mounted while closed,
  // so without this it would reopen on the last step, even after the game progress is reset)
  useEffect(() => {
    if (activeQuestModal !== 'grasslands_farming') return;
    setStage('learn');
    setScanned(false);
    setFlagged([]);
    setConverted({});
    setTool('stream');
    setMessage(null);
  }, [activeQuestModal]);

  // Size the field plots so the whole map fits in the space left on screen (no scrolling)
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      const size = Math.floor(Math.min((width - 32) / COLS, (height - 8) / ROWS));
      setCell(Math.max(16, Math.min(56, size)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mapStage, activeQuestModal]);

  const plots = useMemo(
    () =>
      Array.from({ length: ROWS * COLS }, (_, i) => {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        return { key: `${r}-${c}`, r, c, zone: zoneOf(r, c), yield: yieldOf(r, c), low: LOW_PLOTS.has(`${r}-${c}`) };
      }),
    []
  );

  if (activeQuestModal !== 'grasslands_farming') return null;

  const grassQuest = quests.find((q) => q.id === 'quest_grasslands');
  const restored = !!grassQuest?.completed && (restoration.grasslands || 0) >= 80;
  const allFlagged = flagged.length === LOW_PLOTS.size;
  const allConverted = Object.keys(converted).length === LOW_PLOTS.size;
  const stageIndex = STAGES.findIndex((s) => s.id === stage);

  const avgYield = (keys: string[] | null) => {
    const list = plots.filter((p) => (keys ? !keys.includes(p.key) : true));
    return Math.round(list.reduce((sum, p) => sum + p.yield, 0) / list.length);
  };

  // ---- Actions ----
  const runScan = () => {
    sounds.playBloom();
    setScanned(true);
    setMessage({ good: true, text: 'Scan complete! Red areas are producing less than 60% of their potential. Tap each one to flag it.' });
    setTimeout(() => setStage('flag'), 600);
  };

  const clickPlot = (p: (typeof plots)[number]) => {
    if (stage === 'flag') {
      if (!p.low) {
        sounds.playClick();
        setMessage({ good: false, text: `This plot is producing ${p.yield}%. That's healthy, so keep farming it! Look for the red, underperforming spots.` });
        return;
      }
      if (flagged.includes(p.key)) return;
      sounds.playCoin();
      const next = [...flagged, p.key];
      setFlagged(next);
      setMessage({
        good: true,
        text:
          next.length === LOW_PLOTS.size
            ? 'All underperforming plots flagged! These spots cost more to farm than they earn, so they are perfect for conservation.'
            : `Flagged! Only ${p.yield}% yield here. ${LOW_PLOTS.size - next.length} more to find.`,
      });
      return;
    }
    if (stage === 'convert') {
      if (!p.low) {
        sounds.playClick();
        setMessage({ good: false, text: 'Only convert the flagged, underperforming plots. Healthy cropland stays in production.' });
        return;
      }
      if (converted[p.key]) return;
      const choice = CONVERSIONS[tool];
      if (choice.fits !== p.zone) {
        sounds.playClick();
        const hint =
          p.zone === 'stream'
            ? 'This plot sits right on the creek. What would protect the streambank?'
            : p.zone === 'edge'
              ? 'This plot is on the edge of the field. What kind of strip belongs along a field edge?'
              : 'This is a wet low spot in the middle of the field. What could bloom here for bees and butterflies?';
        setMessage({ good: false, text: `${choice.label} isn't the best fit here. ${hint}` });
        return;
      }
      sounds.playBloom();
      const next = { ...converted, [p.key]: tool };
      setConverted(next);
      setMessage({
        good: true,
        text: Object.keys(next).length === LOW_PLOTS.size ? 'Every low spot has a new purpose! See your results.' : `${choice.label} planted! ${choice.tip}`,
      });
    }
  };

  const enroll = () => {
    completeQuest(
      'quest_grasslands',
      `Enrolled in the Bayer Precision Buffer & Pollinator Program: used yield data to convert ${LOW_PLOTS.size * ACRES_PER_PLOT} acres of underperforming cropland into streambank buffers, field borders and pollinator habitat.`
    );
  };

  const restart = () => {
    sounds.playClick();
    setStage('learn');
    setScanned(false);
    setFlagged([]);
    setConverted({});
    setTool('stream');
    setMessage(null);
  };

  const countOf = (c: Conversion) => Object.values(converted).filter((v) => v === c).length * ACRES_PER_PLOT;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 bg-stone-900/60 backdrop-blur-sm animate-in fade-in font-pixel">
      <div
        className={`relative w-full max-w-3xl pixel-panel overflow-hidden text-[#2e1005] shadow-2xl max-h-full flex flex-col ${mapStage ? 'h-full max-h-[720px]' : ''}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦋</span>
            <div>
              <h3 className="font-pixel-heading text-[13px] text-[#fde68a] tracking-wider">PRECISION BUFFER & POLLINATOR PROGRAM</h3>
              <p className="text-[10.5px] text-[#fde68a]/85 mt-0.5 flex items-center gap-1">
                <Handshake className="w-3.5 h-3.5" /> In partnership with Bayer • Restore Aura&apos;s meadow
              </p>
            </div>
          </div>
          <button onClick={closeQuestModal} className="p-1 pixel-btn-red" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step tracker */}
        <div className="px-4 py-2 bg-[#ecfccb] border-b-2 border-[#4d7c0f] flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold flex-shrink-0">
          {STAGES.map((s, i) => (
            <span key={s.id} className={`flex items-center gap-1 ${i < stageIndex ? 'text-[#15803d]' : i === stageIndex ? 'text-[#2e1005]' : 'text-[#78716c]'}`}>
              {i < stageIndex ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
              {i + 1}. {s.label}
            </span>
          ))}
        </div>

        <div
          className={`flex-1 bg-[#fffbf2] text-[12px] leading-relaxed ${
            mapStage ? 'min-h-0 overflow-hidden p-3 flex flex-col' : 'overflow-y-auto p-5 space-y-4'
          }`}
        >
          {/* 1. Learn */}
          {stage === 'learn' && (
            <div className="space-y-3">
              <h4 className="font-pixel-heading text-[12px] text-[#365314]">Not every acre pays its way</h4>
              <p>
                On almost every farm, a few spots produce much less than the rest: soggy low spots, shady field edges, and strips along
                creeks that flood. Farmers still pay for seed, fuel and fertilizer on those acres, but get little harvest back, and the extra
                fertilizer can wash into streams.
              </p>
              <p>
                <strong>Precision agriculture</strong> uses yield monitors, GPS and satellite data to map exactly which parts of a field are
                underperforming. Instead of farming them anyway, growers can turn those spots into something more valuable:
              </p>
              <div className="grid sm:grid-cols-3 gap-2">
                {(Object.keys(CONVERSIONS) as Conversion[]).map((c) => (
                  <div key={c} className="pixel-card p-2.5 bg-[#f7fee7]">
                    <div className="font-bold text-[11.5px] flex items-center gap-1.5">
                      <span className="text-lg">{CONVERSIONS[c].icon}</span> {CONVERSIONS[c].label}
                    </div>
                    <p className="text-[11px] mt-1">{CONVERSIONS[c].tip}</p>
                  </div>
                ))}
              </div>
              <div className="border-2 border-[#15803d] bg-[#f0fdf4] p-3 flex gap-2.5">
                <Handshake className="w-6 h-6 text-[#15803d] flex-shrink-0" />
                <p>
                  <strong>Bayer</strong> co-funds projects that help growers do exactly this, such as a{' '}
                  <strong>Regional Conservation Partnership Program (RCPP)</strong> initiative in Missouri. Growers use precision data to find
                  their underperforming cropland and convert it into field borders, streambank buffers and pollinator and prairie habitat.
                </p>
              </div>
              <p>
                Aura&apos;s meadow sits next to a farm that wants to join the program. Help the farmer scan the field, find the low spots and give
                each one a new purpose!
              </p>
              <div className="flex justify-end">
                <button onClick={() => (sounds.playClick(), setStage('scan'))} className="pixel-btn-green px-4 py-2 text-[12px] inline-flex items-center gap-1.5">
                  LET&apos;S MAP THE FIELD <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 2-4. The field map */}
          {(stage === 'scan' || stage === 'flag' || stage === 'convert') && (
            <div className="flex-1 min-h-0 flex flex-col gap-2">
              {/* Everything around the field keeps a fixed size at every step, so the field never changes size */}
              <p className="font-bold text-[12px] leading-snug h-[34px] overflow-hidden flex-shrink-0">
                {stage === 'scan' && 'Step 2: Run a precision yield scan over the 300-acre field.'}
                {stage === 'flag' && `Step 3: Tap every red, underperforming plot to flag it. (${flagged.length}/${LOW_PLOTS.size} flagged)`}
                {stage === 'convert' &&
                  `Step 4: Pick a conversion, then tap each flagged plot to give it the best new use. (${Object.keys(converted).length}/${LOW_PLOTS.size} converted)`}
              </p>

              <div className={`grid grid-cols-3 gap-1.5 flex-shrink-0 ${stage === 'convert' ? '' : 'invisible'}`} aria-hidden={stage !== 'convert'}>
                  {(Object.keys(CONVERSIONS) as Conversion[]).map((c) => (
                    <button
                      key={c}
                      disabled={stage !== 'convert'}
                      onClick={() => (sounds.playClick(), setTool(c))}
                      className={`px-2 py-1 border-2 text-left text-[10.5px] font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#2e1005] ${
                        tool === c ? 'bg-[#fde68a] border-[#b45309]' : 'bg-white border-[#5c2c16] hover:bg-[#fef9c3]'
                      }`}
                      aria-pressed={tool === c}
                    >
                      <span className="text-lg">{CONVERSIONS[c].icon}</span>
                      <span>
                        {CONVERSIONS[c].label}
                        <span className="block font-normal text-[10px] opacity-75">
                          Best for: {CONVERSIONS[c].fits === 'stream' ? 'by the creek' : CONVERSIONS[c].fits === 'edge' ? 'field edges' : 'low spots inside'}
                        </span>
                      </span>
                    </button>
                  ))}
              </div>

              {/* Field: creek runs down the left side. Plot size is measured to fit the space left. */}
              <div ref={fieldRef} className="flex-1 min-h-0 flex items-center justify-center">
              <div className="flex border-4 border-[#3f2a14] shadow-[3px_3px_0px_#2e1005]">
                <div className="w-6 bg-[#38bdf8] relative flex-shrink-0" aria-label="Creek">
                  <div className="absolute inset-0 opacity-60 bg-[repeating-linear-gradient(180deg,#7dd3fc_0px,#7dd3fc_4px,transparent_4px,transparent_12px)]" />
                  <span className="absolute -rotate-90 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold text-[#0c4a6e] whitespace-nowrap">
                    CREEK
                  </span>
                </div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, ${cell}px)`, gridAutoRows: `${cell}px` }}>
                  {plots.map((p) => {
                    const conv = converted[p.key];
                    const isFlagged = flagged.includes(p.key);
                    const base = conv ? CONVERSIONS[conv].color : scanned ? yieldColor(p.yield) : 'bg-[#a3a35c]';
                    return (
                      <button
                        key={p.key}
                        onClick={() => clickPlot(p)}
                        disabled={stage === 'scan'}
                        className={`relative border border-[#3f2a14]/40 ${base} ${
                          stage !== 'scan' ? 'hover:brightness-110 cursor-pointer' : 'cursor-default'
                        } ${isFlagged && !conv ? 'ring-2 ring-inset ring-white' : ''}`}
                        aria-label={`Plot row ${p.r + 1} column ${p.c + 1}${scanned ? `, ${p.yield}% yield` : ''}`}
                      >
                        {!scanned && !conv && (
                          <span className="absolute inset-0 opacity-50 bg-[repeating-linear-gradient(90deg,#6b6b2e_0px,#6b6b2e_2px,transparent_2px,transparent_6px)]" />
                        )}
                        {conv ? (
                          <span className="text-[15px] leading-none">{CONVERSIONS[conv].icon}</span>
                        ) : isFlagged ? (
                          <Flag className="w-3.5 h-3.5 mx-auto text-white" />
                        ) : scanned ? (
                          <span className="text-[9px] font-bold text-[#1c1917]/80">{p.yield}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
              </div>

              <div className={`flex flex-wrap gap-3 text-[10.5px] font-bold flex-shrink-0 ${scanned ? '' : 'invisible'}`}>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#16a34a] inline-block" /> 90%+ yield</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#84cc16] inline-block" /> 80–89%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#facc15] inline-block" /> 60–79%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#dc2626] inline-block" /> Under 60%: underperforming</span>
              </div>

              {/* Fixed-height feedback box (empty until there's something to say) */}
              <div
                className={`border-2 px-2.5 py-1.5 text-[11px] leading-snug h-[58px] overflow-hidden flex-shrink-0 ${
                  !message ? 'border-transparent' : message.good ? 'bg-[#dcfce7] border-[#15803d]' : 'bg-[#fef3c7] border-[#b45309]'
                }`}
                aria-live="polite"
              >
                {message?.text}
              </div>

              <div className="flex justify-end flex-shrink-0">
                {stage === 'scan' && (
                  <button onClick={runScan} className="pixel-btn-green px-4 py-2 text-[12px] inline-flex items-center gap-1.5">
                    <Radar className="w-4 h-4" /> RUN PRECISION YIELD SCAN
                  </button>
                )}
                {stage === 'flag' && (
                  <button
                    onClick={() => (sounds.playClick(), setMessage(null), setStage('convert'))}
                    disabled={!allFlagged}
                    className="pixel-btn-green px-4 py-2 text-[12px] inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    PLAN CONVERSIONS <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {stage === 'convert' && (
                  <button
                    onClick={() => (sounds.playClick(), setMessage(null), setStage('results'))}
                    disabled={!allConverted}
                    className="pixel-btn-green px-4 py-2 text-[12px] inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    SEE RESULTS <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 5. Results + enroll */}
          {stage === 'results' && (
            <div className="space-y-3">
              <h4 className="font-pixel-heading text-[12px] text-[#365314]">Your conservation plan</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                <div className="pixel-card p-3 bg-[#f7fee7]">
                  <p className="text-[10.5px] font-bold text-[#4d7c0f]">LOW-YIELD ACRES CONVERTED</p>
                  <p className="font-pixel-heading text-[14px] mt-1">{LOW_PLOTS.size * ACRES_PER_PLOT} acres</p>
                  <p className="text-[10.5px] mt-1">
                    🌳 {countOf('stream')} ac streambank buffer • 🌿 {countOf('border')} ac field border • 🌸 {countOf('pollinator')} ac pollinator habitat
                  </p>
                </div>
                <div className="pixel-card p-3 bg-[#f7fee7]">
                  <p className="text-[10.5px] font-bold text-[#4d7c0f]">AVERAGE YIELD ON FARMED ACRES</p>
                  <p className="font-pixel-heading text-[14px] mt-1">
                    {avgYield(null)}% → {avgYield(Array.from(LOW_PLOTS))}%
                  </p>
                  <p className="text-[10.5px] mt-1">Retiring the weakest spots raises the field average and saves seed, fuel and fertilizer.</p>
                </div>
              </div>
              <ul className="space-y-1.5 text-[11.5px]">
                <li>🦋 New wildflowers give monarchs, bees and other pollinators food and shelter, which helps nearby crops too.</li>
                <li>💧 Streambank buffers catch soil and fertilizer before they reach the creek.</li>
                <li>🌾 Field borders stop erosion and create corridors for birds and wildlife.</li>
              </ul>
              <p className="text-[10px] text-[#78716c]">Numbers in this activity are simulated estimates for learning purposes.</p>

              {restored ? (
                <div className="text-center space-y-2 pt-2">
                  <div className="inline-flex p-2.5 bg-[#ecfccb] border-2 border-[#4d7c0f]">
                    <Award className="w-7 h-7 text-[#365314]" />
                  </div>
                  <p className="font-pixel-heading text-[12px]">ENROLLED! AURA&apos;S MEADOW IS IN BLOOM</p>
                  <p className="text-[11.5px] text-[#15803d] font-bold">+450 Golden Pollen Coins & 100% grassland flourish</p>
                  <button onClick={closeQuestModal} className="pixel-btn-green px-4 py-2 text-[12px]">
                    BACK TO WORLD
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t-2 border-[#5c2c16]">
                  <button onClick={restart} className="text-[11px] underline text-[#78350f]">
                    Start over
                  </button>
                  <button onClick={enroll} className="pixel-btn-green px-5 py-2.5 text-[12.5px] font-bold inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> ENROLL IN THE PROGRAM
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
