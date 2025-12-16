"use client";
import type { DocumentAnalytics, SectionAnalytics as SectionAnalyticsType } from "../utils/documentAnalytics";

interface SectionAnalyticsProps {
  analytics: DocumentAnalytics;
}

export function SectionAnalytics({ analytics }: SectionAnalyticsProps) {
  return (
    <div className="space-y-4">
      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {analytics.totalWords.toLocaleString()}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">Words</div>
        </div>
        <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {analytics.totalCitations}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">Citations</div>
        </div>
        <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {analytics.citationDensity}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">Citations/100 words</div>
        </div>
      </div>

      {/* Section Breakdown */}
      {analytics.sections.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            Section Breakdown
          </h3>
          <div className="space-y-2">
            {analytics.sections.map((section, index) => (
              <div
                key={index}
                className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[var(--text-primary)]">
                    {section.sectionName}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {section.sectionType}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
                  <span>{section.wordCount} words</span>
                  <span>{section.citationCount} citations</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

