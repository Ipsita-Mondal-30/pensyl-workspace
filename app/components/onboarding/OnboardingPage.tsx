"use client";

import { useState } from 'react';

interface OnboardingPageProps {
  onComplete: (projectType: 'research-paper' | 'other', template?: string) => void;
}

type ProjectType = 'research-paper' | 'other' | null;
type TemplateOption = 'blank' | 'template-1' | null;

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [projectType, setProjectType] = useState<ProjectType>(null);
  const [templateOption, setTemplateOption] = useState<TemplateOption>(null);

  const handleProjectTypeSelect = (type: ProjectType) => {
    setProjectType(type);
    if (type === 'other') {
      // If "other" is selected, complete onboarding immediately
      onComplete('other');
    }
  };

  const handleTemplateSelect = (template: TemplateOption) => {
    setTemplateOption(template);
    if (projectType === 'research-paper' && template) {
      onComplete('research-paper', template === 'template-1' ? 'template-1' : undefined);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F4] p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-2xl border border-[#A8B8A0] p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-[#234E40] mb-3">
              Welcome to Pensyl! 🎉
            </h1>
            <p className="text-[#5F7E64] text-lg">
              Let's get you started. What would you like to write?
            </p>
          </div>

          {/* Project Type Selection */}
          {!projectType && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => handleProjectTypeSelect('research-paper')}
                className="group p-8 bg-[#F7F8F4] hover:bg-[#D5E3D0] border-2 border-[#A8B8A0] hover:border-[#234E40] rounded-xl transition-all duration-300 text-left"
              >
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-2xl font-bold text-[#234E40] mb-2 group-hover:text-[#1B3A34] transition-colors">
                  Research Paper
                </h3>
                <p className="text-[#5F7E64]">
                  Write academic papers with structured sections, citations, figures, and more.
                </p>
              </button>

              <button
                onClick={() => handleProjectTypeSelect('other')}
                className="group p-8 bg-[#F7F8F4] hover:bg-[#D5E3D0] border-2 border-[#A8B8A0] hover:border-[#234E40] rounded-xl transition-all duration-300 text-left"
              >
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-2xl font-bold text-[#234E40] mb-2 group-hover:text-[#1B3A34] transition-colors">
                  Other
                </h3>
                <p className="text-[#5F7E64]">
                  Start with a blank document or import your own content.
                </p>
              </button>
            </div>
          )}

          {/* Template Selection for Research Paper */}
          {projectType === 'research-paper' && !templateOption && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setProjectType(null)}
                  className="text-[#5F7E64] hover:text-[#234E40] flex items-center gap-2 mb-4 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <h2 className="text-2xl font-bold text-[#234E40] mb-2">
                  Choose a starting point
                </h2>
                <p className="text-[#5F7E64]">
                  Select a template or start from scratch
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleTemplateSelect('blank')}
                  className="group p-8 bg-[#F7F8F4] hover:bg-[#D5E3D0] border-2 border-[#A8B8A0] hover:border-[#234E40] rounded-xl transition-all duration-300 text-left"
                >
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-xl font-bold text-[#234E40] mb-2 group-hover:text-[#1B3A34] transition-colors">
                    Blank Paper
                  </h3>
                  <p className="text-[#5F7E64] text-sm">
                    Start with an empty research paper structure. Perfect if you have your own content ready.
                  </p>
                </button>

                <button
                  onClick={() => handleTemplateSelect('template-1')}
                  className="group p-8 bg-[#F7F8F4] hover:bg-[#D5E3D0] border-2 border-[#A8B8A0] hover:border-[#234E40] rounded-xl transition-all duration-300 text-left relative"
                >
                  <div className="absolute top-4 right-4 bg-[#234E40] text-white text-xs font-semibold px-2 py-1 rounded">
                    Recommended
                  </div>
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-xl font-bold text-[#234E40] mb-2 group-hover:text-[#1B3A34] transition-colors">
                    Basic Research Paper Template
                  </h3>
                  <p className="text-[#5F7E64] text-sm mb-3">
                    A well-formatted research paper template with all standard sections pre-structured.
                  </p>
                  <div className="text-xs text-[#5F7E64]">
                    Includes: Title, Abstract, Introduction, Methods, Results, Discussion, Conclusion, References
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

