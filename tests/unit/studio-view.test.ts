import { describe, it, expect } from "vitest";
import { clampZoom, fitView, stepZoom, viewAtZoom, zoomAround } from "@/lib/studio/view";
import { pageBreaks } from "@/components/cv/studio/canvas";

describe("vue du canevas", () => {
  it("zoome en gardant le point sous le pointeur en place", () => {
    const view = { x: 100, y: 50, zoom: 1 };
    const next = zoomAround(view, 2, 300, 250);

    // The content point under (300, 250) was (200, 200); it stays there
    expect(next).toEqual({ zoom: 2, x: -100, y: -150 });
    expect((300 - next.x) / next.zoom).toBe(200);
  });

  it("borne le zoom", () => {
    expect(clampZoom(0.01)).toBe(0.1);
    expect(clampZoom(10)).toBe(4);
    expect(zoomAround({ x: 0, y: 0, zoom: 4 }, 8, 0, 0).zoom).toBe(4);
  });

  it("passe au palier de zoom suivant ou précédent", () => {
    expect(stepZoom(1, 1)).toBe(1.25);
    expect(stepZoom(1, -1)).toBe(0.75);
    expect(stepZoom(0.64, 1)).toBe(0.75);
    expect(stepZoom(0.64, -1)).toBe(0.5);
    expect(stepZoom(4, 1)).toBe(4);
  });

  it("ajuste la page entière dans la fenêtre, sans dépasser 100 %", () => {
    const page = { width: 794, height: 1123 };
    const fit = fitView({ width: 880, height: 852 }, page);
    expect(fit.zoom).toBeCloseTo((852 - 96 - 32) / 1123);
    expect(fit.x).toBeCloseTo((880 - 794 * fit.zoom) / 2);

    expect(fitView({ width: 4000, height: 4000 }, page).zoom).toBe(1);
    expect(viewAtZoom({ width: 1000, height: 800 }, page, 1)).toEqual({ zoom: 1, x: 103, y: 80 });
  });
});

describe("pageBreaks", () => {
  it("ne coupe pas un CV d'une page", () => {
    expect(pageBreaks(0)).toEqual([]);
    expect(pageBreaks(1000)).toEqual([]);
  });

  it("place les coupures en tenant compte des marges d'impression", () => {
    expect(pageBreaks(1100)).toEqual([1078]);
    expect(pageBreaks(3000)).toEqual([1078, 2111]);
  });
});
