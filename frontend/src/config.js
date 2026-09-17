// Configurarea widgetului, scrisa de workflow-urile din .github/workflows/.
// Valorile de aici sunt fallback-ul cand iframe-ul nu primeste parametri in URL.
import widgetConfig from "../../conf/widget.json";

export const DEFAULT_TITLE = "Locuri de muncă pentru juniori";
export const DEFAULT_COLOR = "#4f46e5";

export const config = {
  faculty: widgetConfig.faculty || "",
  title: widgetConfig.title || DEFAULT_TITLE,
  color: widgetConfig.color || DEFAULT_COLOR,
  pagesUrl: (widgetConfig.pagesUrl || "").replace(/\/+$/, ""),
  updatedAt: widgetConfig.updatedAt || null,
};

// Parametrii vin dupa "?" din hash: #/widget?title=...&color=...
export function getWidgetParams() {
  const hash = window.location.hash;
  const queryStart = hash.indexOf("?");
  return new URLSearchParams(queryStart >= 0 ? hash.slice(queryStart + 1) : "");
}
