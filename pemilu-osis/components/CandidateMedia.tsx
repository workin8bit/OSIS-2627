import type { Candidate } from "@/lib/types";
import { formatInline } from "@/lib/richText";

export { formatInline };

export function isDirectMedia(url: string) {
  return /\.(mp4|webm|ogg|mov|gif)$/i.test(url);
}

export function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/i.test(url);
}

export function isVimeo(url: string) {
  return /vimeo\.com/i.test(url);
}

/**
 * Misi kandidat: mendukung bullet (-/*), penomoran (1. / 1)), dan markdown
 * tebal/miring di dalam sel.
 */
export function MissionList({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  const body = compact ? "text-[13px] sm:text-[14px]" : "text-sm";

  return (
    <ul className={`mt-1 space-y-1.5 leading-relaxed text-neutral-700 ${body}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
        if (bulletMatch) {
          return (
            <li key={i} className="flex gap-2">
              <span
                className={`${compact ? "mt-1.5" : "mt-2"} h-1.5 w-1.5 shrink-0 rounded-full bg-brand-dark`}
              />
              <span
                className="min-w-0 break-words"
                dangerouslySetInnerHTML={{ __html: formatInline(bulletMatch[1]) }}
              />
            </li>
          );
        }

        const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
        if (numMatch) {
          return (
            <li key={i} className="flex gap-2">
              <span className="shrink-0 font-mono font-bold text-brand-deep">
                {numMatch[1]}.
              </span>
              <span
                className="min-w-0 break-words"
                dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }}
              />
            </li>
          );
        }

        return (
          <li key={i} className="pl-2">
            <span
              className="min-w-0 break-words"
              dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function CandidateMedia({
  candidate,
  compact = false,
  photoOnly = false,
}: {
  candidate: Candidate;
  compact?: boolean;
  /**
   * Abaikan video dan pakai foto saja. Dipakai di beranda supaya kartu
   * ringkas tidak memuat iframe; video tetap bisa dilihat di halaman
   * Paslon yang memanggil tanpa properti ini.
   */
  photoOnly?: boolean;
}) {
  const url = photoOnly
    ? candidate.photo_url || ""
    : candidate.video_url || candidate.photo_url || "";

  if (!url) {
    // Pada mode compact media jadi thumbnail di samping teks, jadi
    // placeholder harus berukuran sama - bukan blok aspect-video.
    if (compact) {
      return (
        <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
          {photoOnly ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-neutral-400"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-neutral-400"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </div>
      );
    }
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50">
        <div className="text-center">
          {photoOnly ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto h-10 w-10 text-neutral-500"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto h-10 w-10 text-neutral-500"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
          <span className="font-medium mt-2 block text-[11px] tracking-normal text-neutral-500">
            {photoOnly ? "Foto Paslon" : "Media Kampanye"}
          </span>
        </div>
      </div>
    );
  }

  if (!photoOnly && candidate.video_url && (isYouTube(url) || isVimeo(url))) {
    return (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950">
        <div className="relative aspect-video">
          <iframe
            src={url}
            className="h-full w-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={candidate.name}
          />
        </div>
      </div>
    );
  }

  if (!photoOnly && candidate.video_url && isDirectMedia(url)) {
    return (
      <div
        className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950"
        style={{ aspectRatio: "16/9" }}
      >
        <video
          src={url}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200">
      <img
        src={url}
        alt={candidate.name}
        className={`w-full object-cover ${compact ? "aspect-[3/4]" : "h-64 sm:h-80"}`}
      />
    </div>
  );
}
