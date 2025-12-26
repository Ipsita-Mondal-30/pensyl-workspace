import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Render LaTeX to HTML using KaTeX
 */
export function renderMath(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
      output: "html",
    });
  } catch (error) {
    console.error("KaTeX rendering error:", error);
    return `<span class="math-error">Error rendering: ${latex}</span>`;
  }
}

/**
 * Check if a string is valid LaTeX
 */
export function isValidLatex(latex: string): boolean {
  try {
    katex.renderToString(latex, { throwOnError: true });
    return true;
  } catch {
    return false;
  }
}

