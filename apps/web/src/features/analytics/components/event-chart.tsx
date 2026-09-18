"use client";

import { useRef, useState } from "react";
import type { AnalyticsSeriesPoint, AnalyticsTotals } from "../types";

const SERIES: { key: keyof AnalyticsTotals; label: string; color: string }[] = [
  { key: "PROFILE_VIEW", label: "Profile views", color: "var(--viz-series-1)" },
  { key: "SEARCH_APPEARANCE", label: "Search appearances", color: "var(--viz-series-2)" },
  { key: "PROFILE_CLICK", label: "Profile clicks", color: "var(--viz-series-3)" },
  { key: "INQUIRY", label: "Inquiries", color: "var(--viz-series-4)" },
];

const WIDTH = 600;
const HEIGHT = 220;
const PADDING_LEFT = 32;
const PADDING_RIGHT = 8;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 24;

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function EventChart({ series }: { series: AnalyticsSeriesPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const maxValue = niceMax(
    Math.max(1, ...series.flatMap((point) => SERIES.map((s) => point[s.key]))),
  );

  const xFor = (index: number) =>
    series.length <= 1
      ? PADDING_LEFT
      : PADDING_LEFT + (index / (series.length - 1)) * plotWidth;
  const yFor = (value: number) => PADDING_TOP + plotHeight - (value / maxValue) * plotHeight;

  const linePath = (key: keyof AnalyticsTotals) =>
    series
      .map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index)},${yFor(point[key])}`)
      .join(" ");

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
    y: PADDING_TOP + plotHeight * (1 - fraction),
    value: Math.round(maxValue * fraction),
  }));

  const tickIndices = Array.from(
    new Set(
      [0, 0.25, 0.5, 0.75, 1].map((fraction) =>
        Math.round(fraction * (series.length - 1)),
      ),
    ),
  );

  function handleMouseMove(event: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || series.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (relativeX - PADDING_LEFT) / plotWidth;
    const index = Math.round(ratio * (series.length - 1));
    setHoverIndex(Math.min(series.length - 1, Math.max(0, index)));
  }

  const hovered = hoverIndex !== null ? series[hoverIndex] : null;

  return (
    <div className="viz-root">
      <style>{`
        .viz-root {
          --viz-series-1: #2a78d6;
          --viz-series-2: #eb6834;
          --viz-series-3: #1baf7a;
          --viz-series-4: #eda100;
          --viz-grid: #e1e0d9;
          --viz-axis: #898781;
          --viz-text: #52514e;
        }
        @media (prefers-color-scheme: dark) {
          .viz-root {
            --viz-series-1: #3987e5;
            --viz-series-2: #d95926;
            --viz-series-3: #199e70;
            --viz-series-4: #c98500;
            --viz-grid: #2c2c2a;
            --viz-axis: #898781;
            --viz-text: #c3c2b7;
          }
        }
      `}</style>

      <div className="mb-3 flex flex-wrap gap-4">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            {s.label}
          </div>
        ))}
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          role="img"
          aria-label="Profile performance over time"
        >
          {gridLines.map((line) => (
            <g key={line.value}>
              <line
                x1={PADDING_LEFT}
                x2={WIDTH - PADDING_RIGHT}
                y1={line.y}
                y2={line.y}
                stroke="var(--viz-grid)"
                strokeWidth={1}
              />
              <text
                x={PADDING_LEFT - 6}
                y={line.y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="var(--viz-axis)"
              >
                {line.value}
              </text>
            </g>
          ))}

          {tickIndices.map((index) => {
            const point = series[index];
            if (!point) return null;
            return (
              <text
                key={index}
                x={xFor(index)}
                y={HEIGHT - 6}
                textAnchor="middle"
                fontSize={10}
                fill="var(--viz-axis)"
              >
                {formatDate(point.date)}
              </text>
            );
          })}

          {SERIES.map((s) => {
            const lastPoint = series[series.length - 1];
            return (
              <g key={s.key}>
                <path
                  d={linePath(s.key)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {lastPoint && (
                  <circle
                    cx={xFor(series.length - 1)}
                    cy={yFor(lastPoint[s.key])}
                    r={4}
                    fill={s.color}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}

          {hoverIndex !== null && (
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={PADDING_TOP}
              y2={PADDING_TOP + plotHeight}
              stroke="var(--viz-axis)"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-36 -translate-x-1/2 rounded-lg border border-border bg-popover p-2.5 text-xs shadow-md"
            style={{
              left: `${(xFor(hoverIndex!) / WIDTH) * 100}%`,
            }}
          >
            <p className="mb-1.5 font-medium text-foreground">{formatDate(hovered.date)}</p>
            <div className="space-y-1">
              {SERIES.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                      aria-hidden
                    />
                    {s.label}
                  </span>
                  <span className="font-medium text-foreground">{hovered[s.key]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
