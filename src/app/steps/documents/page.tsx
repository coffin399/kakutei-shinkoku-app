"use client";

import Link from "next/link";
import { usePersistentState } from "@/hooks/usePersistentState";

const STORAGE_KEY = "step-documents";

type DocumentItem = {
  id: string;
  label: string;
  status: "pending" | "uploaded" | "verified";
  notes: string;
};

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

const defaultDocuments: DocumentItem[] = [
  { id: "withholding", label: "源泉徴収票", status: "pending", notes: "" },
  { id: "medical", label: "医療費領収書", status: "pending", notes: "" },
  { id: "donation", label: "寄附金受領証明書", status: "pending", notes: "" },
  { id: "insurance", label: "保険料控除証明書", status: "pending", notes: "" },
];

const defaultChecklist: ChecklistItem[] = [
  { id: "scan", label: "書類をスキャンまたは写真で保存", done: false },
  { id: "verify", label: "内容を確認し不足がないかチェック", done: false },
  { id: "export", label: "PDF と XML を出力センターで確認", done: false },
];

export default function DocumentsPage() {
  const [documents, setDocuments, hydrated] = usePersistentState<DocumentItem[]>(
    STORAGE_KEY,
    defaultDocuments
  );
  const [checklist, setChecklist] = usePersistentState<ChecklistItem[]>(
    `${STORAGE_KEY}-checklist`,
    defaultChecklist
  );

  const updateDocument = (id: string, partial: Partial<DocumentItem>) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, ...partial } : doc)));
  };

  const updateChecklist = (id: string, done: boolean) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done } : item)));
  };

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16 sm:px-10">
          <p className="text-sm text-white/60">データを読み込み中です...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-4">
          <Link href="/" className="text-xs uppercase tracking-[0.35em] text-rose-300/70">
            Step 5 / Documents
          </Link>
          <h1 className="text-4xl font-semibold text-white">添付書類を整理</h1>
          <p className="text-sm text-slate-200/80">
            確定申告で提出が必要な書類のステータスを管理します。アップロード先を決めている場合は備考欄に残してください。
          </p>
        </header>

        <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">書類リスト</h2>
          <div className="grid gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{doc.label}</p>
                    <p className="text-xs text-white/60">ステータスを設定すると次回訪問時も保存されます。</p>
                  </div>
                  <select
                    value={doc.status}
                    onChange={(event) => updateDocument(doc.id, { status: event.target.value as DocumentItem["status"] })}
                    className="rounded-full border border-white/20 bg-slate-950/70 px-4 py-2 text-xs text-white focus:border-rose-300 focus:outline-none"
                  >
                    <option value="pending">未着手</option>
                    <option value="uploaded">アップロード済み</option>
                    <option value="verified">確認済み</option>
                  </select>
                </div>
                <textarea
                  value={doc.notes}
                  onChange={(event) => updateDocument(doc.id, { notes: event.target.value })}
                  rows={3}
                  placeholder="保管場所や共有先などのメモ"
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-xs text-white focus:border-rose-300 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">提出準備チェックリスト</h2>
          <div className="space-y-3">
            {checklist.map((item) => (
              <label key={item.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(event) => updateChecklist(item.id, event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-slate-950 text-rose-300 focus:ring-rose-400"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 text-sm text-white/70">
          <Link
            href="/steps/tax"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
          >
            ← 前のステップ
          </Link>
          <div className="space-y-1 text-right">
            <p>書類のステータスとチェックリストはローカルに保存されます。</p>
            <p className="text-xs text-white/50">提出前には `/outputs` で PDF・XML をダウンロードしましょう。</p>
          </div>
          <Link
            href="/outputs"
            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-400"
          >
            出力センターへ →
          </Link>
        </footer>
      </div>
    </main>
  );
}
