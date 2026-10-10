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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border-2 border-amber-900/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-stone-900">
        {/* Header - Vintage Wooden Plaque */}
        <div className="flex items-center justify-between p-5 border-b-2 border-amber-950 bg-amber-900 text-amber-50">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={animal.avatar}
                alt={animal.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-300 shadow-md bg-amber-950"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-serif text-amber-100 tracking-wide">{animal.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-950 text-amber-200 border border-amber-700">
                  {animal.species}
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium">{animal.tagline}</p>
            </div>
          </div>

          <button
            onClick={closeDialogue}
            className="p-2 text-amber-200 hover:text-white rounded-full bg-amber-950/60 hover:bg-amber-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Biome Status Strip */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-amber-50/90 border-b border-amber-200 text-xs">
          <div className="flex items-center gap-2 text-stone-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Biome: <strong className="text-stone-900 font-serif">{animal.biomeName}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-900 font-semibold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-600" /> +15 {animal.coinName} per dialogue
            </span>
            <span className="text-stone-400">•</span>
            <span className="text-stone-700 font-medium">{currentRestoration}% Flourished</span>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-stone-50/40">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-br-none'
                    : 'bg-white border border-amber-200/80 text-stone-800 rounded-bl-none shadow-sm'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-stone-500 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-stone-500 italic">
              <span className="animate-spin text-emerald-600">🌀</span>
              <span>{animal.name} is formulating an answer with Gemini AI...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="p-3 bg-amber-50/80 border-t border-amber-200">
          <div className="flex items-center gap-1.5 text-xs text-stone-700 mb-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Ask {animal.name} about conservation:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {animal.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 bg-white hover:bg-amber-100/70 text-stone-800 rounded-xl border border-amber-200 transition-all text-left disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Biome Quest Shortcut */}
        {biomeQuest && !biomeQuest.completed && (
          <div className="px-5 py-2.5 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>
                Ready to take action? <strong>{biomeQuest.title}</strong>
              </span>
            </div>
            <button
              onClick={() => {
                closeDialogue();
                openQuestModal(biomeQuest.actionType);
              }}
              className="flex items-center gap-1 text-xs px-3 py-1 bg-amber-900 hover:bg-amber-800 text-amber-50 border border-amber-950 rounded-lg font-serif font-bold transition-all shadow-sm"
            >
              <span>Start Quest</span>
              <ArrowRight className="w-3 h-3 text-amber-300" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-amber-200 bg-white flex items-center gap-2">
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
            className="flex-1 bg-amber-50/50 border border-stone-300 rounded-2xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-stone-200 text-white disabled:text-stone-400 rounded-2xl transition-all shadow-md active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
