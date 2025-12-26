import { NextRequest, NextResponse } from "next/server";
import { exportToLaTeX } from "../../../lib/export/latexExporter";

export async function POST(request: NextRequest) {
  try {
    const { documentJson, title = "research-paper" } = await request.json();

    if (!documentJson) {
      return NextResponse.json(
        { error: "Document JSON is required" },
        { status: 400 }
      );
    }

    // For complex LaTeX export, we would process the document JSON
    // and generate a complete LaTeX document with proper structure
    
    // This is a simplified version - in production, you'd want to:
    // 1. Parse the document JSON structure
    // 2. Generate proper LaTeX preamble with packages
    // 3. Convert all research nodes to LaTeX
    // 4. Handle citations, figures, equations properly
    
    const latexContent = `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{hyperref}

\\title{${title}}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

% Document content would be inserted here
% This is a placeholder - full implementation would convert document JSON to LaTeX

\\end{document}`;

    return new NextResponse(latexContent, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${title}.tex"`,
      },
    });
  } catch (error: any) {
    console.error("LaTeX export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate LaTeX" },
      { status: 500 }
    );
  }
}

