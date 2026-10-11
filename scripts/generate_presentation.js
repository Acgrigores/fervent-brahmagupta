const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function createDeck() {
  console.log('Starting presentation generation...');
  const pptx = new pptxgen();

  // 16:9 widescreen layout (13.333 x 7.5 inches)
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'Field to Future: Bloom — Hackathon Pitch Deck';
  pptx.company = 'Field to Future / Bayer Hackathon Team';
  pptx.subject = 'Eco-Restoration RPG & Precision Smart Agriculture Platform';
  pptx.author = 'Bloom Hackathon Team';

  // Palette constants
  const C_DARK_BG = '0F172A';      // Slate 900
  const C_DARK_CARD = '1E293B';    // Slate 800
  const C_DARK_BORDER = '334155';  // Slate 700
  const C_EMERALD = '10B981';      // Emerald 500
  const C_EMERALD_DARK = '065F46'; // Emerald 800
  const C_AMBER = 'F59E0B';        // Amber 500
  const C_AMBER_DARK = '92400E';   // Amber 800
  const C_CYAN = '06B6D4';         // Cyan 500
  const C_TEXT_LIGHT = 'F8FAFC';   // Slate 50
  const C_TEXT_MUTED = '94A3B8';   // Slate 400
  const C_TEXT_DIM = '64748B';     // Slate 500
  const C_WHITE = 'FFFFFF';
  const C_CARD_LIGHT = 'F1F5F9';

  // Helper for adding standard top header on content slides
  function addSlideHeader(slide, category, title, subtitle) {
    // Header category pill
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 0.5, w: 2.2, h: 0.35,
      rectRadius: 0.15,
      fill: { color: C_EMERALD_DARK },
      line: { color: C_EMERALD, width: 1 }
    });
    slide.addText(category.toUpperCase(), {
      x: 0.8, y: 0.5, w: 2.2, h: 0.35,
      fontSize: 10, bold: true, color: C_EMERALD,
      align: 'center', valign: 'middle'
    });

    // Slide title
    slide.addText(title, {
      x: 0.8, y: 0.95, w: 11.5, h: 0.65,
      fontSize: 26, bold: true, color: C_TEXT_LIGHT,
      fontFace: 'Arial'
    });

    // Subtitle
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8, y: 1.6, w: 11.5, h: 0.4,
        fontSize: 13, color: C_TEXT_MUTED,
        fontFace: 'Arial'
      });
    }
  }

  // Helper for footer
  function addSlideFooter(slide, slideNum, totalSlides = 12) {
    slide.addText('FIELD TO FUTURE: BLOOM  |  Bayer Hackathon Track: Agriculture & Sustainability', {
      x: 0.8, y: 7.0, w: 9.0, h: 0.3,
      fontSize: 9, color: C_TEXT_DIM
    });
    slide.addText(`${slideNum} / ${totalSlides}`, {
      x: 11.5, y: 7.0, w: 1.0, h: 0.3,
      fontSize: 9, color: C_TEXT_DIM, align: 'right'
    });
  }

  // ==========================================
  // SLIDE 1: TITLE / HERO SLIDE
  // ==========================================
  {
    const s1 = pptx.addSlide();
    s1.background = { color: C_DARK_BG };

    // Decorative background glow shape
    s1.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 0.8, w: 11.733, h: 5.9,
      rectRadius: 0.25,
      fill: { color: '131E35' },
      line: { color: '1E3A5F', width: 1.5 }
    });

    // Track Badge
    s1.addShape(pptx.ShapeType.roundRect, {
      x: 1.3, y: 1.3, w: 4.8, h: 0.45,
      rectRadius: 0.2,
      fill: { color: '143828' },
      line: { color: C_EMERALD, width: 1.2 }
    });
    s1.addText('🌾 BAYER TRACK: FIELD TO FUTURE (AGRICULTURE & SUSTAINABILITY)', {
      x: 1.3, y: 1.3, w: 4.8, h: 0.45,
      fontSize: 9.5, bold: true, color: C_EMERALD,
      align: 'center', valign: 'middle'
    });

    // Title & Tagline
    s1.addText('Field to Future: Bloom', {
      x: 1.3, y: 1.9, w: 10.5, h: 1.1,
      fontSize: 44, bold: true, color: C_TEXT_LIGHT,
      fontFace: 'Arial'
    });
    s1.addText('FROM ASHES TO EDEN', {
      x: 1.35, y: 2.95, w: 8.0, h: 0.45,
      fontSize: 18, bold: true, color: C_AMBER,
      fontFace: 'Arial', charSpacing: 4
    });

    s1.addText(
      'An eco-restoration RPG and smart agriculture impact platform. Travel from a charred wildfire ruin to a thriving biosphere—restoring 6 failing farm crops, mastering Bayer precision agriculture, and turning in-game actions into real-world conservation funding.',
      {
        x: 1.3, y: 3.55, w: 10.5, h: 1.1,
        fontSize: 14, color: C_TEXT_MUTED, lineSpacing: 22
      }
    );

    // Three quick highlight badges
    const highlights = [
      { label: '🎮 Phaser 3 & WebGL Shaders', desc: 'Real-time Ash to Eden visual bloom' },
      { label: '🌱 Bayer Precision Ag Sim', desc: '100% Yield + 100% Biodiversity balance' },
      { label: '🤖 Gemini 1.5 Flash AI Agents', desc: 'Streaming animal personas & conservation facts' },
      { label: '💰 Real-World Impact Treasury', desc: 'Sponsored grants funded by in-game progress' }
    ];

    highlights.forEach((h, i) => {
      const bx = 1.3 + (i * 2.65);
      s1.addShape(pptx.ShapeType.roundRect, {
        x: bx, y: 4.85, w: 2.5, h: 1.35,
        rectRadius: 0.15,
        fill: { color: C_DARK_CARD },
        line: { color: C_DARK_BORDER, width: 1 }
      });
      s1.addText(h.label, {
        x: bx + 0.15, y: 4.95, w: 2.2, h: 0.5,
        fontSize: 11, bold: true, color: C_TEXT_LIGHT, valign: 'middle'
      });
      s1.addText(h.desc, {
        x: bx + 0.15, y: 5.45, w: 2.2, h: 0.65,
        fontSize: 9.5, color: C_TEXT_MUTED
      });
    });

    s1.addNotes(
      "Good morning judges and organizers! We are thrilled to present 'Field to Future: Bloom'—an eco-restoration RPG and precision agriculture impact platform built for the Bayer Field to Future track.\n\n" +
      "Our core philosophy is simple: environmental recovery and agricultural productivity cannot be treated in isolation. In Bloom, players experience a dynamic visual transformation from a charred wildfire wasteland into a lush, thriving Eden by solving real ecological crises and deploying smart farming strategies that mirror Bayer's real-world innovations."
    );
  }

  // ==========================================
  // SLIDE 2: THE PLANETARY CRISIS & PROBLEM STATEMENT
  // ==========================================
  {
    const s2 = pptx.addSlide();
    s2.background = { color: C_DARK_BG };
    addSlideHeader(s2, 'The Challenge', 'The Broken Lifeline: Agriculture Under Climate Siege', 'Why traditional approaches fail to engage the public and bridge food security with ecological health');
    addSlideFooter(s2, 2);

    const problems = [
      {
        tag: 'CRISIS 01',
        title: 'Cascading Biome Collapses',
        stat: '3.2 Billion',
        statLabel: 'People affected by land degradation',
        body: 'Wildfires, agricultural runoff, microplastics, and groundwater exhaustion are not isolated. They bleed directly into farmlands, choking irrigation pumps and decimating vital pollinators.'
      },
      {
        tag: 'CRISIS 02',
        title: 'The "Yield vs. Nature" Fallacy',
        stat: '60% Decline',
        statLabel: 'In insect & monarch populations',
        body: 'A widespread misconception claims farmers must choose between high crop yields and ecological stewardship. In reality, degraded soil and lost pollinators actively threaten global food security.'
      },
      {
        tag: 'CRISIS 03',
        title: 'Passive Climate Despair',
        stat: '74%',
        statLabel: 'Of youth report eco-anxiety & helplessness',
        body: 'Current climate apps offer static statistics and guilty carbon footprint calculators. Users feel powerless, disengaged, and lack a joyful, empowering mechanism to take meaningful civic action.'
      }
    ];

    problems.forEach((p, i) => {
      const px = 0.8 + (i * 3.95);
      s2.addShape(pptx.ShapeType.roundRect, {
        x: px, y: 2.15, w: 3.75, h: 4.6,
        rectRadius: 0.15,
        fill: { color: C_DARK_CARD },
        line: { color: C_DARK_BORDER, width: 1 }
      });

      // Top Tag
      s2.addShape(pptx.ShapeType.roundRect, {
        x: px + 0.3, y: 2.4, w: 1.3, h: 0.3,
        rectRadius: 0.08,
        fill: { color: '3F1D1D' },
        line: { color: 'EF4444', width: 0.8 }
      });
      s2.addText(p.tag, {
        x: px + 0.3, y: 2.4, w: 1.3, h: 0.3,
        fontSize: 8.5, bold: true, color: 'FCA5A5', align: 'center', valign: 'middle'
      });

      s2.addText(p.title, {
        x: px + 0.3, y: 2.85, w: 3.15, h: 0.6,
        fontSize: 15, bold: true, color: C_TEXT_LIGHT
      });

      // Large Stat Callout
      s2.addText(p.stat, {
        x: px + 0.3, y: 3.55, w: 3.15, h: 0.65,
        fontSize: 28, bold: true, color: C_AMBER
      });
      s2.addText(p.statLabel, {
        x: px + 0.3, y: 4.15, w: 3.15, h: 0.45,
        fontSize: 9.5, color: C_TEXT_MUTED
      });

      // Body description
      s2.addText(p.body, {
        x: px + 0.3, y: 4.75, w: 3.15, h: 1.75,
        fontSize: 10.5, color: C_TEXT_MUTED, lineSpacing: 18
      });
    });

    s2.addNotes(
      "Slide 2 outlines the urgency. Across the world, climate disasters don't stop at forest boundaries—they strike our farms directly. Wildfire smoke blocks sunlight, fertilizer runoff creates toxic algae that clogs irrigation, and monoculture eliminates pollinator corridors.\n\n" +
      "Furthermore, there is a dangerous false dichotomy that agriculture and biodiversity must be enemies. And worst of all, younger generations feel intense climate anxiety without an interactive, empowering outlet. We set out to change this."
    );
  }

  // ==========================================
  // SLIDE 3: OUR SOLUTION — FROM ASHES TO EDEN
  // ==========================================
  {
    const s3 = pptx.addSlide();
    s3.background = { color: C_DARK_BG };
    addSlideHeader(s3, 'Core Innovation', 'The Solution: A Living Restoration RPG & Impact Loop', 'Connecting hands-on digital agency with tangible planetary restoration');
    addSlideFooter(s3, 3);

    // Left Column: The Central Farm & Ash-to-Eden Journey
    s3.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 2.15, w: 5.75, h: 4.6,
      rectRadius: 0.15,
      fill: { color: C_DARK_CARD },
      line: { color: C_DARK_BORDER, width: 1 }
    });
    s3.addText('THE GAME EXPERIENCE', {
      x: 1.1, y: 2.35, w: 5.15, h: 0.3,
      fontSize: 10, bold: true, color: C_EMERALD, charSpacing: 2
    });
    s3.addText('Dynamic Visual Transformation (0% → 100%)', {
      x: 1.1, y: 2.7, w: 5.15, h: 0.55,
      fontSize: 16, bold: true, color: C_TEXT_LIGHT
    });

    const gameSteps = [
      '1. Start at the Central Eco-Farm: 6 crops are withered and dying from surrounding environmental disasters.',
      '2. Explore 7 Interconnected Biomes: Journey through 3200x2400 terrain encountering endangered wildlife personas.',
      '3. Interactive Minigames: Solve circular recycling puzzles, quench active wildfire hotspots, divert boat shipping lanes.',
      '4. Dynamic WebGL Flourish Shader: The world physically shifts from desaturated ash & embers into vibrant 60 FPS HDR greens and blooming flora.'
    ];

    gameSteps.forEach((st, idx) => {
      s3.addText(st, {
        x: 1.1, y: 3.35 + (idx * 0.75), w: 5.15, h: 0.7,
        fontSize: 10.5, color: C_TEXT_MUTED, lineSpacing: 16
      });
    });

    // Right Column: The Real-World Loop
    s3.addShape(pptx.ShapeType.roundRect, {
      x: 6.75, y: 2.15, w: 5.75, h: 4.6,
      rectRadius: 0.15,
      fill: { color: C_DARK_CARD },
      line: { color: C_DARK_BORDER, width: 1 }
    });
    s3.addText('REAL-WORLD VALUE LOOP', {
      x: 7.05, y: 2.35, w: 5.15, h: 0.3,
      fontSize: 10, bold: true, color: C_AMBER, charSpacing: 2
    });
    s3.addText('Turning Play Time into Verified Eco-Capital', {
      x: 7.05, y: 2.7, w: 5.15, h: 0.55,
      fontSize: 16, bold: true, color: C_TEXT_LIGHT
    });

    const realSteps = [
      '• Biome Coin Economy: Earn 6 distinct biome coins (Amber Bamboo, Azure Ripple, etc.) through time and completed quests.',
      '• Sponsored Donation Matching: 500 Biome Coins = $1.00 USD matched from corporate sustainability pools (Bayer, Patagonia).',
      '• Actionable Civic Artifacts: Players sign real Change.org petitions and copy pre-drafted legislative emails for regenerative subsidies.',
      '• Authentic Eco-Ad Network: Curated sponsor ads boost player treasury while funding non-profit agricultural grants.'
    ];

    realSteps.forEach((st, idx) => {
      s3.addText(st, {
        x: 7.05, y: 3.35 + (idx * 0.75), w: 5.15, h: 0.7,
        fontSize: 10.5, color: C_TEXT_MUTED, lineSpacing: 16
      });
    });

    s3.addNotes(
      "Slide 3 introduces 'Bloom'. Instead of passive learning, players are dropped into a living ecosystem. The central farm is the hub: its golden corn, apples, winter wheat, soy, sunflowers, and barley are all withering.\n\n" +
      "The player must venture out into surrounding biomes, solve crisis minigames, and deploy sustainable practices. As they do, our custom WebGL shader strips away the grey ash and floods the screen with lush color. Most importantly, game progress translates into real-world dollars and real-world legislative letters."
    );
  }

  // ==========================================
  // SLIDE 4: BAYER SMART FARMING SIMULATOR
  // ==========================================
  {
    const s4 = pptx.addSlide();
    s4.background = { color: C_DARK_BG };
    addSlideHeader(s4, 'Track Spotlight', 'Bayer Smart Farming Simulator: Proof of Synergy', 'Interactive precision agriculture simulator harmonizing high yield with biodiversity');
    addSlideFooter(s4, 4);

    // Left Stat / Summary Box
    s4.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 2.15, w: 3.6, h: 4.6,
      rectRadius: 0.15,
      fill: { color: '142A1E' },
      line: { color: C_EMERALD, width: 1.2 }
    });
    s4.addText('THE REGENERATIVE EQUATION', {
      x: 1.05, y: 2.4, w: 3.1, h: 0.3,
      fontSize: 9.5, bold: true, color: C_EMERALD, charSpacing: 1.5
    });
    s4.addText('100% Yield + 100% Biodiversity', {
      x: 1.05, y: 2.75, w: 3.1, h: 0.7,
      fontSize: 18, bold: true, color: C_TEXT_LIGHT
    });
    s4.addText(
      'In our Regenerative Prairie quest, players configure 4 precision agricultural technologies developed by Bayer to revive Aura the Monarch Butterfly and save the farm’s golden sunflower crop.',
      {
        x: 1.05, y: 3.5, w: 3.1, h: 1.1,
        fontSize: 10.5, color: C_TEXT_MUTED, lineSpacing: 17
      }
    );

    s4.addText('+360 kg', {
      x: 1.05, y: 4.75, w: 3.1, h: 0.5,
      fontSize: 26, bold: true, color: C_AMBER
    });
    s4.addText('Carbon stored per acre via No-Till & Cover Crops', {
      x: 1.05, y: 5.25, w: 3.1, h: 0.45,
      fontSize: 9, color: C_TEXT_MUTED
    });
    s4.addText('Zero Chemical Runoff', {
      x: 1.05, y: 5.8, w: 3.1, h: 0.35,
      fontSize: 12, bold: true, color: C_EMERALD
    });
    s4.addText('Achieved via precision drip & targeted biologicals', {
      x: 1.05, y: 6.15, w: 3.1, h: 0.35,
      fontSize: 9, color: C_TEXT_MUTED
    });

    // Right Column: The 4 Tech Modules
    const modules = [
      {
        name: '1. No-Till Conservation Agriculture',
        benefit: '+10% Yield | +20% Biodiversity | 220 kg Soil Carbon',
        desc: 'Preserves delicate soil mycorrhizal fungi networks, retains ground moisture during severe droughts, and dramatically prevents topsoil erosion.'
      },
      {
        name: '2. Precision Drip Micro-Irrigation',
        benefit: '+18% Yield | +15% Biodiversity | -45% Water Waste',
        desc: 'Delivers sensor-calibrated water directly to plant root zones, eliminating evaporation loss and ending chemical nutrient runoff into nearby marshlands.'
      },
      {
        name: '3. Native Pollinator Hedgerow Corridors',
        benefit: '+35% Biodiversity | Restores Milkweed & Monarchs',
        desc: 'Intersperses native milkweed and wildflower corridors throughout crop fields, providing safe migratory pathways for butterflies and honeybees.'
      },
      {
        name: '4. Targeted Biological Crop Protection',
        benefit: '+12% Yield | +10% Biodiversity | Zero Pollinator Harm',
        desc: 'Replaces blanket prophylactic pesticides with micro-targeted biologicals and beneficial predatory insects, safeguarding crops without harming pollinators.'
      }
    ];

    modules.forEach((m, idx) => {
      const my = 2.15 + (idx * 1.15);
      s4.addShape(pptx.ShapeType.roundRect, {
        x: 4.65, y: my, w: 7.85, h: 1.05,
        rectRadius: 0.1,
        fill: { color: C_DARK_CARD },
        line: { color: C_DARK_BORDER, width: 1 }
      });
      s4.addText(m.name, {
        x: 4.85, y: my + 0.1, w: 4.6, h: 0.3,
        fontSize: 12, bold: true, color: C_TEXT_LIGHT
      });
      s4.addText(m.benefit, {
        x: 7.85, y: my + 0.1, w: 4.4, h: 0.3,
        fontSize: 9.5, bold: true, color: C_EMERALD, align: 'right'
      });
      s4.addText(m.desc, {
        x: 4.85, y: my + 0.42, w: 7.4, h: 0.55,
        fontSize: 9.5, color: C_TEXT_MUTED, lineSpacing: 15
      });
    });

    s4.addNotes(
      "Slide 4 highlights our direct integration with the Bayer Field to Future theme. In the Grasslands quest, players don't just click 'fix'. They interact with a smart farming control board balancing four pillars of modern ag.\n\n" +
      "If you only maximize yield without pollinator corridors, biodiversity crashes. If you ignore yield, food security fails. The simulation demonstrates the profound synergy of Bayer's precision ag: no-till farming, drip irrigation, biological crop protection, and pollinator corridors achieve both 100% yield and 100% biodiversity."
    );
  }

  // ==========================================
  // SLIDE 5: 7 BIOMES & ENDANGERED ANIMAL GUARDIANS
  // ==========================================
  {
    const s5 = pptx.addSlide();
    s5.background = { color: C_DARK_BG };
    addSlideHeader(s5, 'World Design', '7 Interconnected Biomes & Endangered Guardians', 'How regional habitat restoration rescues the 6 central farm crops');
    addSlideFooter(s5, 5);

    const biomes = [
      { name: 'Bamboo Cloud Forest', animal: 'Paku the Red Panda', crop: 'Apple & Berry Orchard', action: 'Social campaign & canopy wildfire petition', color: '16A34A' },
      { name: 'Crystal Marsh & Lake', animal: 'Mo the Manatee', crop: 'Golden Sweet Corn', action: '5-stream circular recycling & pump unblocking', color: '0284C7' },
      { name: 'Glacial Permafrost', animal: 'Nanuk the Polar Bear', crop: 'Glacial Winter Wheat', action: 'Change.org Arctic petition & 1.42M ton CO₂ calc', color: '06B6D4' },
      { name: 'Regenerative Prairie', animal: 'Aura the Monarch', crop: 'Golden Sunflower', action: 'Bayer Smart Farming precision ag simulation', color: 'EAB308' },
      { name: 'Sunfire Savanna', animal: 'Zuri the Cheetah', crop: 'Drought Heirloom Soy', action: 'Solar artesian wellspring & green shelterbelt', color: 'F97316' },
      { name: 'Hawksbill Barrier Reef', animal: 'Coralia the Sea Turtle', crop: 'Coastal Heritage Barley', action: 'Marine radar GPS rerouting & coral pledge', color: '0D9488' }
    ];

    biomes.forEach((b, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const bx = 0.8 + (col * 3.95);
      const by = 2.15 + (row * 2.35);

      s5.addShape(pptx.ShapeType.roundRect, {
        x: bx, y: by, w: 3.75, h: 2.15,
        rectRadius: 0.12,
        fill: { color: C_DARK_CARD },
        line: { color: b.color, width: 1.2 }
      });

      // Header Tag
      s5.addText(b.name.toUpperCase(), {
        x: bx + 0.2, y: by + 0.15, w: 3.35, h: 0.25,
        fontSize: 9, bold: true, color: b.color, charSpacing: 1
      });

      s5.addText(`Guardian: ${b.animal}`, {
        x: bx + 0.2, y: by + 0.45, w: 3.35, h: 0.35,
        fontSize: 12, bold: true, color: C_TEXT_LIGHT
      });

      s5.addText(`Linked Crop: ${b.crop}`, {
        x: bx + 0.2, y: by + 0.82, w: 3.35, h: 0.3,
        fontSize: 10, bold: true, color: C_AMBER
      });

      s5.addText(`Real Action: ${b.action}`, {
        x: bx + 0.2, y: by + 1.18, w: 3.35, h: 0.85,
        fontSize: 9.5, color: C_TEXT_MUTED, lineSpacing: 14
      });
    });

    s5.addNotes(
      "Slide 5 outlines the ecological ecosystem architecture. Every biome is tied directly to an endangered animal guardian and a specific central farm crop.\n\n" +
      "For instance, when the lake is polluted with algae and microplastics, irrigation pumps jam and sweet corn dies. Clean the lake with Mo the Manatee, and the sweet corn flourishes! Fix the cloud forest with Paku the Red Panda, and the apple orchard blossoms. This directly teaches system-level ecological thinking."
    );
  }

  // ==========================================
  // SLIDE 6: AI-POWERED ECO-AGENTS: GEMINI 1.5 FLASH
  // ==========================================
  {
    const s6 = pptx.addSlide();
    s6.background = { color: C_DARK_BG };
    addSlideHeader(s6, 'Artificial Intelligence', 'Living Personas: Google Gemini 1.5 Flash Integration', 'Empathetic, scientifically grounded conversational agents educating players in real time');
    addSlideFooter(s6, 6);

    // Left Box: Dialogue Architecture
    s6.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 2.15, w: 5.75, h: 4.6,
      rectRadius: 0.15,
      fill: { color: C_DARK_CARD },
      line: { color: C_DARK_BORDER, width: 1 }
    });
    s6.addText('GEMINI 1.5 FLASH ORCHESTRATION', {
      x: 1.1, y: 2.35, w: 5.15, h: 0.3,
      fontSize: 10, bold: true, color: C_CYAN, charSpacing: 1.5
    });
    s6.addText('Context-Aware Dynamic System Prompts', {
      x: 1.1, y: 2.7, w: 5.15, h: 0.55,
      fontSize: 15, bold: true, color: C_TEXT_LIGHT
    });

    const aiFeatures = [
      '• Live State Injection: System prompts inject current biome flourish percentage (0%-100%), active threats, and farm health.',
      '• Scientific Persona Tuning: Characters exhibit real behavioral mannerisms (*twitches ears*, *surfaces gently*) while imparting peer-reviewed agricultural science.',
      '• Dual-Tier Zero-Fail Architecture: High-speed edge route with Gemini 1.5 Flash streaming. If an API key is absent, an offline simulation engine seamlessly responds with zero latency.',
      '• Real-time Audio Synthesizer: Animal voice pitches are dynamically modulated using the Web Audio API for expressive feedback.'
    ];

    aiFeatures.forEach((f, idx) => {
      s6.addText(f, {
        x: 1.1, y: 3.35 + (idx * 0.75), w: 5.15, h: 0.7,
        fontSize: 10, color: C_TEXT_MUTED, lineSpacing: 16
      });
    });

    // Right Box: Sample Conversation Card
    s6.addShape(pptx.ShapeType.roundRect, {
      x: 6.75, y: 2.15, w: 5.75, h: 4.6,
      rectRadius: 0.15,
      fill: { color: '111E2E' },
      line: { color: C_CYAN, width: 1 }
    });
    s6.addText('LIVE INTERACTION PREVIEW', {
      x: 7.05, y: 2.35, w: 5.15, h: 0.3,
      fontSize: 10, bold: true, color: C_CYAN, charSpacing: 1.5
    });

    // Chat bubble 1 (User)
    s6.addShape(pptx.ShapeType.roundRect, {
      x: 7.05, y: 2.85, w: 5.15, h: 0.75,
      rectRadius: 0.1,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 }
    });
    s6.addText('Player: "Why are the central farm crops dying if the wildfires are miles away up in your mountain?"', {
      x: 7.2, y: 2.95, w: 4.85, h: 0.55,
      fontSize: 10, color: C_TEXT_LIGHT, italic: true
    });

    // Chat bubble 2 (Gemini Animal Persona)
    s6.addShape(pptx.ShapeType.roundRect, {
      x: 7.05, y: 3.8, w: 5.15, h: 1.7,
      rectRadius: 0.1,
      fill: { color: '0F2D3D' },
      line: { color: C_CYAN, width: 1 }
    });
    s6.addText('🦊 Paku (Red Panda) via Gemini 1.5 Flash:', {
      x: 7.2, y: 3.95, w: 4.85, h: 0.3,
      fontSize: 10.5, bold: true, color: '7DD3FC'
    });
    s6.addText('"*huffs softly, tail twitching* Mountain thermals push our smoke and hot ash straight down into the valley! The smog cuts solar radiation by 40%, stalling photosynthesis, while settling ash burns delicate blossoms and suffocates the wild bees. Protect the canopy, and you feed the farm!"', {
      x: 7.2, y: 4.3, w: 4.85, h: 1.1,
      fontSize: 9.5, color: C_TEXT_LIGHT, lineSpacing: 15
    });

    // Stat banner bottom right
    s6.addShape(pptx.ShapeType.roundRect, {
      x: 7.05, y: 5.75, w: 5.15, h: 0.75,
      rectRadius: 0.08,
      fill: { color: '163322' },
      line: { color: C_EMERALD, width: 1 }
    });
    s6.addText('⚡ Sub-300ms Time-to-First-Token | Streaming LLM Dialogues', {
      x: 7.2, y: 5.95, w: 4.85, h: 0.35,
      fontSize: 10, bold: true, color: C_EMERALD, align: 'center'
    });

    s6.addNotes(
      "Slide 6 showcases our AI architecture. We integrated Google Gemini 1.5 Flash to bring every endangered guardian to life.\n\n" +
      "Instead of static NPC dialogue trees, Gemini understands the exact real-time flourish score of the game. If you ask Paku why the farm crops are failing, he explains the atmospheric physics of wildfire smoke choking apple orchards. It turns scientific literacy into an emotional, unforgettable character connection."
    );
  }

  // ==========================================
  // SLIDE 7: FULL-STACK TECHNICAL ARCHITECTURE
  // ==========================================
  {
    const s7 = pptx.addSlide();
    s7.background = { color: C_DARK_BG };
    addSlideHeader(s7, 'Engineering', 'Robust, Scalable Technical Architecture', 'Built with Next.js 14, Phaser 3, WebGL Custom Shaders, and Web Audio API');
    addSlideFooter(s7, 7);

    const techColumns = [
      {
        title: 'Canvas & Game Engine',
        tech: 'Phaser 3 & WebGL',
        badgeColor: C_EMERALD,
        items: [
          '• 3200x2400 expansive 2D game world',
          '• 60 FPS arcade physics & collision detection',
          '• Real-time WebGL desaturation/ash filter pipeline',
          '• Dynamic particle systems (embers, pollen, snow)',
          '• Dynamic sprite layer swapping (dead → flourish)'
        ]
      },
      {
        title: 'Frontend & UI Framework',
        tech: 'Next.js 14 App Router',
        badgeColor: C_AMBER,
        items: [
          '• React 18 with Tailwind CSS styling',
          '• Pixel-art retro HUD overlays & mini-map radar',
          '• 7 interactive modal dialogue minigames',
          '• Context API persistent GameState management',
          '• Fast-Travel dock with instant biome warping'
        ]
      },
      {
        title: 'Audio & AI Intelligence',
        tech: 'Web Audio API & Gemini',
        badgeColor: C_CYAN,
        items: [
          '• Generative real-time synthesized biome soundtracks',
          '• Dynamic procedural sound effects (zero audio assets)',
          '• Gemini 1.5 Flash Next.js Edge API routes',
          '• Zero-dependency offline persona fallback engine',
          '• LocalStorage treasury & badge persistence'
        ]
      }
    ];

    techColumns.forEach((col, i) => {
      const cx = 0.8 + (i * 3.95);
      s7.addShape(pptx.ShapeType.roundRect, {
        x: cx, y: 2.15, w: 3.75, h: 4.6,
        rectRadius: 0.15,
        fill: { color: C_DARK_CARD },
        line: { color: C_DARK_BORDER, width: 1 }
      });

      s7.addText(col.title.toUpperCase(), {
        x: cx + 0.3, y: 2.4, w: 3.15, h: 0.3,
        fontSize: 9.5, bold: true, color: col.badgeColor, charSpacing: 1
      });

      s7.addText(col.tech, {
        x: cx + 0.3, y: 2.75, w: 3.15, h: 0.5,
        fontSize: 16, bold: true, color: C_TEXT_LIGHT
      });

      col.items.forEach((item, idx) => {
        s7.addText(item, {
          x: cx + 0.3, y: 3.45 + (idx * 0.65), w: 3.15, h: 0.6,
          fontSize: 10, color: C_TEXT_MUTED, lineSpacing: 15
        });
      });
    });

    s7.addNotes(
      "Slide 7 walks through our technical architecture. We married Next.js 14 with Phaser 3.\n\n" +
      "One technical challenge was delivering instant performance without massive asset downloads. We wrote custom Web Audio API synthesizers that generate ambient music procedurally in the browser for all 7 biomes! Our WebGL shader pipeline dynamically blends color saturation and brightness on the fly as the player revives each habitat."
    );
  }

  // ==========================================
  // SLIDE 8: THE IMPACT TREASURY & AD-MATCHING MODEL
  // ==========================================
  {
    const s8 = pptx.addSlide();
    s8.background = { color: C_DARK_BG };
    addSlideHeader(s8, 'Sustainable Economics', 'The Impact Treasury: Monetizing Attention for Good', 'A transparent corporate matching model transforming screen time into verified eco-grants');
    addSlideFooter(s8, 8);

    // 3 Cards: The Flow
    const flowCards = [
      {
        step: 'STEP 01',
        title: 'Time & Presence Economy',
        icon: '🪙',
        points: [
          'Players earn biome-specific coins for exploration, crisis resolution, and dialogue.',
          '6 unique coin currencies track habitat-specific stewardship.',
          'Encourages continuous educational engagement over mindless clicks.'
        ]
      },
      {
        step: 'STEP 02',
        title: 'Sponsored Grant Matching',
        icon: '🤝',
        points: [
          '500 Biome Coins = $1.00 USD matched donation.',
          'Bayer Sustainability Grant Pool matches precision ag & soil health milestones.',
          'Patagonia 1% For The Planet & The Ocean Cleanup match marine and forest milestones.'
        ]
      },
      {
        step: 'STEP 03',
        title: 'Verified Non-Profit Payouts',
        icon: '🌱',
        points: [
          'Grant capital distributed to certified environmental NGOs & regenerative farming initiatives.',
          'Transparent client-side ledger and audit trail.',
          'Players witness the physical dollar value generated by their gameplay.'
        ]
      }
    ];

    flowCards.forEach((c, i) => {
      const cx = 0.8 + (i * 3.95);
      s8.addShape(pptx.ShapeType.roundRect, {
        x: cx, y: 2.15, w: 3.75, h: 3.4,
        rectRadius: 0.15,
        fill: { color: C_DARK_CARD },
        line: { color: C_DARK_BORDER, width: 1 }
      });

      s8.addText(`${c.icon}  ${c.step}`, {
        x: cx + 0.3, y: 2.35, w: 3.15, h: 0.3,
        fontSize: 9.5, bold: true, color: C_AMBER, charSpacing: 1.5
      });

      s8.addText(c.title, {
        x: cx + 0.3, y: 2.7, w: 3.15, h: 0.5,
        fontSize: 15, bold: true, color: C_TEXT_LIGHT
      });

      c.points.forEach((pt, idx) => {
        s8.addText(`• ${pt}`, {
          x: cx + 0.3, y: 3.3 + (idx * 0.65), w: 3.15, h: 0.6,
          fontSize: 9.5, color: C_TEXT_MUTED, lineSpacing: 15
        });
      });
    });

    // Bottom Banner: Ethical Ad Model
    s8.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 5.75, w: 11.7, h: 1.0,
      rectRadius: 0.1,
      fill: { color: '1E2B37' },
      line: { color: C_CYAN, width: 1 }
    });
    s8.addText('ETHICAL AD SPONSORSHIP BANNER', {
      x: 1.1, y: 5.85, w: 3.5, h: 0.25,
      fontSize: 9, bold: true, color: C_CYAN, charSpacing: 1.5
    });
    s8.addText(
      'Our live footer banner highlights certified partners (Bayer Crop Science, Patagonia, Ocean Cleanup, Ecosia). 100% of simulated ad revenue injects capital directly into the player’s treasury, creating a self-sustaining funding flywheel.',
      {
        x: 1.1, y: 6.15, w: 11.1, h: 0.5,
        fontSize: 10, color: C_TEXT_LIGHT
      }
    );

    s8.addNotes(
      "Slide 8 addresses sustainability and monetization. How do we fund this? We created the Impact Treasury.\n\n" +
      "Instead of predatory microtransactions, Bloom runs on a 'time and presence economy'. As players explore and learn, they earn biome coins. Sustainability sponsors like Bayer Crop Science provide matching grant pools where 500 coins equal $1.00. Our bottom ad banner showcases clean, curated sustainability initiatives that reward players for their attention."
    );
  }

  // ==========================================
  // SLIDE 9: CIVIC ENGAGEMENT & REAL-WORLD ACTION
  // ==========================================
  {
    const s9 = pptx.addSlide();
    s9.background = { color: C_DARK_BG };
    addSlideHeader(s9, 'Action Beyond Screen', 'Bridging Pixels to Real-World Civic Action', 'Turning player empathy into tangible legislative, petition, and social advocacy');
    addSlideFooter(s9, 9);

    const civicActions = [
      {
        title: 'Pre-Drafted Legislative Emails',
        icon: '✉️',
        desc: 'Completing the Cloud Forest quest automatically drafts a formal email to congressional representatives advocating for funding for native forest buffers and farm wildfire defense.'
      },
      {
        title: 'Change.org Arctic Action',
        icon: '✍️',
        desc: 'In the Tundra quest, players sign an active petition reducing black soot industrial emissions, complete with a live calculator demonstrating 1.42M tons of CO₂ mitigation.'
      },
      {
        title: 'One-Click Social Impact Cards',
        icon: '📱',
        desc: 'Generates viral Instagram Stories and Twitter/X graphic summaries showing which biome they saved, empowering viral peer-to-peer mobilization.'
      },
      {
        title: 'Regenerative Farmer Subsidies',
        icon: '🌾',
        desc: 'The Bayer Prairie quest unlocks a petition urging state departments of agriculture to subsidize no-till seed drills and cover crop transitions for family farmers.'
      }
    ];

    civicActions.forEach((ca, i) => {
      const cx = 0.8 + ((i % 2) * 5.95);
      const cy = 2.15 + (Math.floor(i / 2) * 2.35);

      s9.addShape(pptx.ShapeType.roundRect, {
        x: cx, y: cy, w: 5.75, h: 2.15,
        rectRadius: 0.12,
        fill: { color: C_DARK_CARD },
        line: { color: C_DARK_BORDER, width: 1 }
      });

      s9.addText(`${ca.icon}  ${ca.title}`, {
        x: cx + 0.3, y: cy + 0.2, w: 5.15, h: 0.4,
        fontSize: 14, bold: true, color: C_TEXT_LIGHT
      });

      s9.addText(ca.desc, {
        x: cx + 0.3, y: cy + 0.7, w: 5.15, h: 1.25,
        fontSize: 10.5, color: C_TEXT_MUTED, lineSpacing: 18
      });
    });

    s9.addNotes(
      "Slide 9 demonstrates what makes Bloom truly impactful. Video games are notorious for keeping players trapped behind screens. Bloom is designed to launch players INTO real-world civic participation.\n\n" +
      "Every quest concludes with an immediate real-world action: copying a pre-written legislative email to state representatives, signing verified Arctic petitions, or sharing verified social media graphics. We don't just teach conservation—we provide the megaphone."
    );
  }

  // ==========================================
  // SLIDE 10: MARKET OPPORTUNITY & FUTURE ROADMAP
  // ==========================================
  {
    const s10 = pptx.addSlide();
    s10.background = { color: C_DARK_BG };
    addSlideHeader(s10, 'Vision & Growth', 'Market Potential & Future Evolution', 'Scaling from a hackathon prototype into a global conservation education movement');
    addSlideFooter(s10, 10);

    // Left: Market Opportunity
    s10.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 2.15, w: 5.75, h: 4.6,
      rectRadius: 0.15,
      fill: { color: C_DARK_CARD },
      line: { color: C_DARK_BORDER, width: 1 }
    });
    s10.addText('MARKET CONVERGENCE', {
      x: 1.1, y: 2.35, w: 5.15, h: 0.3,
      fontSize: 10, bold: true, color: C_EMERALD, charSpacing: 1.5
    });
    s10.addText('The "Cozy Gaming" + Climate Tech Boom', {
      x: 1.1, y: 2.7, w: 5.15, h: 0.55,
      fontSize: 15, bold: true, color: C_TEXT_LIGHT
    });

    const marketStats = [
      '• 3.2 Billion Global Gamers: Rapidly expanding appetite for uplifting, nature-positive games (Stardew Valley, Animal Crossing).',
      '• ESG Corporate Alignment: Brands like Bayer seek authentic, measurable engagement channels that educate youth on smart agriculture rather than greenwashing.',
      '• K-12 & University Education: High demand for gamified science curricula that make complex ecological dependencies visceral and fun.'
    ];

    marketStats.forEach((ms, idx) => {
      s10.addText(ms, {
        x: 1.1, y: 3.4 + (idx * 0.95), w: 5.15, h: 0.85,
        fontSize: 10.5, color: C_TEXT_MUTED, lineSpacing: 17
      });
    });

    // Right: Roadmap
    s10.addShape(pptx.ShapeType.roundRect, {
      x: 6.75, y: 2.15, w: 5.75, h: 4.6,
      rectRadius: 0.15,
      fill: { color: C_DARK_CARD },
      line: { color: C_DARK_BORDER, width: 1 }
    });
    s10.addText('DEVELOPMENT ROADMAP', {
      x: 7.05, y: 2.35, w: 5.15, h: 0.3,
      fontSize: 10, bold: true, color: C_AMBER, charSpacing: 1.5
    });
    s10.addText('From Hackathon Prototype to Global Platform', {
      x: 7.05, y: 2.7, w: 5.15, h: 0.55,
      fontSize: 15, bold: true, color: C_TEXT_LIGHT
    });

    const roadmapPhases = [
      { q: 'Q1 2027', t: 'Mobile PWA & Classroom Mode', d: 'Touch controls, offline school packs, and teacher dashboard for tracking student conservation metrics.' },
      { q: 'Q2 2027', t: 'Satellite & IoT Telemetry Sync', d: 'Connecting live Bayer FarmRise / satellite moisture data to dynamically trigger real-world in-game weather.' },
      { q: 'Q3 2027', t: 'Community Multi-Player Co-Op', d: 'Shared community farm plots where classrooms and groups collaborate to revive biomes collectively.' }
    ];

    roadmapPhases.forEach((rp, idx) => {
      const ry = 3.35 + (idx * 1.05);
      s10.addShape(pptx.ShapeType.roundRect, {
        x: 7.05, y: ry, w: 1.1, h: 0.3,
        rectRadius: 0.08,
        fill: { color: '3A2810' },
        line: { color: C_AMBER, width: 0.8 }
      });
      s10.addText(rp.q, {
        x: 7.05, y: ry, w: 1.1, h: 0.3,
        fontSize: 8.5, bold: true, color: C_AMBER, align: 'center', valign: 'middle'
      });
      s10.addText(rp.t, {
        x: 8.3, y: ry, w: 3.9, h: 0.3,
        fontSize: 11, bold: true, color: C_TEXT_LIGHT
      });
      s10.addText(rp.d, {
        x: 7.05, y: ry + 0.35, w: 5.15, h: 0.6,
        fontSize: 9.5, color: C_TEXT_MUTED, lineSpacing: 15
      });
    });

    s10.addNotes(
      "Slide 10 details our market validation and expansion roadmap. There are over 3 billion gamers globally, and cozy, nature-focused games are breaking records.\n\n" +
      "Our roadmap extends beyond the hackathon: Q1 brings a classroom education edition for STEM classes. In Q2, we plan to pipe in real-world satellite moisture telemetry from precision ag sensors, so when a real region experiences drought, the corresponding in-game biome reflects it!"
    );
  }

  // ==========================================
  // SLIDE 11: WHAT WE DELIVERED IN 48 HOURS
  // ==========================================
  {
    const s11 = pptx.addSlide();
    s11.background = { color: C_DARK_BG };
    addSlideHeader(s11, 'Execution & Rigor', 'What We Built: Complete 48-Hour Hackathon Delivery', 'A fully functional, deployable web application built from scratch');
    addSlideFooter(s11, 11);

    const deliverables = [
      {
        metric: '3,200 x 2,400',
        title: 'Canvas World Map',
        desc: '7 distinct biomes, custom tile layers, collision physics, and smooth 60 FPS viewport camera tracking.'
      },
      {
        metric: '7 Minigames',
        title: 'Crisis & Ag Simulators',
        desc: 'Including the full Bayer Smart Farming simulator, circular recycling, wildfire quenching, and reef GPS router.'
      },
      {
        metric: 'Google Gemini',
        title: 'Streaming 1.5 Flash AI',
        desc: 'Context-injected LLM edge pipeline with offline fallback architecture for guaranteed 100% demo uptime.'
      },
      {
        metric: 'WebGL Shader',
        title: 'Ash-to-Eden Pipeline',
        desc: 'Real-time color desaturation and contrast shift lerping smoothly as world flourish levels increase.'
      },
      {
        metric: 'Web Audio API',
        title: 'Zero-Asset Soundtracks',
        desc: '100% browser-synthesized ambient generative soundscapes and retro 8-bit sound effects across all biomes.'
      },
      {
        metric: '15+ Badges',
        title: 'Treasury & Persistence',
        desc: 'Complete client-side ledger tracking 6 biome coin balances, unlocked badges, and farm revival states.'
      }
    ];

    deliverables.forEach((d, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const dx = 0.8 + (col * 3.95);
      const dy = 2.15 + (row * 2.35);

      s11.addShape(pptx.ShapeType.roundRect, {
        x: dx, y: dy, w: 3.75, h: 2.15,
        rectRadius: 0.12,
        fill: { color: C_DARK_CARD },
        line: { color: C_DARK_BORDER, width: 1 }
      });

      s11.addText(d.metric, {
        x: dx + 0.2, y: dy + 0.2, w: 3.35, h: 0.45,
        fontSize: 20, bold: true, color: C_EMERALD
      });

      s11.addText(d.title, {
        x: dx + 0.2, y: dy + 0.7, w: 3.35, h: 0.3,
        fontSize: 12, bold: true, color: C_TEXT_LIGHT
      });

      s11.addText(d.desc, {
        x: dx + 0.2, y: dy + 1.05, w: 3.35, h: 0.95,
        fontSize: 9.5, color: C_TEXT_MUTED, lineSpacing: 15
      });
    });

    s11.addNotes(
      "Slide 11 highlights our execution capability. In just 48 hours, we delivered a comprehensive, end-to-end playable platform: a massive 3200x2400 canvas, 7 distinct crisis minigames, full Bayer smart farming simulation, real WebGL shaders, streaming Gemini 1.5 Flash dialogues, and procedurally synthesized ambient soundtracks.\n\n" +
      "Everything you see is live, fully interactive, and tested."
    );
  }

  // ==========================================
  // SLIDE 12: CONCLUSION, LIVE DEMO & Q&A
  // ==========================================
  {
    const s12 = pptx.addSlide();
    s12.background = { color: C_DARK_BG };

    // Big central card
    s12.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 0.8, w: 11.733, h: 5.9,
      rectRadius: 0.25,
      fill: { color: '131E35' },
      line: { color: '1E3A5F', width: 1.5 }
    });

    s12.addShape(pptx.ShapeType.roundRect, {
      x: 4.66, y: 1.2, w: 4.0, h: 0.45,
      rectRadius: 0.2,
      fill: { color: '143828' },
      line: { color: C_EMERALD, width: 1.2 }
    });
    s12.addText('FIELD TO FUTURE: BLOOM', {
      x: 4.66, y: 1.2, w: 4.0, h: 0.45,
      fontSize: 10, bold: true, color: C_EMERALD,
      align: 'center', valign: 'middle'
    });

    s12.addText('Help The World Flourish.', {
      x: 1.5, y: 1.85, w: 10.33, h: 0.9,
      fontSize: 40, bold: true, color: C_TEXT_LIGHT, align: 'center'
    });
    s12.addText('FROM ASHES TO EDEN', {
      x: 1.5, y: 2.75, w: 10.33, h: 0.45,
      fontSize: 18, bold: true, color: C_AMBER, align: 'center', charSpacing: 4
    });

    s12.addText(
      'By bridging joyful gamification, Bayer precision agriculture, and real-world civic impact, Bloom transforms passive climate despair into tangible, flourishing planetary renewal.',
      {
        x: 2.2, y: 3.35, w: 8.93, h: 0.85,
        fontSize: 13, color: C_TEXT_MUTED, align: 'center', lineSpacing: 20
      }
    );

    // Callout Box for Live Demo
    s12.addShape(pptx.ShapeType.roundRect, {
      x: 2.5, y: 4.4, w: 8.33, h: 1.8,
      rectRadius: 0.15,
      fill: { color: C_DARK_CARD },
      line: { color: C_EMERALD, width: 1.5 }
    });

    s12.addText('🚀 READY FOR LIVE DEMONSTRATION & JUDGE Q&A', {
      x: 2.7, y: 4.6, w: 7.93, h: 0.4,
      fontSize: 14, bold: true, color: C_EMERALD, align: 'center'
    });
    s12.addText('Experience the Ash-to-Eden transformation live right now on localhost:3000\nSpecial thanks to Bayer, the mentors, and the hackathon judging panel.', {
      x: 2.7, y: 5.1, w: 7.93, h: 0.8,
      fontSize: 11, color: C_TEXT_LIGHT, align: 'center', lineSpacing: 18
    });

    s12.addNotes(
      "To conclude: 'Field to Future: Bloom' proves that when you give people agency, beauty, and scientific truth, they don't just learn about sustainability—they actively create it.\n\n" +
      "We invite you to step into the clearing, meet Paku, configure Bayer's precision farm, and watch the ashes turn to Eden with us. Thank you, and we welcome your questions!"
    );
  }

  const outPath = path.join(process.cwd(), 'public', 'Field_to_Future_Bloom_Pitch_Deck.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log('Presentation generated successfully at:', outPath);

  // Also write to workspace root for quick access
  const rootPath = path.join(process.cwd(), 'Field_to_Future_Bloom_Pitch_Deck.pptx');
  fs.copyFileSync(outPath, rootPath);
  console.log('Copied presentation to workspace root:', rootPath);
}

createDeck().catch(err => {
  console.error('Error generating deck:', err);
  process.exit(1);
});
