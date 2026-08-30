"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type UploadResult = {
  categoriesUpserted: number;
  productsUpserted: number;
  newArticles: string[];
};

export default function StockUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setStatus("uploading");
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/stock/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Не удалось загрузить файл");
      setStatus("error");
      return;
    }

    setResult(data);
    setStatus("idle");
    setFile(null);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label
          htmlFor="stock-file"
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:bg-brand"
        >
          Выбрать файл
        </label>
        <input
          id="stock-file"
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="text-sm text-muted">{file ? file.name : "Файл не выбран"}</span>
      </div>

      <button
        type="submit"
        disabled={!file || status === "uploading"}
        className="inline-flex h-11 w-fit items-center justify-center rounded-full border border-border px-5 text-sm font-medium hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "uploading" ? "Загрузка..." : "Загрузить и обновить"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="font-medium text-green-700">Готово.</p>
          <p className="mt-1">Категорий обновлено: {result.categoriesUpserted}</p>
          <p>Товаров обновлено: {result.productsUpserted}</p>
          {result.newArticles.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-amber-700">
                Новые артикулы ({result.newArticles.length}) — назначьте им юрлицо и фото:
              </p>
              <p className="mt-1 text-xs text-muted">{result.newArticles.join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
