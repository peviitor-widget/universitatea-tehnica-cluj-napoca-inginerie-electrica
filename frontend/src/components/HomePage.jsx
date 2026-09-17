import { useEffect, useState } from "react";
import Widget from "./Widget";
import { config } from "../config";
import { Moon, Sun, Copy, Check } from "lucide-react";

function getWidgetCode() {
  const base =
    config.pagesUrl ||
    window.location.origin + window.location.pathname.replace(/\/+$/, "");

  const params = new URLSearchParams();
  if (config.title) params.set("title", config.title);
  if (config.color) params.set("color", config.color);
  const query = params.toString() ? `?${params}` : "";

  return `<iframe
  src="${base}/#/widget${query}"
  width="100%"
  height="650px"
  style="border: none; background: transparent;"
></iframe>`;
}

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function HomePage() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("peviitor-homepage-theme") || "light";
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("peviitor-homepage-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const widgetCode = getWidgetCode();
  const updatedAt = formatDate(config.updatedAt);

  const handleCopy = () => {
    navigator.clipboard.writeText(widgetCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-text-h tracking-tight">
            peViitor Widget
          </h1>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/peviitor-widget/jobs-widget"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 rounded-lg text-text hover:text-text-h border border-border hover:border-border/80 flex items-center justify-center transition-colors"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
            </a>
            <button
              onClick={toggleTheme}
              className="h-8 w-8 rounded-lg text-text hover:text-text-h border border-border hover:border-border/80 flex items-center justify-center transition-colors"
              aria-label={theme === "light" ? "Mod întunecat" : "Mod luminos"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-h">
            {config.faculty
              ? `Widget de joburi — ${config.faculty}`
              : "Widget de joburi pentru facultatea ta"}
          </h2>
          <p className="text-sm leading-relaxed">
            Joburile de mai jos sunt selectate automat pe baza planului de
            învățământ al facultății. Widgetul se integrează pe orice site
            printr-un simplu
            <code className="bg-code-bg text-accent px-1.5 py-0.5 rounded text-xs mx-1">&lt;iframe&gt;</code>.
          </p>
          {updatedAt && (
            <p className="text-xs text-text/60">
              Joburi actualizate ultima dată pe {updatedAt}.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-h uppercase tracking-wider">
            Cod de integrare
          </h3>
          <p className="text-sm leading-relaxed">
            Copiază codul de mai jos în pagina site-ului facultății, acolo unde
            vrei să apară widgetul. Îl găsești și în fișierul{" "}
            <code className="bg-code-bg text-accent px-1.5 py-0.5 rounded text-xs">
              EMBED.md
            </code>{" "}
            din repository.
          </p>

          <div className="relative">
            <pre className="bg-code-bg border border-border rounded-lg p-4 text-xs leading-relaxed overflow-x-auto">
              <code>{widgetCode}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 h-7 w-7 rounded-md text-text hover:text-text-h border border-border hover:border-border/80 flex items-center justify-center transition-colors bg-code-bg"
              aria-label="Copiază codul"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <p className="text-sm leading-relaxed">
            Poți suprascrie aspectul direct din URL, fără să reconfigurezi
            repository-ul:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-bold text-text-h">Parametru</th>
                  <th className="text-left py-2 pr-4 font-bold text-text-h">Descriere</th>
                  <th className="text-left py-2 font-bold text-text-h">Exemplu</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 font-mono text-accent">title</td>
                  <td className="py-2 pr-4">Titlul afișat în widget</td>
                  <td className="py-2 font-mono">{config.title}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 font-mono text-accent">color</td>
                  <td className="py-2 pr-4">
                    Culoarea temei, hex (<code>#</code> se scrie <code>%23</code>)
                  </td>
                  <td className="py-2 font-mono">
                    {config.color.replace("#", "%23")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-h uppercase tracking-wider">
            Previzualizare
          </h3>
          <p className="text-sm leading-relaxed">
            Exact ce va vedea studentul pe site-ul facultății.
          </p>
          <Widget />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-h uppercase tracking-wider">
            Actualizarea joburilor
          </h3>
          <p className="text-sm leading-relaxed">
            Joburile se reîmprospătează automat săptămânal. Le poți actualiza și
            manual rulând acțiunea{" "}
            <strong>2. Reimprospateaza joburile</strong> din tab-ul Actions al
            repository-ului.
          </p>
        </section>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-text/60">
          <span>peViitor.ro</span>
          <a
            href="https://github.com/peviitor-widget/jobs-widget"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
