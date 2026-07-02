"use client";

import { useState } from "react";

// A site's favicon (its "logo") via Google's s2 service, falling back to a
// plain numbered/text mark if it can't load or there's no domain. Shared by
// the claim explorer's source tabs and the provenance dossier.
export default function Favicon({
  domain,
  fallback,
  size = 20,
}: {
  domain?: string;
  fallback: string | number;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);

  if (!domain || broken) {
    return (
      <span className="text-xs font-bold tabular-nums text-ink/50">
        {fallback}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      onError={() => setBroken(true)}
    />
  );
}
