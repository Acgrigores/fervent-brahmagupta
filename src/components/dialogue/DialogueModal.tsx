'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { ANIMALS } from '@/data/animals';
import MoSortingGame from '@/components/minigames/MoSortingGame';
import AuraFlappyGame from '@/components/minigames/AuraFlappyGame';
import ZuriRunGame from '@/components/minigames/ZuriRunGame';
import NanukKnockoutGame from '@/components/minigames/NanukKnockoutGame';
import { sounds } from '@/utils/soundEffects';
import { X, Send, Sparkles, Coins, ArrowRight, ShieldCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'animal' | 'user';
  text: string;
  timestamp: string;
}

export default function DialogueModal() {
  const {
    activeDialogueAnimal,
    closeDialogue,
    addCoins,
    restoration,
    openQuestModal,
    quests,
    settings,
  } = useGameState();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const animal = activeDialogueAnimal ? ANIMALS[activeDialogueAnimal] : null;

  // Initialize dialogue with initial greeting
  useEffect(() => {
    if (animal) {
      sounds.playAnimalChirp(animal.voicePitch);
      setMessages([
        {
          id: 'init_msg',
          sender: 'animal',
          text: animal.initialGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [animal]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!animal) return null;

  const currentRestoration = restoration[animal.biome] || 0;
  const biomeQuest = quests.find((q) => q.biome === animal.biome);

  // Some animals play a mini-game instead of chatting (locked until their biome is restored)
  const MINI_GAMES: Partial<Record<typeof animal.id, typeof MoSortingGame>> = {
    manatee: MoSortingGame,
    butterfly: AuraFlappyGame,
    cheetah: ZuriRunGame,
    polar_bear: NanukKnockoutGame,
  };
  const MiniGame = MINI_GAMES[animal.id];
  if (MiniGame) {
    return (
      <MiniGame
        animal={animal}
        isHappy={currentRestoration >= 80}
        quest={biomeQuest}
        onClose={closeDialogue}
        onStartQuest={() => {
          closeDialogue();
          if (biomeQuest) openQuestModal(biomeQuest.actionType);
        }}
      />
    );
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    sounds.playClick();
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Award bonus dialogue coins
    addCoins(animal.biome, 15);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalId: animal.id,
          message: text.trim(),
          userApiKey: settings.geminiApiKey,
          history: messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          flourishLevel: currentRestoration,
        }),
      });

      const data = await res.json();
      sounds.playAnimalChirp(animal.voicePitch);

      setMessages((prev) => [
        ...prev,
        {
          id: `animal_${Date.now()}`,
          sender: 'animal',
          text: data.reply || data.error || 'Thank you for caring for our habitat!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      console.error('Chat error:', e);
      setMessages((prev) => [
        ...prev,
        {
          id: `animal_${Date.now()}`,
          sender: 'animal',
          text: 'Together, we can clean up this habitat and protect our fellow creatures!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-pixel">
      <div className="relative w-full max-w-2xl pixel-panel overflow-hidden flex flex-col max-h-[85vh] text-[#2e1005] shadow-2xl">
        {/* Header - Pixel Farm Wood Banner */}
        <div className="flex items-center justify-between p-3.5 border-b-4 border-[#2e1005] bg-[#5c2c16] text-[#fffbeb]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-2 border-[#fde68a] bg-[#2e1005] overflow-hidden flex-shrink-0">
              <img
                src={currentRestoration >= 80 ? animal.avatar : animal.avatar.replace('.png', '_sad.png')}
                alt={animal.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-pixel-heading text-[#fde68a] tracking-wider">{animal.name.toUpperCase()}</h3>
                <span className="text-[8px] px-1.5 py-0.2 bg-[#78350f] text-[#fde68a] border border-[#fde68a]">
                  {animal.species}
                </span>
              </div>
              <p className="text-[8.5px] text-[#fde68a]/80 mt-0.5">{animal.tagline}</p>
            </div>
          </div>

          <button
            onClick={closeDialogue}
            className="p-1 pixel-btn-red text-[9px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Biome Status Strip */}
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#fefce8] border-b-2 border-[#5c2c16] text-[8.5px]">
          <div className="flex items-center gap-1.5 text-[#5c2c16]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803d]" />
            <span>BIOME: <strong className="text-[#2e1005]">{animal.biomeName.toUpperCase()}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#b45309] font-bold flex items-center gap-1">
              <Coins className="w-3 h-3 text-[#b45309]" /> +15 {animal.coinName.toUpperCase()}
            </span>
            <span className="text-[#2e1005] font-bold">• {currentRestoration}% FLOURISHED</span>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fcf6e8]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] p-3 text-[10px] leading-relaxed ${
                  m.sender === 'user'
                    ? 'pixel-card-dark text-[#fffbeb]'
                    : 'pixel-card text-[#2e1005]'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[8px] text-[#78350f] mt-0.5 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-[9px] text-[#78350f] italic">
              <span className="animate-spin text-[#15803d]">🌀</span>
              <span>{animal.name} is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="p-2.5 bg-[#fefce8] border-t-2 border-[#5c2c16]">
          <div className="flex items-center gap-1 text-[8.5px] text-[#5c2c16] mb-1.5 font-bold">
            <Sparkles className="w-3 h-3 text-[#b45309]" />
            <span>ASK {animal.name.toUpperCase()}:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {animal.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="pixel-btn text-[8px] px-2 py-1 text-left disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Biome Quest Shortcut */}
        {biomeQuest && !biomeQuest.completed && (
          <div className="px-3 py-1.5 bg-[#f0fdf4] border-t-2 border-[#5c2c16] flex items-center justify-between text-[8.5px]">
            <div className="flex items-center gap-1.5 text-[#15803d] font-bold">
              <Sparkles className="w-3 h-3 text-[#16a34a]" />
              <span>ACTION PLAN: {biomeQuest.title}</span>
            </div>
            <button
              onClick={() => {
                closeDialogue();
                openQuestModal(biomeQuest.actionType);
              }}
              className="pixel-btn-green px-2.5 py-1 text-[8px] font-bold flex items-center gap-1"
            >
              <span>START QUEST</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 border-t-2 border-[#5c2c16] bg-[#fcf6e8] flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask ${animal.name} about conservation, farming, or biomes...`}
            disabled={isLoading}
            className="flex-1 bg-[#fffbf2] border-2 border-[#5c2c16] px-3 py-2 text-[10px] text-[#2e1005] placeholder-[#a88a6d] focus:outline-none focus:border-[#b45309]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            className="pixel-btn-green p-2 disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
