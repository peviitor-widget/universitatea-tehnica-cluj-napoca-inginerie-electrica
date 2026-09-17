import { useState, useEffect } from "react";
import { getJobs } from "../services/api";
import { JobsWrapper } from "./JobsWrapper";
import { config, getWidgetParams } from "../config";
import { Moon, Sun } from "lucide-react";

function Widget() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("peviitor-widget-theme") || "light";
  });

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const params = getWidgetParams();
  const title = params.get("title") || config.title;
  const color = params.get("color") || config.color;

  useEffect(() => {
    let active = true;
    getJobs().then((data) => {
      if (active) {
        setJobs(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("peviitor-widget-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleApply = (job) => {
    const applyUrl = job._root_ || job.url;
    if (applyUrl) {
      window.open(applyUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className={`bg-bg text-text transition-colors duration-200 flex flex-col overflow-hidden border border-border rounded-xl ${
        theme === "dark" ? "dark" : "light"
      }`}
      style={{
        maxWidth: "320px",
        width: "100%",
        ...(color ? { "--accent": color } : {}),
      }}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-bg border-b border-neutral-400/30">
        <span className="text-sm font-bold tracking-tight text-text-h truncate pr-2">
          {title}
        </span>
        <button
          onClick={toggleTheme}
          className="h-7 w-7 shrink-0 rounded-lg text-text hover:text-text-h hover:bg-border/40 border-0 flex items-center justify-center cursor-pointer transition-colors"
          aria-label={theme === "light" ? "Mod întunecat" : "Mod luminos"}
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>
      </div>

      <main className="bg-bg overflow-y-auto p-3.5 max-h-130" id="main-content">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-xs text-text/60 font-semibold gap-2">
            <div
              className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{
                borderColor: "var(--accent)",
                borderTopColor: "transparent",
              }}
            ></div>
            <span>Se încarcă joburile...</span>
          </div>
        ) : (
          <JobsWrapper
            filteredJobs={jobs}
            totalJobsCount={jobs.length}
            onResetFilter={() => {}}
            onApply={handleApply}
          />
        )}
      </main>
    </div>
  );
}

export default Widget;
