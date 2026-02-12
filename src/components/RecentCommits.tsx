"use client";

import { motion } from "framer-motion";
import { GitCommit, ExternalLink, User, Clock } from "lucide-react";
import TimeAgo from "./TimeAgo";

type Commit = {
  sha: string;
  message: string;
  date: string;
  author: string;
  url: string;
};

type Props = {
  commits: Commit[];
  repoUrl: string | null;
};

export default function RecentCommits({ commits, repoUrl }: Props) {
  if (commits.length === 0) {
    return (
      <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GitCommit size={18} className="text-[#7bdcff]" />
          Recent Commits
        </h3>
        <p className="mt-4 text-sm text-[#8b8b8b]">No commit history available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#1c1c1c] bg-[#0a0a0a] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GitCommit size={18} className="text-[#7bdcff]" />
          Recent Commits
          <span className="px-2 py-0.5 text-xs rounded-full bg-[#7bdcff]/20 text-[#7bdcff]">
            {commits.length}
          </span>
        </h3>
        {repoUrl && (
          <a
            href={`${repoUrl}/commits`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#666] hover:text-[#7bdcff] transition flex items-center gap-1"
          >
            View all <ExternalLink size={10} />
          </a>
        )}
      </div>

      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {commits.map((commit, i) => (
          <motion.a
            key={commit.sha}
            href={commit.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#1c1c1c]/50 transition-all group"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            {/* Timeline dot */}
            <div className="flex flex-col items-center mt-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400/60" />
              {i < commits.length - 1 && (
                <div className="w-px h-8 bg-[#1c1c1c] mt-1" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-white group-hover:text-[#7bdcff] transition truncate">
                {commit.message}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#666]">
                <span className="font-mono text-[#7bdcff]/60">{commit.sha}</span>
                <span className="flex items-center gap-1">
                  <User size={10} />
                  {commit.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  <TimeAgo date={commit.date} />
                </span>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
