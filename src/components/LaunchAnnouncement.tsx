"use client";
import { Icon } from "./Icon";

import { useState } from "react";
import { useToast } from "./Toast";

type Props = {
  project: {
    id: string;
    name: string;
    description: string | null;
    live_url: string | null;
    tags: string[] | null;
  };
};

type Platform = "twitter" | "linkedin" | "producthunt";

const platformConfig: Record<
  Platform,
  { icon: string; name: string; charLimit: number }
> = {
  twitter: { icon: "𝕏", name: "X (Twitter)", charLimit: 280 },
  linkedin: { icon: "in", name: "LinkedIn", charLimit: 3000 },
  producthunt: { icon: "rocket", name: "Product Hunt", charLimit: 260 },
};

const templates: Record<Platform, (project: Props["project"]) => string> = {
  twitter: (p) => `Just launched: ${p.name}!

${p.description || "Check it out!"}

${p.live_url || ""}

${p.tags?.slice(0, 3).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ") || ""}`,

  linkedin: (p) => `🎉 Excited to announce the launch of ${p.name}!

${p.description || ""}

I've been working on this project to solve [problem] and I'm thrilled to finally share it with the world.

Key features:
• Feature 1
• Feature 2
• Feature 3

Check it out: ${p.live_url || "[link]"}

I'd love to hear your thoughts and feedback!

${p.tags?.slice(0, 5).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ") || ""}`,

  producthunt: (p) => `${p.name} – ${p.description?.slice(0, 150) || "Your tagline here"}

We built ${p.name} to [solve problem]. It's [unique value prop].

🔗 ${p.live_url || ""}`,
};

export default function LaunchAnnouncement({ project }: Props) {
  const { addToast } = useToast();
  const [platform, setPlatform] = useState<Platform>("twitter");
  const [content, setContent] = useState(templates.twitter(project));
  const [isEditing, setIsEditing] = useState(false);

  const config = platformConfig[platform];
  const charCount = content.length;
  const isOverLimit = charCount > config.charLimit;

  const handlePlatformChange = (newPlatform: Platform) => {
    setPlatform(newPlatform);
    setContent(templates[newPlatform](project));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      addToast(`Copied ${config.name} announcement!`, "success");
    } catch {
      addToast("Failed to copy", "error");
    }
  };

  const handlePost = () => {
    // Open the respective platform with pre-filled content
    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(project.live_url || "")}&title=${encodeURIComponent(project.name)}&summary=${encodeURIComponent(content)}`;
        break;
      case "producthunt":
        url = "https://www.producthunt.com/posts/new";
        break;
    }
    window.open(url, "_blank");
  };

  return (
    <div className="rounded-none border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Icon name="megaphone" size={20} />
          <h3 className="text-lg font-semibold">Launch Announcement</h3>
        </div>
      </div>

      {/* Platform Selector */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(platformConfig) as Platform[]).map((p) => (
          <button
            key={p}
            onClick={() => handlePlatformChange(p)}
            className={`px-4 py-2 rounded-none text-sm font-medium transition ${
              platform === p
                ? "bg-white text-black"
                : "bg-[#1c1c1c] text-[#8b8b8b] hover:text-white"
            }`}
          >
            <span className="mr-2">{platformConfig[p].icon}</span>
            {platformConfig[p].name}
          </button>
        ))}
      </div>

      {/* Content Editor */}
      <div className="relative">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            aria-label="Announcement content"
            className={`w-full h-48 p-4 rounded-none border bg-[#111] text-sm resize-none focus:outline-none focus:border-[#7bdcff] ${
              isOverLimit ? "border-red-500" : "border-[#1c1c1c]"
            }`}
            autoFocus
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="p-4 rounded-none border border-[#1c1c1c] bg-[#111] min-h-[192px] cursor-pointer hover:border-[#2c2c2c] transition"
          >
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>
        )}

        {/* Character count */}
        <div
          className={`absolute bottom-3 right-3 text-xs ${
            isOverLimit ? "text-red-400" : "text-[#555]"
          }`}
        >
          {charCount}/{config.charLimit}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setContent(templates[platform](project))}
          className="text-xs text-[#666] hover:text-white transition"
        >
          ↻ Reset to template
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-sm font-medium rounded-none border border-[#1c1c1c] hover:border-[#7bdcff] hover:text-[#7bdcff] transition"
          >
            Copy
          </button>
          <button
            onClick={handlePost}
            disabled={isOverLimit}
            className="px-4 py-2 text-sm font-medium rounded-none bg-[#7bdcff] text-black hover:bg-[#a5ebff] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Open {config.name}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 rounded-none bg-[#111] border border-[#1c1c1c]">
        <p className="text-xs font-medium text-[#8b8b8b] mb-2">
          <Icon name="info" size={16} /> Tips for {config.name}
        </p>
        <ul className="text-xs text-[#666] space-y-1">
          {platform === "twitter" && (
            <>
              <li>• Keep it punchy and scannable</li>
              <li>• Use 2-3 relevant hashtags max</li>
              <li>• Include a screenshot or demo GIF</li>
              <li>• Thread for more details</li>
            </>
          )}
          {platform === "linkedin" && (
            <>
              <li>• Start with a hook that grabs attention</li>
              <li>• Share your personal story/journey</li>
              <li>• Include a clear CTA</li>
              <li>• Post during business hours (9-11am)</li>
            </>
          )}
          {platform === "producthunt" && (
            <>
              <li>• Launch on Tuesday-Thursday</li>
              <li>• Prepare your hunter in advance</li>
              <li>• Have a great tagline (under 60 chars)</li>
              <li>• Engage with comments all day</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
