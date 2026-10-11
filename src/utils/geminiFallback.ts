import { AnimalId } from '@/types/game';
import { ANIMALS } from '@/data/animals';

export function generateAnimalResponse(
  animalId: AnimalId,
  userMessage: string,
  _flourishLevel?: number
): string {
  const animal = ANIMALS[animalId];
  const lower = userMessage.toLowerCase();

  // Biome-specific tailored intelligence
  if (animalId === 'red_panda') {
    if (lower.includes('fire') || lower.includes('smoke') || lower.includes('burn')) {
      return `*fidgets anxiously with a bamboo twig* Fire moves with terrifying speed through dry bamboo. When humans light agricultural slash-and-burn fires or leave campfires unchecked during droughts, the drafts funnel flames straight up our mountain ridges! Early-warning drone sensors and community fire lines save thousands of us.`;
    }
    if (lower.includes('bamboo') || lower.includes('food') || lower.includes('eat')) {
      return `Bamboo is our lifeblood! We eat up to 20,000 leaves a day because bamboo is low in calories. If a wildfire sweeps through, it takes bamboo roots up to 3 years to re-sprout. That means starving or having to cross dangerous roads where vehicles and predators wait.`;
    }
    if (lower.includes('help') || lower.includes('do') || lower.includes('action')) {
      return `You can make a huge difference right now! Use our Forest Fire Prevention tool to launch a social post and send a pre-drafted letter to forestry departments. Every alert creates public pressure for wildfire rapid-response funding!`;
    }
    return `*tilts fluffy ears curious* The mountain wind carries hope when you speak. Here in the canopy, every tree protected means a home for red pandas, clouded leopards, and alpine songbirds. Keep exploring—and let us turn these ashes back into thriving green bamboo!`;
  }

  if (animalId === 'manatee') {
    if (lower.includes('plastic') || lower.includes('trash') || lower.includes('garbage')) {
      return `*slowly surfaces with a gentle sigh* Discarded plastic bags look exactly like submerged river vegetation to us. When we swallow them, they cause fatal digestive blockages. And discarded monofilament fishing line wraps around our flippers. Establishing circular recycling bins along every marina changes everything!`;
    }
    if (lower.includes('algae') || lower.includes('bloom') || lower.includes('green water')) {
      return `When excess chemical fertilizer and untreated waste wash into the lake, toxic blue-green algae blooms explode. They block sunlight, killing the lush seagrass beds we feed on. By sorting compost from runoff, you restore the water’s natural clarity!`;
    }
    if (lower.includes('boat') || lower.includes('speed') || lower.includes('propeller')) {
      return `Almost every adult manatee in Florida carries scars from motorboat propellers. We swim slowly and need to surface every few minutes to breathe. Slow-speed manatee protection zones and propeller guards save our lives every day.`;
    }
    return `*gently rolls over in the clear water* The water feels so much cooler and crisper as you clean up this marsh. With your help, calves can safely graze and the underwater seagrass meadows can grow tall again. Thank you, human friend.`;
  }

  if (animalId === 'polar_bear') {
    if (lower.includes('ice') || lower.includes('melt') || lower.includes('swim')) {
      return `*steely gaze over the horizon* Without multi-year pack ice, we must swim 50 miles between floes. Cubs often drown from exhaustion. Sea ice isn’t just frozen water; it’s our hunting platform, our highway, and our maternity den. Every fraction of a degree matters.`;
    }
    if (lower.includes('plant') || lower.includes('coal') || lower.includes('petition')) {
      return `That thermal power plant downwind spews metric tons of black soot. When dark soot lands on white snow, it absorbs solar radiation and accelerates melt by 40%! Delivering our petition to retire it replaces soot with wind and solar energy.`;
    }
    if (lower.includes('climate') || lower.includes('warm') || lower.includes('co2')) {
      return `The Arctic is warming nearly four times faster than the global average. But our destiny isn’t sealed. Transitioning industrial grids to clean renewables directly stabilizes the polar jet stream and saves the cryosphere.`;
    }
    return `*low, respectful nod* The tundra holds ancient memories. When you speak for the Arctic, you speak for the entire planet’s climate balance. Let us gather more petition signatures and keep the ice solid beneath our paws.`;
  }

  if (animalId === 'butterfly') {
    if (lower.includes('bayer') || lower.includes('smart farm') || lower.includes('agriculture') || lower.includes('farm')) {
      return `*flutters with excitement* That's the heart of the Field to Future mission! Bayer Smart Farming connects satellite imaging, precision micro-drip irrigation, and targeted biological pest control. Farmers get bountiful harvests to feed the growing world, while preserving native wildflower buffers and milkweed where our caterpillars thrive!`;
    }
    if (lower.includes('milkweed') || lower.includes('caterpillar') || lower.includes('plant')) {
      return `Milkweed is the ONLY plant monarch caterpillars can eat! Without milkweed, our multi-generational migration stops dead in its tracks. Regenerative agriculture leaves field margins open for native milkweed hedgerows!`;
    }
    if (lower.includes('soil') || lower.includes('regenerative') || lower.includes('food')) {
      return `Healthy living soil with no-till practices traps carbon underground and holds water like a sponge during droughts. When soil flourishes, plants are resilient, crops are abundant, and pollinators like us can feed millions!`;
    }
    return `*gracefully hovers near your shoulder* With precision agriculture and pollinator sanctuaries living side by side, we prove that human agriculture and wild biodiversity are partners, not rivals! Let’s cultivate this prairie together!`;
  }

  if (animalId === 'cheetah') {
    if (lower.includes('drought') || lower.includes('water') || lower.includes('well')) {
      return `*stretches lithe limbs* When waterholes dry into cracked clay, antelopes migrate away and rural herders suffer. A solar-powered artesian well draws sustainable groundwater into shallow basins, creating a resilient green haven for livestock and wildlife alike!`;
    }
    if (lower.includes('speed') || lower.includes('fast') || lower.includes('hunt')) {
      return `We can burst to 70 mph in three seconds! But sprinting generates immense body heat—over 105°F! If there is no shade or water to cool down afterwards, the hunt can be fatal. Preserving acacia woodland protects our hunting grounds.`;
    }
    if (lower.includes('desert') || lower.includes('green') || lower.includes('tree')) {
      return `Agroforestry—planting drought-hardy acacia and moringa trees in shelterbelts—slows the encroaching sand dunes and retains topsoil moisture. We can turn this dry basin into a thriving savanna!`;
    }
    return `*purrs deeply* Your quick thinking matches a cheetah’s sprint! Step by step, our solar wells and green corridors will ensure the savanna remains wild and prosperous.`;
  }

  if (animalId === 'sea_turtle') {
    if (lower.includes('boat') || lower.includes('ship') || lower.includes('route')) {
      return `*glides serenely over the reef* Cargo ships and speedboats generate acoustic confusion and deadly propeller strikes across shallow breeding bays. By rerouting vessel GPS corridors into deep offshore trenches, collisions drop to virtually zero!`;
    }
    if (lower.includes('coral') || lower.includes('bleach') || lower.includes('nursery')) {
      return `When sea temperatures spike, corals expel the colorful microalgae that feed them and turn bone white. But marine biologists are breeding heat-resilient micro-fragment corals in nurseries! Re-attaching them helps reefs regenerate in just 3 years instead of 30!`;
    }
    if (lower.includes('ocean') || lower.includes('plastic') || lower.includes('sponge')) {
      return `We Hawksbills love eating sea sponges, which keeps corals from being overgrown. When plastic bags choke our stomach or fishing lines snip our flippers, the entire reef architecture destabilizes.`;
    }
    return `*warm oceanic gaze* The tides carry ancient wisdom. Protecting our reef protects coastlines from storm surges and provides nursery beds for a billion fish. Thank you for navigating with care.`;
  }

  if (_flourishLevel && _flourishLevel >= 100) {
    return `*${animal.name} radiates pure joy* Our home is completely flourished! Thank you for transforming this habitat into an Eden of biodiversity.`;
  }

  return `*${animal.name} watches you with bright, hopeful eyes* Every action you take here cleans our home and plants seeds of real-world change!`;
}
