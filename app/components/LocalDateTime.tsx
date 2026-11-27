import * as React from "react";
import { convertUtcDateToLocalDateString } from "~/client";

/**
 * Renders a UTC timestamp as the viewer's local time without breaking
 * hydration.
 *
 * `toLocaleString()` resolves against the host's timezone and locale, so the
 * server (UTC on Vercel) and the browser produce different text for the same
 * instant. Rendering that straight into markup is what produced the "Text
 * content does not match server-rendered HTML" errors across /explore, /create
 * and the set pages.
 *
 * The first paint uses a fixed locale and UTC, so server and client agree and
 * hydration matches. An effect then swaps in local time once hydration has
 * committed. Renders bare text so it is layout-neutral at every call site.
 */
const STABLE_LOCALE = "en-US";

function formatStable(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(STABLE_LOCALE, { timeZone: "UTC" });
}

export function LocalDateTime({ value }: { value: string | Date | null | undefined }) {
  const [text, setText] = React.useState(() =>
    value ? formatStable(value) : ""
  );

  React.useEffect(() => {
    if (!value) {
      setText("");
      return;
    }
    setText(convertUtcDateToLocalDateString(value));
  }, [value]);

  return <>{text}</>;
}
