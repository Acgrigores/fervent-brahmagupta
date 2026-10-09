# 🌾 Field to Future: Bloom (From Ashes to Eden)

> **Track:** Field to Future (Agriculture & Sustainability)  
> *Help the world flourish. Focus on environmental solutions, smart farming, food security, climate tech, or resource conservation. (Sponsored by Bayer)*

---

## 🌟 Overview & Core Concept

**Field to Future: Bloom** is an eco-restoration RPG and conservation impact platform. 

The game begins in a **charred, desaturated wildfire clearing** (smoldering embers, ash clouds, scorched earth). As the player traverses the world, speaks with endangered wildlife, solves ecological crises, and implements smart agricultural innovations, the world undergoes a **dynamic visual transformation from ash destruction into a vibrant, lush, flourishing Eden** powered by WebGL shaders and Phaser 3.

Every action in the game earns biome-specific conservation coins that translate into **real-world sponsored donations** to verified environmental and agricultural initiatives funded by eco-sponsors and Bayer's sustainability grant pool.

---

## 🎮 Game Architecture & Tech Stack

```
[ Frontend: React / Next.js 14 + Tailwind CSS ]
├── HTML5 Canvas Engine: Phaser 3 (Expansive 3200x2400 world, 7 biomes, character physics, ambient particles)
├── WebGL Shader & Filter Layer: Dynamic desaturation/ash filter (0%) → flourishing HDR greens & blooms (100%)
└── DOM Overlays: Quests Drawer, Badges Showcase, Gemini 1.5 Flash Dialogue Modal, Mini-Map Radar, Dummy Ad Banner
│
▼ [ Backend / API Route: Next.js API Routes ]
├── LLM Orchestration: Gemini 1.5 Flash (Animal personas with streaming dialogue & conservation facts)
└── Persistence / State: LocalStorage & Client-side Treasury Ledger
```

---

## 🗺️ Biomes, Animals & Real-World Actions

| Biome | Endangered Animal | Crisis & Threat | Real-World Interactive Solution |
| :--- | :--- | :--- | :--- |
| **Charred Ash Clearing** | *Pioneer Sprouts* | Wildfire ground zero, active ember flare-ups | Quench 6 ember hotspots & sow nitrogen-fixing pioneer seedlings |
| **Bamboo Canopy Forest** | **Paku the Red Panda** (`🦊`) | Deforestation, agricultural fires, lost canopies | **Social Campaign Hub:** Viral Instagram Story card + formal lawmaker petition email |
| **Crystal Marsh & Lake** | **Mo the Manatee** (`🦭`) | Plastic ingestion, fertilizer runoff, algae blooms | **Watershed Recycling Sorter:** 5-point circular waste sorting & quiz challenge |
| **Glacial Tundra** | **Nanuk the Polar Bear** (`🐻‍❄️`) | Thinning sea ice, coal plant soot emissions | **Change.org Arctic Action:** Real-time petition signer & 1.42M ton CO₂ reduction calculator |
| **Smart Farmlands & Prairie** | **Aura the Monarch Butterfly** (`🦋`) | Monoculture degradation, loss of milkweed | **Bayer Smart Farming Simulator:** Precision drip irrigation, no-till cover crops & pollinator corridors |
| **Sunfire Savanna Oasis** | **Zuri the Cheetah** (`🐆`) | Severe drought, desertification, lost prey | Solar artesian wellsprings & agroforestry green shelterbelts |
| **Hawksbill Coral Barrier** | **Coralia the Sea Turtle** (`🐢`) | Propeller strikes, boat noise, coral bleaching | **Marine Radar Diverter:** Redirect vessel GPS routes around nursery reefs + NGO coral pledge |

---

## 💰 The Impact Treasury & Ad Model

- **Biome Coins:** Each habitat awards its own unique coin (*Amber Bamboo, Azure Ripple, Frost Auric, Golden Pollen, Sunfire Dune, Coral Pearl*).
- **Time & Presence Economy:** The more time spent exploring a biome or talking with an animal, the more coins accumulate.
- **Sponsored Donation Pool:** Coins convert at a rate of 500 coins = $1.00 USD, matched by Bayer and sustainability sponsors.
- **Dummy Ad Banner:** Authentically designed eco-sponsor banner at the bottom (featuring *Bayer Crop Science, Patagonia 1% for the Planet, The Ocean Cleanup, and Ecosia*). Clicking or viewing boosts coins and injects grant capital into the global conservation fund.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v22)
- npm 9+

### Installation & Run
```bash
# Install dependencies
npm install

# Start the production build
npm run build
npm run start

# Or start the hot-reloading development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Configuring Google Gemini 1.5 Flash (Optional)
The game includes a built-in intelligent dynamic persona engine that works out of the box with zero configuration. To connect to live Google Gemini 1.5 Flash streaming:
1. Click the **Settings (⚙️)** icon in the top HUD.
2. Enter your `GEMINI_API_KEY`.
3. Save settings to activate live model streaming!

---

## 🏆 Key Features for Field to Future Judges

1. **Bayer Smart Farming Integration:** Hands-on simulator showing how precision agriculture balances crop yields for global food security while safeguarding biodiversity.
2. **Dynamic World Transformation:** Direct visual feedback where player choices physically clean the world from smoldering wildfire ruins to flourishing green ecosystems.
3. **Actionable Civic Engagement:** Generates real email drafts, social posts, and petitions that players can copy and use in real life.
4. **Zero-Setup AI Orchestration:** Powered by Google Gemini 1.5 Flash with full offline persona fallback.
