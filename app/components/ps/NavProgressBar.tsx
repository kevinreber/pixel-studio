import * as React from "react";
import { useNavigation } from "@remix-run/react";

/**
 * Top-of-page progress bar that animates whenever Remix is fetching a
 * loader or submitting an action. Fires at the start of a navigation,
 * tweens to ~90% while pending, snaps to 100% when idle, then fades.
 *
 * Pure indicator — no behavior change.
 */
export function NavProgressBar() {
  const navigation = useNavigation();
  const active = navigation.state !== "idle";

  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    let raf: number | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    if (active) {
      setVisible(true);
      setProgress(15);
      // Crawl from 15% toward 90% over ~3s while the navigation is pending.
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        // Asymptotic curve: 15% → 90% over ~3s, never finishes.
        const next = 15 + 75 * (1 - Math.exp(-elapsed / 1200));
        setProgress(next);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else if (visible) {
      // Snap to 100, then fade out.
      setProgress(100);
      hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (hideTimer) clearTimeout(hideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-busy={active}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent"
    >
      <div
        className="h-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: active || progress < 100 ? 1 : 0,
        }}
      />
    </div>
  );
}
