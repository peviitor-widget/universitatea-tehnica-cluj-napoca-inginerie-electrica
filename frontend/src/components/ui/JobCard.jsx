import { useRef, useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardHeader, CardFooter } from "./card";
import { Button } from "./button";

function HoverScrollingText({ text, className, as: Component = "div" }) {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    if (isHovered && containerRef.current) {
      const el = containerRef.current;
      const overflow = el.scrollWidth - el.clientWidth;
      if (overflow > 0) {
        setScrollDistance(overflow);
      } else {
        setScrollDistance(0);
      }
    } else {
      setScrollDistance(0);
    }
  }, [isHovered, text]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="overflow-hidden w-full relative"
    >
      <Component
        ref={containerRef}
        className={className}
        style={{
          whiteSpace: "nowrap",
          textOverflow: isHovered && scrollDistance > 0 ? "clip" : "ellipsis",
          overflow: isHovered && scrollDistance > 0 ? "visible" : "hidden",
          display: "block",
          transform: `translateX(-${scrollDistance}px)`,
          transition:
            isHovered && scrollDistance > 0
              ? `transform ${scrollDistance * 0.015}s linear`
              : "transform 0.3s ease-out",
        }}
      >
        {text}
      </Component>
    </div>
  );
}

function formatTitle(title) {
  if (!title) return "";
  const t = String(title).trim();
  if (t.length === 0) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function formatCompany(company) {
  if (!company) return "";
  return String(company).trim().toUpperCase();
}

export function JobCard({ job, onApply }) {
  return (
    <Card
      className="relative flex flex-col justify-between overflow-hidden hover:border-text/30"
      style={{ maxWidth: "280px", width: "100%" }}
    >
      <CardHeader className="p-3.5 flex flex-row items-center justify-between gap-3">
        <div className="flex gap-3 items-center min-w-0 flex-1">
          <div
            className={`h-10 w-10 rounded-xl ${job.logoBg} flex items-center justify-center font-bold text-sm shrink-0`}
            aria-hidden="true"
          >
            {job.company.split(" ")[0].substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <HoverScrollingText
              as="h3"
              text={formatTitle(job.title)}
              className="text-xs font-bold text-text-h m-0 text-left leading-snug"
            />
            <HoverScrollingText
              text={formatCompany(job.company)}
              className="text-[11px] font-semibold text-text text-left mt-0.5"
            />
          </div>
        </div>
      </CardHeader>
      <CardFooter className="p-0">
        <Button
          onClick={() => onApply(job)}
          className="w-full h-9 rounded-t-none text-[12px] tracking-wide font-bold flex items-center justify-center gap-1.5"
          aria-label={`Aplică la jobul ${job.title} de la ${job.company}`}
        >
          <span>Aplică</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
