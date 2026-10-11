/**
 * =========================================================================
 * SOW GOOD: BLOOM — GOOGLE APPS SCRIPT SLIDE GENERATOR
 * Track: Sow Good (Agriculture & Sustainability) Sponsored by Bayer
 * =========================================================================
 * 
 * HOW TO USE IN GOOGLE SLIDES (ONE-CLICK AUTOMATION):
 * 1. Go to https://slides.new (creates a new blank presentation)
 * 2. In the top menu, click Extensions > Apps Script
 * 3. Delete any code in the editor, and paste this entire script
 * 4. Ensure "createBloomHackathonPresentation" is selected, then click "Run"
 * 5. Review permissions (click Advanced > Proceed if prompted)
 * 6. That's it! A gorgeous, complete 12-slide hackathon deck with speaker notes
 *    will be created directly in your Google Drive and the URL printed in the log!
 * =========================================================================
 */

function createBloomHackathonPresentation() {
  const TITLE = "Sow Good: Bloom — Hackathon Pitch Deck";
  const deck = SlidesApp.create(TITLE);
  const slides = deck.getSlides();
  // Remove default blank slide
  if (slides.length > 0) {
    slides[0].remove();
  }

  // Google Slides 16:9 standard dimensions in points: 720 x 405
  const W = 720;
  const H = 405;

  // Colors
  const BG_DARK = "#0F172A";
  const CARD_BG = "#1E293B";
  const CARD_BORDER = "#334155";
  const EMERALD = "#10B981";
  const EMERALD_DARK = "#065F46";
  const AMBER = "#F59E0B";
  const CYAN = "#06B6D4";
  const TEXT_LIGHT = "#F8FAFC";
  const TEXT_MUTED = "#94A3B8";
  const TEXT_DIM = "#64748B";

  // Helper: Header for content slides
  function addHeader(slide, category, title, subtitle) {
    // Category pill
    const pill = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 24, 130, 20);
    pill.getFill().setSolidFill(EMERALD_DARK);
    pill.getBorder().setSolidFill(EMERALD).setWeight(1);
    const pText = pill.getText();
    pText.setText(category.toUpperCase());
    pText.getTextStyle().setFontSize(8).setBold(true).setForegroundColor(EMERALD);

    // Title
    const titleBox = slide.insertTextBox(title, 40, 48, 640, 36);
    titleBox.getText().getTextStyle().setFontSize(18).setBold(true).setForegroundColor(TEXT_LIGHT);

    // Subtitle
    if (subtitle) {
      const subBox = slide.insertTextBox(subtitle, 40, 84, 640, 22);
      subBox.getText().getTextStyle().setFontSize(9.5).setForegroundColor(TEXT_MUTED);
    }

    // Footer
    const footer = slide.insertTextBox("SOW GOOD: BLOOM  |  Bayer Hackathon Track: Agriculture & Sustainability", 40, 380, 500, 18);
    footer.getText().getTextStyle().setFontSize(7).setForegroundColor(TEXT_DIM);
  }

  function setNotes(slide, notesText) {
    const notesPage = slide.getNotesPage();
    const speakerNotesShape = notesPage.getSpeakerNotesShape();
    speakerNotesShape.getText().setText(notesText);
  }

  // ----------------------------------------------------
  // SLIDE 1: HERO / TITLE SLIDE
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);

    const outerCard = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 35, 640, 335);
    outerCard.getFill().setSolidFill("#131E35");
    outerCard.getBorder().setSolidFill("#1E3A5F").setWeight(1.5);

    // Track badge
    const badge = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 65, 60, 320, 24);
    badge.getFill().setSolidFill("#143828");
    badge.getBorder().setSolidFill(EMERALD).setWeight(1);
    badge.getText().setText("🌾 BAYER TRACK: SOW GOOD (AGRICULTURE & SUSTAINABILITY)");
    badge.getText().getTextStyle().setFontSize(7.5).setBold(true).setForegroundColor(EMERALD);

    // Title
    const title = s.insertTextBox("Sow Good: Bloom", 65, 95, 590, 55);
    title.getText().getTextStyle().setFontSize(32).setBold(true).setForegroundColor(TEXT_LIGHT);

    // Tagline
    const sub = s.insertTextBox("FROM ASHES TO EDEN", 65, 150, 500, 25);
    sub.getText().getTextStyle().setFontSize(13).setBold(true).setForegroundColor(AMBER);

    // Body
    const desc = s.insertTextBox(
      "An eco-restoration RPG and precision agriculture impact platform. Travel from a charred wildfire ruin to a thriving biosphere—restoring 6 failing farm crops, mastering Bayer smart farming, and turning in-game actions into real-world conservation funding.",
      65, 180, 590, 50
    );
    desc.getText().getTextStyle().setFontSize(10).setForegroundColor(TEXT_MUTED);

    // 4 Highlight Cards
    const cards = [
      { t: "🎮 Phaser 3 Engine", d: "Real-time Ash to Eden WebGL shader bloom" },
      { t: "🌱 Bayer Smart Ag", d: "100% Yield + 100% Biodiversity balance" },
      { t: "🤖 Gemini 1.5 Flash", d: "Streaming animal personas & science facts" },
      { t: "💰 Impact Treasury", d: "Sponsored grants funded by gameplay" }
    ];

    cards.forEach((c, idx) => {
      const cx = 65 + (idx * 148);
      const card = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, cx, 245, 140, 95);
      card.getFill().setSolidFill(CARD_BG);
      card.getBorder().setSolidFill(CARD_BORDER).setWeight(1);
      
      const t = s.insertTextBox(c.t, cx + 8, 250, 124, 28);
      t.getText().getTextStyle().setFontSize(8.5).setBold(true).setForegroundColor(TEXT_LIGHT);

      const d = s.insertTextBox(c.d, cx + 8, 280, 124, 50);
      d.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_MUTED);
    });

    setNotes(s, 
      "Good morning judges and organizers! We are thrilled to present 'Sow Good: Bloom'—an eco-restoration RPG and precision agriculture impact platform built for the Bayer Sow Good track.\n\n" +
      "Our core philosophy is simple: environmental recovery and agricultural productivity cannot be treated in isolation. In Bloom, players experience a dynamic visual transformation from a charred wildfire wasteland into a lush, thriving Eden by solving real ecological crises and deploying smart farming strategies that mirror Bayer's real-world innovations."
    );
  }

  // ----------------------------------------------------
  // SLIDE 2: THE PLANETARY CRISIS
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);
    addHeader(s, "The Challenge", "The Broken Lifeline: Agriculture Under Climate Siege", "Why traditional approaches fail to engage the public and bridge food security with ecological health");

    const issues = [
      {
        tag: "CRISIS 01",
        title: "Cascading Biome Collapses",
        stat: "3.2 Billion",
        statSub: "People affected by land degradation",
        desc: "Wildfires, agricultural runoff, microplastics, and groundwater depletion bleed directly into farmlands, choking intake pumps and decimating vital pollinators."
      },
      {
        tag: "CRISIS 02",
        title: "The 'Yield vs. Nature' Fallacy",
        stat: "60% Decline",
        statSub: "In insect & monarch populations",
        desc: "A widespread misconception claims farmers must sacrifice biodiversity for high crop yields. In truth, depleted soils and pollinator loss actively threaten food security."
      },
      {
        tag: "CRISIS 03",
        title: "Passive Climate Despair",
        stat: "74%",
        statSub: "Of youth report helplessness & anxiety",
        desc: "Current climate platforms offer dry statistics and guilt-driven carbon calculators. Users feel disconnected and lack a joyful, empowering mechanism for civic action."
      }
    ];

    issues.forEach((item, idx) => {
      const cx = 40 + (idx * 218);
      const card = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, cx, 115, 206, 255);
      card.getFill().setSolidFill(CARD_BG);
      card.getBorder().setSolidFill(CARD_BORDER).setWeight(1);

      const tag = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, cx + 12, 128, 70, 18);
      tag.getFill().setSolidFill("#3F1D1D");
      tag.getBorder().setSolidFill("#EF4444").setWeight(0.8);
      tag.getText().setText(item.tag);
      tag.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor("#FCA5A5");

      const titleBox = s.insertTextBox(item.title, cx + 12, 150, 182, 36);
      titleBox.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor(TEXT_LIGHT);

      const statBox = s.insertTextBox(item.stat, cx + 12, 188, 182, 32);
      statBox.getText().getTextStyle().setFontSize(18).setBold(true).setForegroundColor(AMBER);

      const statSubBox = s.insertTextBox(item.statSub, cx + 12, 220, 182, 22);
      statSubBox.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_MUTED);

      const descBox = s.insertTextBox(item.desc, cx + 12, 245, 182, 115);
      descBox.getText().getTextStyle().setFontSize(8).setForegroundColor(TEXT_MUTED);
    });

    setNotes(s,
      "Slide 2 outlines the urgency. Across the world, climate disasters don't stop at forest boundaries—they strike our farms directly. Wildfire smoke blocks sunlight, fertilizer runoff creates toxic algae that clogs irrigation, and monoculture eliminates pollinator corridors.\n\n" +
      "Furthermore, there is a dangerous false dichotomy that agriculture and biodiversity must be enemies. And worst of all, younger generations feel intense climate anxiety without an interactive, empowering outlet. We set out to change this."
    );
  }

  // ----------------------------------------------------
  // SLIDE 3: OUR SOLUTION — FROM ASHES TO EDEN
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);
    addHeader(s, "Core Innovation", "The Solution: A Living Restoration RPG & Impact Loop", "Connecting hands-on digital agency with tangible planetary restoration");

    // Left card
    const card1 = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 115, 310, 255);
    card1.getFill().setSolidFill(CARD_BG);
    card1.getBorder().setSolidFill(CARD_BORDER).setWeight(1);

    const tag1 = s.insertTextBox("THE GAMEPLAY LOOP", 55, 125, 280, 20);
    tag1.getText().getTextStyle().setFontSize(8).setBold(true).setForegroundColor(EMERALD);

    const title1 = s.insertTextBox("Dynamic Visual Transformation (0% → 100%)", 55, 145, 280, 30);
    title1.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor(TEXT_LIGHT);

    const bullets1 = s.insertTextBox(
      "1. Central Eco-Farm Crisis: 6 crops are dying from surrounding disasters.\n\n" +
      "2. 7 Interconnected Biomes: Explore 3200x2400 terrain with animal personas.\n\n" +
      "3. Minigames & Precision Ag: Quench fires, divert ships, sort watershed recycling.\n\n" +
      "4. WebGL Flourish Shader: The world shifts in real time from desaturated ash into lush HDR green blooms.",
      55, 180, 280, 180
    );
    bullets1.getText().getTextStyle().setFontSize(8).setForegroundColor(TEXT_MUTED);

    // Right card
    const card2 = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 370, 115, 310, 255);
    card2.getFill().setSolidFill(CARD_BG);
    card2.getBorder().setSolidFill(CARD_BORDER).setWeight(1);

    const tag2 = s.insertTextBox("REAL-WORLD VALUE LOOP", 385, 125, 280, 20);
    tag2.getText().getTextStyle().setFontSize(8).setBold(true).setForegroundColor(AMBER);

    const title2 = s.insertTextBox("Turning Screen Time into Real Eco-Capital", 385, 145, 280, 30);
    title2.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor(TEXT_LIGHT);

    const bullets2 = s.insertTextBox(
      "• Biome Coin Economy: Earn 6 distinct biome currencies via active gameplay and dwell time.\n\n" +
      "• Sponsored Donation Matching: 500 Biome Coins = $1.00 USD matched by Bayer & corporate pools.\n\n" +
      "• Civic Action Artifacts: Players sign real Change.org petitions & copy pre-drafted legislative letters.\n\n" +
      "• Ethical Ad Flywheel: Curated eco-sponsor banners fund verified agricultural restoration grants.",
      385, 180, 280, 180
    );
    bullets2.getText().getTextStyle().setFontSize(8).setForegroundColor(TEXT_MUTED);

    setNotes(s,
      "Slide 3 introduces 'Bloom'. Instead of passive learning, players are dropped into a living ecosystem. The central farm is the hub: its golden corn, apples, winter wheat, soy, sunflowers, and barley are all withering.\n\n" +
      "The player must venture out into surrounding biomes, solve crisis minigames, and deploy sustainable practices. As they do, our custom WebGL shader strips away the grey ash and floods the screen with lush color. Most importantly, game progress translates into real-world dollars and real-world legislative letters."
    );
  }

  // ----------------------------------------------------
  // SLIDE 4: BAYER SMART FARMING SIMULATOR
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);
    addHeader(s, "Track Spotlight", "Bayer Smart Farming Simulator: Proof of Synergy", "Interactive precision agriculture simulator harmonizing high yield with biodiversity");

    // Left Summary Box
    const leftCard = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 115, 200, 255);
    leftCard.getFill().setSolidFill("#142A1E");
    leftCard.getBorder().setSolidFill(EMERALD).setWeight(1.2);

    const lTag = s.insertTextBox("THE REGENERATIVE FORMULA", 52, 125, 176, 20);
    lTag.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor(EMERALD);

    const lTitle = s.insertTextBox("100% Yield +\n100% Biodiversity", 52, 145, 176, 40);
    lTitle.getText().getTextStyle().setFontSize(13).setBold(true).setForegroundColor(TEXT_LIGHT);

    const lDesc = s.insertTextBox(
      "Players balance 4 Bayer precision ag technologies to revive Aura the Monarch Butterfly and save the central farm's golden sunflowers.",
      52, 190, 176, 60
    );
    lDesc.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_MUTED);

    const stat1 = s.insertTextBox("+360 kg Carbon", 52, 255, 176, 25);
    stat1.getText().getTextStyle().setFontSize(14).setBold(true).setForegroundColor(AMBER);
    const stat1sub = s.insertTextBox("Stored per acre via no-till & cover crops", 52, 280, 176, 20);
    stat1sub.getText().getTextStyle().setFontSize(7).setForegroundColor(TEXT_MUTED);

    const stat2 = s.insertTextBox("Zero Chemical Runoff", 52, 310, 176, 20);
    stat2.getText().getTextStyle().setFontSize(9).setBold(true).setForegroundColor(EMERALD);
    const stat2sub = s.insertTextBox("Via precision drip & micro biologicals", 52, 330, 176, 25);
    stat2sub.getText().getTextStyle().setFontSize(7).setForegroundColor(TEXT_MUTED);

    // Right Modules
    const modules = [
      { t: "1. No-Till Conservation Agriculture", m: "+10% Yield | +20% Bio | 220kg Carbon", d: "Preserves soil fungal networks, retains moisture during drought, and stops topsoil erosion." },
      { t: "2. Precision Drip Micro-Irrigation", m: "+18% Yield | +15% Bio | -45% Water Waste", d: "Delivers sensor-calibrated water directly to plant root zones, eliminating runoff into wetlands." },
      { t: "3. Native Pollinator Hedgerows", m: "+35% Biodiversity | Restores Monarchs", d: "Intersperses milkweed and wildflower corridors throughout fields for migratory butterflies and bees." },
      { t: "4. Targeted Biological Protection", m: "+12% Yield | +10% Bio | Safe Pollination", d: "Replaces broad pesticides with targeted beneficial insects and biologicals, safeguarding bees." }
    ];

    modules.forEach((mod, idx) => {
      const my = 115 + (idx * 64);
      const mCard = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 252, my, 428, 58);
      mCard.getFill().setSolidFill(CARD_BG);
      mCard.getBorder().setSolidFill(CARD_BORDER).setWeight(1);

      const mTitle = s.insertTextBox(mod.t, 262, my + 4, 250, 20);
      mTitle.getText().getTextStyle().setFontSize(9).setBold(true).setForegroundColor(TEXT_LIGHT);

      const mMetric = s.insertTextBox(mod.m, 460, my + 4, 210, 20);
      mMetric.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor(EMERALD);

      const mDesc = s.insertTextBox(mod.d, 262, my + 24, 408, 30);
      mDesc.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_MUTED);
    });

    setNotes(s,
      "Slide 4 highlights our direct integration with the Bayer Sow Good theme. In the Grasslands quest, players don't just click 'fix'. They interact with a smart farming control board balancing four pillars of modern ag.\n\n" +
      "If you only maximize yield without pollinator corridors, biodiversity crashes. If you ignore yield, food security fails. The simulation demonstrates the profound synergy of Bayer's precision ag: no-till farming, drip irrigation, biological crop protection, and pollinator corridors achieve both 100% yield and 100% biodiversity."
    );
  }

  // ----------------------------------------------------
  // SLIDE 5: 7 BIOMES & ENDANGERED GUARDIANS
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);
    addHeader(s, "World Design", "7 Interconnected Biomes & Endangered Guardians", "How regional habitat restoration rescues the 6 central farm crops");

    const biomes = [
      { name: "Bamboo Cloud Forest", animal: "Paku the Red Panda", crop: "Canopy Apple Orchard", action: "Social campaign & wildfire petition", col: "#16A34A" },
      { name: "Crystal Marsh & Lake", animal: "Mo the Manatee", crop: "Golden Sweet Corn", action: "5-stream circular recycling challenge", col: "#0284C7" },
      { name: "Glacial Permafrost", animal: "Nanuk the Polar Bear", crop: "Glacial Winter Wheat", action: "Arctic Change.org petition & CO2 calc", col: "#06B6D4" },
      { name: "Regenerative Prairie", animal: "Aura the Monarch", crop: "Golden Sunflower", action: "Bayer Smart Farming precision ag sim", col: "#EAB308" },
      { name: "Sunfire Savanna", animal: "Zuri the Cheetah", crop: "Drought Heirloom Soy", action: "Solar artesian wellspring & shelterbelt", col: "#F97316" },
      { name: "Hawksbill Coral Barrier", animal: "Coralia the Sea Turtle", crop: "Coastal Heritage Barley", action: "Marine radar GPS rerouting & pledge", col: "#0D9488" }
    ];

    biomes.forEach((b, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const bx = 40 + (col * 218);
      const by = 115 + (row * 126);

      const card = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, bx, by, 206, 118);
      card.getFill().setSolidFill(CARD_BG);
      card.getBorder().setSolidFill(b.col).setWeight(1.2);

      const bTag = s.insertTextBox(b.name.toUpperCase(), bx + 10, by + 6, 186, 18);
      bTag.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor(b.col);

      const bAnimal = s.insertTextBox("Guardian: " + b.animal, bx + 10, by + 24, 186, 20);
      bAnimal.getText().getTextStyle().setFontSize(9).setBold(true).setForegroundColor(TEXT_LIGHT);

      const bCrop = s.insertTextBox("Crop: " + b.crop, bx + 10, by + 46, 186, 18);
      bCrop.getText().getTextStyle().setFontSize(7.5).setBold(true).setForegroundColor(AMBER);

      const bAction = s.insertTextBox("Action: " + b.action, bx + 10, by + 66, 186, 45);
      bAction.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_MUTED);
    });

    setNotes(s,
      "Slide 5 outlines the ecological ecosystem architecture. Every biome is tied directly to an endangered animal guardian and a specific central farm crop.\n\n" +
      "For instance, when the lake is polluted with algae and microplastics, irrigation pumps jam and sweet corn dies. Clean the lake with Mo the Manatee, and the sweet corn flourishes! Fix the cloud forest with Paku the Red Panda, and the apple orchard blossoms. This directly teaches system-level ecological thinking."
    );
  }

  // ----------------------------------------------------
  // SLIDE 6: AI-POWERED ECO-AGENTS: GEMINI 1.5 FLASH
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);
    addHeader(s, "Artificial Intelligence", "Living Personas: Google Gemini 1.5 Flash Integration", "Empathetic, scientifically grounded conversational agents educating players in real time");

    // Left card
    const card1 = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 115, 310, 255);
    card1.getFill().setSolidFill(CARD_BG);
    card1.getBorder().setSolidFill(CARD_BORDER).setWeight(1);

    const tag1 = s.insertTextBox("GEMINI 1.5 FLASH PIPELINE", 55, 125, 280, 20);
    tag1.getText().getTextStyle().setFontSize(8).setBold(true).setForegroundColor(CYAN);

    const title1 = s.insertTextBox("Context-Aware Dynamic System Prompts", 55, 145, 280, 30);
    title1.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor(TEXT_LIGHT);

    const bullets1 = s.insertTextBox(
      "• Live State Injection: System prompts inject current biome flourish levels (0%-100%), farm health, and active threats.\n\n" +
      "• Scientific Persona Tuning: Characters exhibit authentic animal behavior (*twitches ears*, *surfaces*) while teaching peer-reviewed ag science.\n\n" +
      "• Dual-Tier Zero-Fail Architecture: Fast Edge route calls Gemini 1.5 Flash. If no API key is set, an offline persona simulator responds instantly.\n\n" +
      "• Audio Pitch Modulation: Synthesizes dynamic pitch ranges per species using the Web Audio API.",
      55, 180, 280, 180
    );
    bullets1.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_MUTED);

    // Right card
    const card2 = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 370, 115, 310, 255);
    card2.getFill().setSolidFill("#111E2E");
    card2.getBorder().setSolidFill(CYAN).setWeight(1);

    const tag2 = s.insertTextBox("LIVE INTERACTION SAMPLE", 385, 125, 280, 20);
    tag2.getText().getTextStyle().setFontSize(8).setBold(true).setForegroundColor(CYAN);

    // User bubble
    const b1 = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 385, 150, 280, 42);
    b1.getFill().setSolidFill(CARD_BG);
    b1.getBorder().setSolidFill(CARD_BORDER).setWeight(1);
    const b1t = s.insertTextBox("Player: 'Why are the farm crops dying if the fires are miles away in your forest?'", 390, 153, 270, 36);
    b1t.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_LIGHT);

    // Gemini response bubble
    const b2 = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 385, 200, 280, 115);
    b2.getFill().setSolidFill("#0F2D3D");
    b2.getBorder().setSolidFill(CYAN).setWeight(1);

    const b2name = s.insertTextBox("🦊 Paku (Red Panda) via Gemini 1.5 Flash:", 392, 204, 266, 18);
    b2name.getText().getTextStyle().setFontSize(8).setBold(true).setForegroundColor("#7DD3FC");

    const b2text = s.insertTextBox(
      "'*huffs softly, tail twitching* Mountain thermals push our smoke and ash straight down into the farm valley! The dense smog blocks 40% of sunlight, halting photosynthesis, while settling ash suffocates wild bees. Protect the canopy, and you feed the farm!'",
      392, 224, 266, 85
    );
    b2text.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_LIGHT);

    // Stat box
    const statBox = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 385, 325, 280, 36);
    statBox.getFill().setSolidFill("#163322");
    statBox.getBorder().setSolidFill(EMERALD).setWeight(1);
    const statText = s.insertTextBox("⚡ Sub-300ms Time-to-First-Token | Streaming LLM Dialogues", 385, 332, 280, 22);
    statText.getText().getTextStyle().setFontSize(7.5).setBold(true).setForegroundColor(EMERALD);

    setNotes(s,
      "Slide 6 showcases our AI architecture. We integrated Google Gemini 1.5 Flash to bring every endangered guardian to life.\n\n" +
      "Instead of static NPC dialogue trees, Gemini understands the exact real-time flourish score of the game. If you ask Paku why the farm crops are failing, he explains the atmospheric physics of wildfire smoke choking apple orchards. It turns scientific literacy into an emotional, unforgettable character connection."
    );
  }

  // ----------------------------------------------------
  // SLIDE 7: FULL-STACK TECHNICAL ARCHITECTURE
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);
    addHeader(s, "Engineering", "Robust, Scalable Technical Architecture", "Built with Next.js 14, Phaser 3, WebGL Custom Shaders, and Web Audio API");

    const cols = [
      {
        t: "Canvas & Game Engine",
        tech: "Phaser 3 & WebGL",
        col: EMERALD,
        items: [
          "• 3200x2400 expansive 2D world",
          "• 60 FPS physics & camera follow",
          "• WebGL ash desaturation shader",
          "• Particle emitters (embers & petals)",
          "• Dynamic layer texture swapping"
        ]
      },
      {
        t: "Frontend & HUD",
        tech: "Next.js 14 App Router",
        col: AMBER,
        items: [
          "• React 18 & Tailwind CSS UI",
          "• Pixel-art HUD & radar mini-map",
          "• 7 interactive modal minigames",
          "• Context API persistent GameState",
          "• Fast-Travel dock with instant warping"
        ]
      },
      {
        t: "Audio & AI Intelligence",
        tech: "Web Audio & Gemini",
        col: CYAN,
        items: [
          "• Real-time synthesized biome music",
          "• Zero-asset procedural SFX engine",
          "• Gemini 1.5 Flash Edge API routes",
          "• Offline persona fallback engine",
          "• LocalStorage treasury persistence"
        ]
      }
    ];

    cols.forEach((col, idx) => {
      const cx = 40 + (idx * 218);
      const card = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, cx, 115, 206, 255);
      card.getFill().setSolidFill(CARD_BG);
      card.getBorder().setSolidFill(CARD_BORDER).setWeight(1);

      const tag = s.insertTextBox(col.t.toUpperCase(), cx + 12, 125, 182, 20);
      tag.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor(col.col);

      const title = s.insertTextBox(col.tech, cx + 12, 145, 182, 25);
      title.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor(TEXT_LIGHT);

      const bulletText = col.items.join("\n\n");
      const bullets = s.insertTextBox(bulletText, cx + 12, 180, 182, 180);
      bullets.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_MUTED);
    });

    setNotes(s,
      "Slide 7 walks through our technical architecture. We married Next.js 14 with Phaser 3.\n\n" +
      "One technical challenge was delivering instant performance without massive asset downloads. We wrote custom Web Audio API synthesizers that generate ambient music procedurally in the browser for all 7 biomes! Our WebGL shader pipeline dynamically blends color saturation and brightness on the fly as the player revives each habitat."
    );
  }

  // ----------------------------------------------------
  // SLIDE 8: IMPACT TREASURY & SUSTAINABLE AD MODEL
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);
    addHeader(s, "Sustainable Economics", "The Impact Treasury: Monetizing Attention for Good", "A transparent corporate matching model transforming screen time into verified eco-grants");

    const steps = [
      {
        t: "STEP 01: Time & Presence",
        sub: "Biome Coin Economy",
        desc: "Players earn 6 biome-specific currencies through exploration and quest completion. Rewards active learning over mindless scrolling."
      },
      {
        t: "STEP 02: Corporate Matching",
        sub: "Bayer Sustainability Pool",
        desc: "500 Biome Coins = $1.00 USD matched donation. Bayer and eco-partners match precision ag and habitat restoration milestones."
      },
      {
        t: "STEP 03: Verified Grants",
        sub: "NGO & Farmer Transition",
        desc: "Capital flows to verified regenerative agriculture transition funds and conservation groups with a transparent ledger audit."
      }
    ];

    steps.forEach((st, idx) => {
      const cx = 40 + (idx * 218);
      const card = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, cx, 115, 206, 175);
      card.getFill().setSolidFill(CARD_BG);
      card.getBorder().setSolidFill(CARD_BORDER).setWeight(1);

      const tag = s.insertTextBox(st.t, cx + 12, 125, 182, 20);
      tag.getText().getTextStyle().setFontSize(7).setBold(true).setForegroundColor(AMBER);

      const title = s.insertTextBox(st.sub, cx + 12, 145, 182, 25);
      title.getText().getTextStyle().setFontSize(10.5).setBold(true).setForegroundColor(TEXT_LIGHT);

      const body = s.insertTextBox(st.desc, cx + 12, 175, 182, 105);
      body.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_MUTED);
    });

    // Bottom Ethical Ad banner
    const bCard = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 300, 640, 70);
    bCard.getFill().setSolidFill("#1E2B37");
    bCard.getBorder().setSolidFill(CYAN).setWeight(1);

    const bTag = s.insertTextBox("ETHICAL AD SPONSORSHIP BANNER", 55, 306, 300, 18);
    bTag.getText().getTextStyle().setFontSize(7.5).setBold(true).setForegroundColor(CYAN);

    const bText = s.insertTextBox(
      "Our live footer banner highlights certified partners (Bayer Crop Science, Patagonia 1% For The Planet, The Ocean Cleanup, Ecosia). 100% of simulated ad revenue injects capital directly into the player's treasury, creating a self-sustaining funding flywheel.",
      55, 324, 610, 40
    );
    bText.getText().getTextStyle().setFontSize(8).setForegroundColor(TEXT_LIGHT);

    setNotes(s,
      "Slide 8 addresses sustainability and monetization. How do we fund this? We created the Impact Treasury.\n\n" +
      "Instead of predatory microtransactions, Bloom runs on a 'time and presence economy'. As players explore and learn, they earn biome coins. Sustainability sponsors like Bayer Crop Science provide matching grant pools where 500 coins equal $1.00. Our bottom ad banner showcases clean, curated sustainability initiatives that reward players for their attention."
    );
  }

  // ----------------------------------------------------
  // SLIDE 9: CIVIC ENGAGEMENT & REAL-WORLD ACTION
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);
    addHeader(s, "Action Beyond Screen", "Bridging Pixels to Real-World Civic Action", "Turning player empathy into tangible legislative, petition, and social advocacy");

    const actions = [
      { t: "✉️ Pre-Drafted Legislative Emails", d: "Cloud Forest completion drafts a formal email to congressional representatives advocating for funding for native forest buffers and farm wildfire defense." },
      { t: "✍️ Change.org Arctic Action", d: "Tundra quest allows players to sign an active petition reducing black soot emissions, with a live calculator showing 1.42M tons of CO₂ mitigated." },
      { t: "📱 One-Click Social Impact Cards", d: "Generates viral Instagram Stories and Twitter/X graphic summaries showing which biome they revived, empowering peer-to-peer mobilization." },
      { t: "🌾 Regenerative Farmer Subsidies", d: "Prairie quest unlocks a petition urging state departments of agriculture to subsidize no-till equipment and cover crop transitions for family farmers." }
    ];

    actions.forEach((a, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const ax = 40 + (col * 330);
      const ay = 115 + (row * 126);

      const card = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, ax, ay, 310, 118);
      card.getFill().setSolidFill(CARD_BG);
      card.getBorder().setSolidFill(CARD_BORDER).setWeight(1);

      const title = s.insertTextBox(a.t, ax + 12, ay + 10, 286, 25);
      title.getText().getTextStyle().setFontSize(10).setBold(true).setForegroundColor(TEXT_LIGHT);

      const desc = s.insertTextBox(a.d, ax + 12, ay + 38, 286, 70);
      desc.getText().getTextStyle().setFontSize(8).setForegroundColor(TEXT_MUTED);
    });

    setNotes(s,
      "Slide 9 demonstrates what makes Bloom truly impactful. Video games are notorious for keeping players trapped behind screens. Bloom is designed to launch players INTO real-world civic participation.\n\n" +
      "Every quest concludes with an immediate real-world action: copying a pre-written legislative email to state representatives, signing verified Arctic petitions, or sharing verified social media graphics. We don't just teach conservation—we provide the megaphone."
    );
  }

  // ----------------------------------------------------
  // SLIDE 10: MARKET OPPORTUNITY & FUTURE ROADMAP
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);
    addHeader(s, "Vision & Growth", "Market Potential & Future Evolution", "Scaling from a hackathon prototype into a global conservation education movement");

    // Left: Market
    const leftCard = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 115, 310, 255);
    leftCard.getFill().setSolidFill(CARD_BG);
    leftCard.getBorder().setSolidFill(CARD_BORDER).setWeight(1);

    const mTag = s.insertTextBox("MARKET CONVERGENCE", 55, 125, 280, 20);
    mTag.getText().getTextStyle().setFontSize(8).setBold(true).setForegroundColor(EMERALD);

    const mTitle = s.insertTextBox("The 'Cozy Gaming' + Climate Tech Boom", 55, 145, 280, 25);
    mTitle.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor(TEXT_LIGHT);

    const mText = s.insertTextBox(
      "• 3.2 Billion Global Gamers: Rapidly expanding appetite for uplifting, nature-positive games (Stardew Valley, Animal Crossing).\n\n" +
      "• ESG Alignment: Brands like Bayer seek authentic, measurable engagement channels educating youth on precision agriculture.\n\n" +
      "• K-12 & University Education: High demand for gamified science curricula that make complex ecological interdependencies visceral.",
      55, 180, 280, 180
    );
    mText.getText().getTextStyle().setFontSize(8).setForegroundColor(TEXT_MUTED);

    // Right: Roadmap
    const rightCard = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 370, 115, 310, 255);
    rightCard.getFill().setSolidFill(CARD_BG);
    rightCard.getBorder().setSolidFill(CARD_BORDER).setWeight(1);

    const rTag = s.insertTextBox("DEVELOPMENT ROADMAP", 385, 125, 280, 20);
    rTag.getText().getTextStyle().setFontSize(8).setBold(true).setForegroundColor(AMBER);

    const rTitle = s.insertTextBox("From Prototype to Global Movement", 385, 145, 280, 25);
    rTitle.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor(TEXT_LIGHT);

    const roadmap = [
      { q: "Q1 2027", t: "Mobile PWA & Classroom Mode", d: "Touch controls, offline school packs, and teacher analytics dashboard." },
      { q: "Q2 2027", t: "Satellite & IoT Telemetry Sync", d: "Syncing Bayer FarmRise satellite moisture data directly to in-game biomes." },
      { q: "Q3 2027", t: "Community Co-Op Farms", d: "Multiplayer community farm hubs collaborating to restore regional biomes." }
    ];

    roadmap.forEach((r, idx) => {
      const ry = 180 + (idx * 60);
      const qTag = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 385, ry, 50, 16);
      qTag.getFill().setSolidFill("#3A2810");
      qTag.getBorder().setSolidFill(AMBER).setWeight(0.8);
      qTag.getText().setText(r.q);
      qTag.getText().getTextStyle().setFontSize(6.5).setBold(true).setForegroundColor(AMBER);

      const rHead = s.insertTextBox(r.t, 442, ry - 3, 225, 18);
      rHead.getText().getTextStyle().setFontSize(8.5).setBold(true).setForegroundColor(TEXT_LIGHT);

      const rDesc = s.insertTextBox(r.d, 385, ry + 18, 280, 36);
      rDesc.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_MUTED);
    });

    setNotes(s,
      "Slide 10 details our market validation and expansion roadmap. There are over 3 billion gamers globally, and cozy, nature-focused games are breaking records.\n\n" +
      "Our roadmap extends beyond the hackathon: Q1 brings a classroom education edition for STEM classes. In Q2, we plan to pipe in real-world satellite moisture telemetry from precision ag sensors, so when a real region experiences drought, the corresponding in-game biome reflects it!"
    );
  }

  // ----------------------------------------------------
  // SLIDE 11: WHAT WE DELIVERED IN 48 HOURS
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);
    addHeader(s, "Execution & Rigor", "What We Built: Complete 48-Hour Hackathon Delivery", "A fully functional, deployable web application built from scratch");

    const items = [
      { stat: "3,200 x 2,400", t: "Canvas World Map", d: "7 distinct biomes, custom tile layers, collision physics, and 60 FPS camera tracking." },
      { stat: "7 Minigames", t: "Crisis & Ag Simulators", d: "Including Bayer smart farming, circular recycling, wildfire quenching, and reef GPS router." },
      { stat: "Google Gemini", t: "Streaming 1.5 Flash AI", d: "Context-injected LLM edge pipeline with offline fallback architecture for 100% demo uptime." },
      { stat: "WebGL Shader", t: "Ash-to-Eden Pipeline", d: "Real-time color desaturation and contrast shift lerping smoothly as world flourish rises." },
      { stat: "Web Audio API", t: "Zero-Asset Soundtracks", d: "100% browser-synthesized ambient music and retro 8-bit sound effects across all biomes." },
      { stat: "15+ Badges", t: "Treasury & Persistence", d: "Complete client-side ledger tracking 6 biome coin balances, badges, and farm revival states." }
    ];

    items.forEach((item, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const ix = 40 + (col * 218);
      const iy = 115 + (row * 126);

      const card = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, ix, iy, 206, 118);
      card.getFill().setSolidFill(CARD_BG);
      card.getBorder().setSolidFill(CARD_BORDER).setWeight(1);

      const statBox = s.insertTextBox(item.stat, ix + 10, iy + 6, 186, 26);
      statBox.getText().getTextStyle().setFontSize(13).setBold(true).setForegroundColor(EMERALD);

      const titleBox = s.insertTextBox(item.t, ix + 10, iy + 32, 186, 18);
      titleBox.getText().getTextStyle().setFontSize(8.5).setBold(true).setForegroundColor(TEXT_LIGHT);

      const descBox = s.insertTextBox(item.d, ix + 10, iy + 52, 186, 60);
      descBox.getText().getTextStyle().setFontSize(7.5).setForegroundColor(TEXT_MUTED);
    });

    setNotes(s,
      "Slide 11 highlights our execution capability. In just 48 hours, we delivered a comprehensive, end-to-end playable platform: a massive 3200x2400 canvas, 7 distinct crisis minigames, full Bayer smart farming simulation, real WebGL shaders, streaming Gemini 1.5 Flash dialogues, and procedurally synthesized ambient soundtracks.\n\n" +
      "Everything you see is live, fully interactive, and tested."
    );
  }

  // ----------------------------------------------------
  // SLIDE 12: CONCLUSION, LIVE DEMO & Q&A
  // ----------------------------------------------------
  {
    const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    s.getBackground().setSolidFill(BG_DARK);

    const outerCard = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 35, 640, 335);
    outerCard.getFill().setSolidFill("#131E35");
    outerCard.getBorder().setSolidFill("#1E3A5F").setWeight(1.5);

    const badge = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 270, 55, 180, 22);
    badge.getFill().setSolidFill("#143828");
    badge.getBorder().setSolidFill(EMERALD).setWeight(1);
    badge.getText().setText("SOW GOOD: BLOOM");
    badge.getText().getTextStyle().setFontSize(7.5).setBold(true).setForegroundColor(EMERALD);

    const title = s.insertTextBox("Help The World Flourish.", 65, 88, 590, 48);
    title.getText().getTextStyle().setFontSize(28).setBold(true).setForegroundColor(TEXT_LIGHT);

    const sub = s.insertTextBox("FROM ASHES TO EDEN", 65, 136, 590, 25);
    sub.getText().getTextStyle().setFontSize(13).setBold(true).setForegroundColor(AMBER);

    const desc = s.insertTextBox(
      "By bridging joyful gamification, Bayer precision agriculture, and real-world civic impact, Bloom transforms passive climate despair into tangible, flourishing planetary renewal.",
      100, 165, 520, 45
    );
    desc.getText().getTextStyle().setFontSize(9.5).setForegroundColor(TEXT_MUTED);

    const demoCard = s.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 120, 220, 480, 115);
    demoCard.getFill().setSolidFill(CARD_BG);
    demoCard.getBorder().setSolidFill(EMERALD).setWeight(1.5);

    const demoTitle = s.insertTextBox("🚀 READY FOR LIVE DEMONSTRATION & JUDGE Q&A", 140, 235, 440, 25);
    demoTitle.getText().getTextStyle().setFontSize(11).setBold(true).setForegroundColor(EMERALD);

    const demoSub = s.insertTextBox(
      "Experience the Ash-to-Eden transformation live right now on localhost:3000\nSpecial thanks to Bayer, the mentors, and the hackathon judging panel.",
      140, 268, 440, 50
    );
    demoSub.getText().getTextStyle().setFontSize(8.5).setForegroundColor(TEXT_LIGHT);

    setNotes(s,
      "To conclude: 'Sow Good: Bloom' proves that when you give people agency, beauty, and scientific truth, they don't just learn about sustainability—they actively create it.\n\n" +
      "We invite you to step into the clearing, meet Paku, configure Bayer's precision farm, and watch the ashes turn to Eden with us. Thank you, and we welcome your questions!"
    );
  }

  Logger.log("✅ Successfully created Google Slides presentation: " + deck.getUrl());
  return deck.getUrl();
}
