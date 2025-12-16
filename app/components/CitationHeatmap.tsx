"use client";
import type { DocumentAnalytics } from "../utils/documentAnalytics";

interface CitationHeatmapProps {
  analytics: DocumentAnalytics;
}

export function CitationHeatmap({ analytics }: CitationHeatmapProps) {
  // Calculate citation density per section
  const sectionsWithDensity = analytics.sections.map((section) => ({
    ...section,
    density: section.wordCount > 0 
      ? (section.citationCount / section.wordCount) * 100 
      : 0,
  }));

  // Normalize density for color intensity (0-100)
  const maxDensity = Math.max(...sectionsWithDensity.map((s) => s.density), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
        Citation Density Heatmap
      </h3>
      <div className="space-y-1">
        {sectionsWithDensity.map((section, index) => {
          const intensity = Math.min((section.density / maxDensity) * 100, 100);
          const colorIntensity = Math.round(intensity);
          
          // Generate color from green (low) to red (high)
          const red = Math.min(255, Math.round((colorIntensity / 100) * 255));
          const green = Math.max(0, Math.round(255 - (colorIntensity / 100) * 255));
          const bgColor = `rgb(${red}, ${green}, 0)`;

          return (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded text-sm"
              style={{
                backgroundColor: `rgba(${red}, ${green}, 0, 0.2)`,
                borderLeft: `4px solid ${bgColor}`,
              }}
            >
              <div className="flex-1">
                <div className="font-medium text-[var(--text-primary)]">
                  {section.sectionName}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {section.citationCount} citations / {section.wordCount} words
                </div>
              </div>
              <div className="text-xs font-medium" style={{ color: bgColor }}>
                {section.density.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-[var(--text-tertiary)]">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(0, 255, 0, 0.2)", borderLeft: "4px solid rgb(0, 255, 0)" }} />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(255, 255, 0, 0.2)", borderLeft: "4px solid rgb(255, 255, 0)" }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(255, 0, 0, 0.2)", borderLeft: "4px solid rgb(255, 0, 0)" }} />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}

