import Link from "next/link";

export default function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {pages.map((p) => (
        <Link
          key={p}
          href={p === 1 ? basePath : `${basePath}?page=${p}`}
          className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-medium ${
            p === page
              ? "border-brand bg-brand text-white"
              : "border-border text-foreground hover:border-brand hover:text-brand"
          }`}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
