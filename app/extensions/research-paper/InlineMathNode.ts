import { Mark } from "@tiptap/core";
import { renderMath } from "../../utils/mathRenderer";

export const InlineMathNode = Mark.create({
  name: "inlineMath",
  inclusive: false,
  group: "inline",

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") || "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="inline-math"]',
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          return {
            latex: element.getAttribute("data-latex") || "",
          };
        },
      },
      {
        tag: "span.math-inline",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          return {
            latex: element.getAttribute("data-latex") || element.textContent || "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, mark }) {
    const latex = (mark.attrs as { latex: string }).latex || "";

    return [
      "span",
      {
        "data-type": "inline-math",
        "data-latex": latex,
        class: "math-inline",
        ...HTMLAttributes,
      },
      0, // Render children (the text content)
    ];
  },

  addCommands() {
    return {
      setInlineMath:
        (latex: string) =>
        ({ commands }: { commands: any }) => {
          return commands.setMark(this.name, { latex });
        },
      toggleInlineMath:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.toggleMark(this.name);
        },
    } as any;
  },

  addKeyboardShortcuts() {
    return {
      "Mod-m": () => (this.editor.commands as any).toggleInlineMath(),
    };
  },
});

