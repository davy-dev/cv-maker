"use client";

import { useEffect, useRef, useState } from "react";
import { PAGE_WIDTH, pageBreaks } from "@/lib/cv/page";
import { cvFontVariables } from "./fonts";

/**
 * A template drawn at its real size (A4 at 96 dpi) and scaled down to the
 * width available: the preview of the classic editors, read-only.
 */
export function ScaledPage({ children }: { children: React.ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(PAGE_WIDTH);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const frame = new ResizeObserver(([entry]) => setFrameWidth(entry.contentRect.width));
    const content = new ResizeObserver(([entry]) => setContentHeight(entry.contentRect.height));
    frame.observe(frameRef.current!);
    content.observe(contentRef.current!);
    return () => {
      frame.disconnect();
      content.disconnect();
    };
  }, []);

  const scale = Math.min(1, frameWidth / PAGE_WIDTH);
  const pages = pageBreaks(contentHeight).length + 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center text-xs">
        <span
          className={
            pages > 1
              ? "rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800"
              : "rounded-full bg-gray-200 px-2.5 py-1 font-medium text-gray-700"
          }
        >
          {pages > 1 ? `≈ ${pages} pages — masquez des éléments pour tenir sur une page` : "1 page"}
        </span>
      </div>
      <div ref={frameRef} className="overflow-hidden bg-white shadow-lg" style={{ height: Math.max(contentHeight, 1123) * scale }}>
        <div
          ref={contentRef}
          className={cvFontVariables}
          style={{ width: PAGE_WIDTH, transform: `scale(${scale})`, transformOrigin: "0 0" }}
          // Links on the preview must not navigate away from the editor
          onClickCapture={(e) => {
            if ((e.target as HTMLElement).closest("a")) e.preventDefault();
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
