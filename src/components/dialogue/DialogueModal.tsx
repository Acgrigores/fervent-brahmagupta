'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { ANIMALS } from '@/data/animals';
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
          text: data.reply || "Thank you for listening to nature's call. Every step matters!",
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
          text: "Together, we can clean up this habitat and protect our fellow creatures!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={animal.avatar}
                alt={animal.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-lg bg-zinc-900"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">{animal.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  {animal.species}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">{animal.tagline}</p>
            </div>
          </div>

          <button
            onClick={closeDialogue}
            className="p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Biome Status Strip */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-zinc-850/80 border-b border-zinc-800 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Biome: <strong className="text-white">{animal.biomeName}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> +15 {animal.coinName} per dialogue
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-300">{currentRestoration}% Flourished</span>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-zinc-800 border border-zinc-700/60 text-zinc-100 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 italic">
              <span className="animate-spin text-emerald-400">🌀</span>
              <span>{animal.name} is formulating an answer with Gemini AI...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="p-3 bg-zinc-950/70 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ask {animal.name} about conservation:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {animal.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 rounded-xl border border-zinc-700/50 transition-all text-left disabled:opacity-50 active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Biome Quest Shortcut */}
        {biomeQuest && !biomeQuest.completed && (
          <div className="px-5 py-2.5 bg-emerald-950/40 border-t border-emerald-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>
                Ready to take action? <strong>{biomeQuest.title}</strong>
              </span>
            </div>
            <button
              onClick={() => {
                closeDialogue();
                openQuestModal(biomeQuest.actionType);
              }}
              className="flex items-center gap-1 text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-all"
            >
              <span>Start Quest</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2">
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
            placeholder={`Ask ${animal.name} about ${animal.species}, climate, or habitat solutions...`}
            disabled={isLoading}
            className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white disabled:text-zinc-500 rounded-2xl transition-all shadow-lg active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
