import React from "react";

interface AvatarProps {
  name: string;
  number?: number;
  photo?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-24 w-24 text-2xl sm:h-28 sm:w-28 sm:text-3xl",
};

export default function Avatar({
  name,
  number,
  photo,
  size = "md",
}: AvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  if (photo) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 ${sizeMap[size]}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={name}
          className="h-full w-full object-cover grayscale contrast-125 transition-all duration-300 hover:grayscale-0"
        />
        {number != null && (
          <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-md bg-neutral-900 text-[10px] font-bold text-white shadow">
            {number}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-2xl border border-neutral-300 bg-neutral-100 font-bold tracking-tight text-neutral-900 ${sizeMap[size]}`}
    >
      <span>{initials || "OS"}</span>
      {number != null && (
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md bg-neutral-900 text-[10px] font-bold text-white shadow">
          {number}
        </span>
      )}
    </div>
  );
}
