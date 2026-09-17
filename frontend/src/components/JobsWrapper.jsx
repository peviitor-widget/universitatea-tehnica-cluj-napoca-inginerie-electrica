import { useRef, useEffect, useCallback } from "react";
import { JobCard } from "../components/ui/JobCard";
import { Search, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardFooter } from "../components/ui/card";

function EmptyJobCard({ totalJobsCount, onResetFilter }) {
  const isNoDataAtAll = totalJobsCount === 0;

  return (
    <Card
      className="relative flex flex-col justify-between overflow-hidden bg-bg-card shadow-sm animate-fade-in mx-auto"
      style={{ maxWidth: "280px", width: "100%" }}
    >
      <CardHeader className="p-4 pb-3 flex flex-col space-y-3">
        <div className="flex gap-3 items-center w-full">
          <div
            className={`h-10 w-10 rounded-xl bg-linear-to-br ${
              isNoDataAtAll
                ? "from-red-500 to-rose-600"
                : "from-slate-500 to-slate-700"
            } flex items-center justify-center text-white shrink-0 shadow-sm`}
            aria-hidden="true"
          >
            {isNoDataAtAll ? (
              <RefreshCw className="w-5 h-5" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h3 className="text-xs font-bold text-text-h m-0 text-left leading-snug">
              {isNoDataAtAll ? "Locuri de muncă indisponibile momentan" : "Fără joburi"}
            </h3>
            <p className="text-[11px] font-semibold text-text text-left mt-0.5">
              {isNoDataAtAll
                ? "Încearcă mai târziu"
                : "Selectează alt filtru"}
            </p>
          </div>
        </div>
        <p className="text-[11px] text-text text-left m-0 leading-relaxed font-normal">
          {isNoDataAtAll
            ? "Nu am putut descărca ofertele de muncă. Te rugăm să reîncarci pagina sau să încerci mai târziu."
            : "Nu am găsit nicio ofertă disponibilă pentru facultatea selectată. Modifică filtrul pentru a vedea joburi."}
        </p>
      </CardHeader>
      <CardFooter className="pb-0 px-0 pt-0 flex items-center">
        <Button
          onClick={() => {
            if (isNoDataAtAll) {
              window.location.reload();
            } else {
              onResetFilter();
            }
          }}
          className="w-full text-xs rounded-none py-0 h-8"
        >
          {isNoDataAtAll ? "Reîncarcă pagina" : "Toate joburile"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function JobsWrapper({
  filteredJobs,
  totalJobsCount,
  onResetFilter,
  onApply,
}) {
  const cardRefs = useRef([]);
  const listRef = useRef(null);

  const updateHeight = useCallback(() => {
    if (!listRef.current) return;
    const heights = cardRefs.current
      .filter(Boolean)
      .map((el) => el.offsetHeight);
    if (heights.length === 0) return;
    const visibleCount = Math.min(heights.length, 2);
    const cardH = Math.max(...heights);
    const gapH = 12;
    const totalH = cardH * visibleCount + gapH * (visibleCount - 1) + 8;
    listRef.current.style.maxHeight = `${totalH}px`;
  }, []);

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, filteredJobs.length);
    const observer = new ResizeObserver(updateHeight);
    cardRefs.current.filter(Boolean).forEach((el) => observer.observe(el));
    updateHeight();
    return () => observer.disconnect();
  }, [filteredJobs, updateHeight]);

  return (
    <div className="flex flex-col gap-3">
      {filteredJobs.length === 0 ? (
        <EmptyJobCard
          totalJobsCount={totalJobsCount}
          onResetFilter={onResetFilter}
        />
      ) : (
        <div
          ref={listRef}
          role="list"
          aria-label="Listă locuri de muncă"
          className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden p-1 snap-y snap-mandatory"
        >
          {filteredJobs.map((job, idx) => (
            <div
              key={job.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              role="listitem"
              className="snap-start shrink-0"
            >
              <JobCard job={job} onApply={onApply} />
            </div>
          ))}
        </div>
      )}

      {/* Footer Branding peViitor */}
      <div className="flex flex-col items-center justify-center gap-1 pt-2.5 mt-0.5 border-t border-border">
        <span className="text-[11px] font-semibold text-text/70 select-none">
          Descoperă mai multe pe
        </span>
        <div className="relative group inline-flex items-center">
          <a
            href="https://peviitor.ro"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center group/logo"
            aria-label="peViitor.ro"
          >
            <img
              src="peviitor-logo.svg"
              alt="peViitor.ro"
              className="h-5 w-auto object-contain transition-all duration-200 group-hover/logo:brightness-50 dark:brightness-200 dark:group-hover/logo:brightness-125"
            />
          </a>
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:flex items-center z-50 pointer-events-none">
            <div className="bg-slate-900 text-slate-100 text-[11px] font-medium px-2.5 py-1 rounded-[10px] whitespace-nowrap border border-slate-700/60 shadow-lg">
              Deschide peViitor.ro
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
