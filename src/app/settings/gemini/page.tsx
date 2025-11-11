"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "kakutei.gemini.config.v1";
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/";

type GeminiSettings = {
  baseUrl: string;
  apiKeys: string[];
};

type EditableKey = {
  id: string;
  value: string;
};

function createEditableKey(value = ""): EditableKey {
  return { id: crypto.randomUUID(), value };
}

export default function GeminiSettingsPage() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [apiKeys, setApiKeys] = useState<EditableKey[]>([createEditableKey()]);
  const [status, setStatus] = useState<null | { type: "success" | "error"; message: string }>(
    null
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as GeminiSettings;
      setBaseUrl(parsed.baseUrl || DEFAULT_BASE_URL);
      if (Array.isArray(parsed.apiKeys) && parsed.apiKeys.length > 0) {
        setApiKeys(parsed.apiKeys.map((key) => createEditableKey(key)));
      }
    } catch (error) {
      console.error("Failed to load Gemini settings", error);
    }
  }, []);

  const handleKeyChange = (id: string, value: string) => {
    setApiKeys((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  const handleAddKey = () => {
    setApiKeys((prev) => [...prev, createEditableKey()]);
  };

  const handleRemoveKey = (id: string) => {
    setApiKeys((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const handleResetDefaults = () => {
    setBaseUrl(DEFAULT_BASE_URL);
    setApiKeys([createEditableKey()]);
    localStorage.removeItem(STORAGE_KEY);
    setStatus({ type: "success", message: "設定を初期化しました。" });
  };

  const handleSave = () => {
    try {
      const trimmedBaseUrl = baseUrl.trim() || DEFAULT_BASE_URL;
      const cleanedKeys = apiKeys
        .map((item) => item.value.trim())
        .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);

      const payload: GeminiSettings = {
        baseUrl: trimmedBaseUrl.endsWith("/") ? trimmedBaseUrl : `${trimmedBaseUrl}/`,
        apiKeys: cleanedKeys,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setStatus({ type: "success", message: "Gemini API 設定を保存しました。" });
    } catch (error) {
      console.error("Failed to save Gemini settings", error);
      setStatus({ type: "error", message: "保存中にエラーが発生しました。" });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-14 sm:px-10 lg:px-16">
        <header className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">
            Receipt Automation
          </span>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            Gemini API 連携設定
          </h1>
          <p className="text-sm text-slate-200/80 sm:text-base">
            レシート／領収書を Gemini API でデータ化する際のエンドポイントと API キーを
            設定します。複数の API キーを登録すると、1 つ目で失敗した場合に 2
            つ目以降へ自動でフェイルオーバーします。
          </p>
        </header>

        <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">API 接続設定</h2>
            <p className="text-sm text-slate-300/80">
              ベース URL は Gemini API のバージョンに合わせて変更できます。通常は既定値のままで問題ありません。
            </p>
          </div>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            ベース URL
            <input
              type="url"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder={DEFAULT_BASE_URL}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-base text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">API キー</h3>
              <button
                type="button"
                onClick={handleAddKey}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80 transition hover:border-emerald-400/60 hover:text-emerald-200"
              >
                キーを追加
              </button>
            </div>
            <p className="text-xs text-slate-300/70">
              上から順に試行され、失敗した場合は次のキーにフェイルオーバーします。
            </p>

            <div className="space-y-3">
              {apiKeys.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex-1 space-y-1 text-sm text-slate-200">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs uppercase tracking-[0.25em] text-white/50">
                        API KEY {index + 1}
                      </span>
                      <input
                        type="text"
                        value={item.value}
                        onChange={(event) => handleKeyChange(item.id, event.target.value)}
                        placeholder="AIzaSy..."
                        className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-base text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end sm:w-32">
                    <button
                      type="button"
                      disabled={apiKeys.length <= 1}
                      onClick={() => handleRemoveKey(item.id)}
                      className="rounded-full border border-white/20 px-3 py-2 text-xs font-medium text-white/70 transition hover:border-rose-400/60 hover:text-rose-200 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {status && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                status.type === "success"
                  ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200"
                  : "border-rose-400/60 bg-rose-400/10 text-rose-200"
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              設定を保存
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80 transition hover:border-white/40 hover:text-white"
            >
              初期設定に戻す
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
