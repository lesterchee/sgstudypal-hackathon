// Purpose: /live page — Sprint 168 Pre-Flight Lobby. Conditionally renders
// a persona selection UI before mounting the LiveTutorCanvas. The student
// selects an AI persona character and inputs their favorite interest, which
// are injected into the Gemini Live system prompt for personalized tutoring.
// Uses force-dynamic to ensure fresh server renders per .cursorrules §4B.

"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { LiveTutorCanvas } from "@/components/LiveTutorCanvas";

// Purpose: Persona definitions for the 2x2 selection grid.
const PERSONAS = [
  {
    id: "captain-nova",
    name: "Captain Nova",
    emoji: "🚀",
    subtitle: "Space Explorer",
    gradient: "from-blue-600 to-indigo-700",
    hoverGradient: "hover:from-blue-500 hover:to-indigo-600",
    ring: "ring-blue-400",
    bg: "bg-blue-950/40",
  },
  {
    id: "sensei-cipher",
    name: "Sensei Cipher",
    emoji: "🥷",
    subtitle: "Ninja Master",
    gradient: "from-slate-700 to-zinc-900",
    hoverGradient: "hover:from-slate-600 hover:to-zinc-800",
    ring: "ring-slate-400",
    bg: "bg-slate-950/40",
  },
  {
    id: "professor-paws",
    name: "Professor Paws",
    emoji: "🐾",
    subtitle: "Wildlife Explorer",
    gradient: "from-emerald-600 to-teal-700",
    hoverGradient: "hover:from-emerald-500 hover:to-teal-600",
    ring: "ring-emerald-400",
    bg: "bg-emerald-950/40",
  },
  {
    id: "sparkle-mage",
    name: "Sparkle Mage",
    emoji: "✨",
    subtitle: "Fantasy Wizard",
    gradient: "from-purple-600 to-fuchsia-700",
    hoverGradient: "hover:from-purple-500 hover:to-fuchsia-600",
    ring: "ring-purple-400",
    bg: "bg-purple-950/40",
  },
] as const;

export default function LivePage() {
  // Purpose: Pre-Flight Lobby state — controls whether the lobby or
  // the actual LiveTutorCanvas is rendered.
  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [interest, setInterest] = useState("");

  // Purpose: Determine if the user can proceed — must select a persona
  // and enter at least one character of interest.
  const canStart = selectedPersona !== null && interest.trim().length > 0;

  // Purpose: Once the session starts, render the LiveTutorCanvas with the
  // selected persona and interest injected as props.
  if (sessionStarted && selectedPersona) {
    const persona = PERSONAS.find((p) => p.id === selectedPersona);
    return (
      <LiveTutorCanvas
        persona={persona?.name ?? "Captain Nova"}
        interest={interest.trim()}
      />
    );
  }

  // Purpose: Pre-Flight Lobby UI — persona selection + interest input.
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 px-4">
      {/* Purpose: Branding */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          SgStudyPal
        </h1>
        <p className="mt-2 text-base text-slate-400">
          Choose your AI tutor and tell us what you love!
        </p>
      </div>

      {/* Purpose: Interest input */}
      <div className="mb-6 w-full max-w-md">
        <label
          htmlFor="interest-input"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          What is your favourite thing right now?
        </label>
        <input
          id="interest-input"
          type="text"
          placeholder="e.g., Minecraft, Dinosaurs, Ballet, Pokémon…"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-base text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
        />
      </div>

      {/* Purpose: Persona selection — 2x2 grid of massive colorful buttons */}
      <div className="mb-8 grid w-full max-w-md grid-cols-2 gap-3">
        {PERSONAS.map((persona) => {
          const isSelected = selectedPersona === persona.id;
          return (
            <button
              key={persona.id}
              onClick={() => setSelectedPersona(persona.id)}
              className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 px-4 py-6 text-center transition-all duration-200 cursor-pointer ${
                isSelected
                  ? `border-transparent bg-gradient-to-br ${persona.gradient} ring-2 ${persona.ring} shadow-lg scale-[1.03]`
                  : `border-slate-700 ${persona.bg} ${persona.hoverGradient} hover:border-slate-500 hover:shadow-md`
              }`}
            >
              <span className="text-4xl mb-2 transition-transform group-hover:scale-110">
                {persona.emoji}
              </span>
              <span className="text-base font-bold text-white">
                {persona.name}
              </span>
              <span className="text-xs text-slate-300 mt-0.5">
                {persona.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Purpose: Start Session button — only enabled when persona + interest are set */}
      <button
        disabled={!canStart}
        onClick={() => setSessionStarted(true)}
        className={`w-full max-w-md rounded-xl px-6 py-4 text-base font-bold transition-all duration-200 cursor-pointer ${
          canStart
            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:-translate-y-0.5"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
        }`}
      >
        {canStart ? "🎮 Start Session" : "Select a tutor & enter your interest"}
      </button>
    </div>
  );
}
