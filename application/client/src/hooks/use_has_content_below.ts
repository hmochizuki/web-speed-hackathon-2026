import { RefObject, useEffect, useRef, useState } from "react";

export function useHasContentBelow(
  contentEndRef: RefObject<HTMLElement | null>,
  boundaryRef: RefObject<HTMLElement | null>,
): boolean {
  const [hasContentBelow, setHasContentBelow] = useState(false);
  const rafIdRef = useRef(0);

  useEffect(() => {
    const endEl = contentEndRef.current;
    const barEl = boundaryRef.current;
    if (!endEl || !barEl) return;

    const check = () => {
      if (rafIdRef.current) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = 0;
        const endRect = endEl.getBoundingClientRect();
        const barRect = barEl.getBoundingClientRect();
        setHasContentBelow(endRect.top > barRect.top);
      });
    };

    const observer = new IntersectionObserver(check, {
      threshold: [0, 1],
    });
    observer.observe(endEl);

    const resizeObserver = new ResizeObserver(check);
    resizeObserver.observe(document.body);

    window.addEventListener("scroll", check, { passive: true });

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", check);
    };
  }, [contentEndRef, boundaryRef]);

  return hasContentBelow;
}
