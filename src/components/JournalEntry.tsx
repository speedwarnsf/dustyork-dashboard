import { deleteJournalEntry } from "@/app/(dashboard)/actions";
import { renderMarkdown } from "@/lib/markdown";
import type { JournalEntry as JournalEntryType } from "@/lib/types";

type JournalEntryProps = {
  entry: JournalEntryType;
  projectId: string;
};

export default function JournalEntry({ entry, projectId }: JournalEntryProps) {
  return (
    <div className="rounded-2xl border border-[#1c1c1c] bg-black p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#8b8b8b]">
        <span>{entry.entry_type}</span>
        <span>{new Date(entry.created_at).toLocaleDateString()}</span>
      </div>
      <p
        className="mt-2 text-sm"
        dangerouslySetInnerHTML={{
          __html: renderMarkdown(entry.content),
        }}
      />
      <form action={async () => deleteJournalEntry(entry.id, projectId)}>
        <button
          type="submit"
          className="mt-3 text-xs uppercase tracking-[0.3em] text-[#8b8b8b] transition hover:text-[#f4b26a]"
        >
          Delete
        </button>
      </form>
    </div>
  );
}
