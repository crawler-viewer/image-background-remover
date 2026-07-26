/**
 * Deep links into the tool, e.g. `/#tool?export=white&size=2000` from the
 * /white-background/ and /batch-remove-background/ landing pages.
 *
 * Pure: takes the raw `location.hash` / `location.search` strings so it can be
 * tested without a DOM.
 */
import { parseCanvasSizeParam } from "./canvas";
import type { CanvasSize } from "./types";

export type ExportDeepLink = {
  /** Make the white JPG button the primary CTA */
  preferWhiteExport: boolean;
  /** Undefined means "leave the current colour alone" */
  bgColor?: string;
  /** Undefined means "leave the current canvas alone" */
  canvasSize?: CanvasSize;
  openExportMenu: boolean;
  focusTool: boolean;
};

const WHITE_MODES = new Set(["white", "amazon", "jpg"]);

export function parseExportDeepLink(hash: string, search: string): ExportDeepLink {
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  const normalizedSearch = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(hashQuery || normalizedSearch);

  const exportMode = (params.get("export") || params.get("bg") || "").toLowerCase();
  const sizeParam = parseCanvasSizeParam(params.get("size") || params.get("canvas"));
  const focusTool = hash.startsWith("#tool") || params.get("focus") === "tool";

  if (WHITE_MODES.has(exportMode)) {
    return {
      preferWhiteExport: true,
      bgColor: "#FFFFFF",
      // Marketplace intent → square canvas even when no size was given
      canvasSize: sizeParam || "2000",
      openExportMenu: true,
      focusTool,
    };
  }

  if (exportMode === "black") {
    return {
      preferWhiteExport: false,
      bgColor: "#000000",
      canvasSize: sizeParam || undefined,
      openExportMenu: true,
      focusTool,
    };
  }

  return {
    preferWhiteExport: false,
    canvasSize: sizeParam || undefined,
    openExportMenu: false,
    focusTool,
  };
}
