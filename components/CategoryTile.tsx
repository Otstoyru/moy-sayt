import Image from "next/image";
import Link from "next/link";

export default function CategoryTile({
  slug,
  name,
  shortDescription,
  cover,
}: {
  slug: string;
  name: string;
  shortDescription: string;
  cover?: string;
}) {
  return (
    <Link
      href={`/catalog/${slug}`}
      className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-[#f1ece1]"
    >
      {cover && (
        <Image
          src={cover}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="relative bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5 pt-16">
        <p className="font-display text-lg font-semibold text-white">{name}</p>
        <p className="mt-1 text-xs text-white/80">{shortDescription}</p>
      </div>
    </Link>
  );
}
