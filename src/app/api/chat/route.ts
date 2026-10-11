import { NextRequest, NextResponse } from 'next/server';
import { ANIMALS } from '@/data/animals';
import { AnimalId } from '@/types/game';
import { generateAnimalResponse } from '@/utils/geminiFallback';

export async function POST(req: NextRequest) {
  try {
    const { animalId, message, userApiKey, history, flourishLevel } = await req.json();

    if (!animalId || !ANIMALS[animalId as AnimalId]) {
      return NextResponse.json({ error: 'Invalid animal ID' }, { status: 400 });
    }

    const animal = ANIMALS[animalId as AnimalId];
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    // If an API key is available, call the real Gemini 1.5 Flash API!
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const systemPrompt = `You are ${animal.name}, a charismatic, scientifically accurate ${animal.species} living in the ${animal.biomeName}.
Personality & Voice: ${animal.tagline}.
Your Habitat Threat: ${animal.threat}.
Your Solution: ${animal.solution}.
Current habitat flourish level: ${flourishLevel || 50}% restored.

Guidelines:
1. Speak in character as ${animal.name}. Use subtle evocative physical actions like *twitches ears*, *surfaces gently*, *sniffs the air*.
2. Educate the player about agriculture, sustainability, and ecological solutions (including smart farming, clean energy, waste diversion, or habitat corridors).
3. If relevant to grasslands or farming, highlight how smart agriculture, precision farming, and biodiversity coexist (Field to Future / Bayer mission).
4. Keep responses punchy, engaging, and inspiring (2-4 sentences max), suited for an interactive game dialogue box.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

        const contents = [];
        if (history && Array.isArray(history)) {
          for (const item of history.slice(-4)) {
            contents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }],
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 250,
            },
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return NextResponse.json({
              reply: replyText.trim(),
              source: 'gemini-1.5-flash',
            });
          }
        } else {
          console.warn('Gemini API returned status:', geminiRes.status);
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to persona engine:', err);
      }
    }

    // High quality intelligent simulation fallback
    const simulatedReply = generateAnimalResponse(
      animalId as AnimalId,
      message,
      flourishLevel || 50
    );

    return NextResponse.json({
      reply: simulatedReply,
      source: 'persona-engine-simulation',
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
