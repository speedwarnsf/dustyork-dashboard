"use client";

import { useState } from "react";

const resumePrompt = `You are continuing work on D's Project Command Center v2.

Context:
- Next.js app router + Supabase + GitHub integration + Microlink screenshots.
- Dark theme #000, real data only.
- Keep momentum: check project statuses, milestones, tasks, journal entries.

Goal:
Resume with a clear, actionable update for the next project session.`;

export default function ResumePanel() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(resumePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <p className="text-xs uppercase tracking-[0.4em] text-[#d2ff5a]">
        LLM Resume
      </p>
      <h3 className="mt-2 text-lg font-semibold">Pick up instantly</h3>
      <p className="mt-2 text-sm text-[#8b8b8b]">
        Launch your favorite model with context prepped. Copy and paste the
        prompt when you jump back in.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em]">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-[#1c1c1c] px-4 py-2 text-white transition hover:border-[#d2ff5a] hover:text-[#d2ff5a]"
        >
          {copied ? "Copied" : "Copy prompt"}
        </button>
        <a
          href="https://chat.openai.com/"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-[#1c1c1c] px-4 py-2 text-white transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
        >
          ChatGPT
        </a>
        <a
          href="https://claude.ai/"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-[#1c1c1c] px-4 py-2 text-white transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
        >
          Claude
        </a>
        <a
          href="https://gemini.google.com/"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-[#1c1c1c] px-4 py-2 text-white transition hover:border-[#7bdcff] hover:text-[#7bdcff]"
        >
          Gemini
        </a>
      </div>
    </div>
  );
}
