import { Node } from "@tiptap/core";
import { renderMath } from "../../utils/mathRenderer";

export interface BlockEquationNodeAttributes {
  latex: string;
  number: number;
  label: string;
}

export const BlockEquationNode = Node.create({
  name: "blockEquation",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") || "",
        renderHTML: (attributes) => {
          if (!attributes.latex) {
            return {};
          }
          return {
            "data-latex": attributes.latex,
          };
        },
      },
      number: {
        default: 0,
        parseHTML: (element) => {
          const num = element.getAttribute("data-number");
          return num ? parseInt(num, 10) : 0;
        },
        renderHTML: (attributes) => {
          if (!attributes.number) {
            return {};
          }
          return {
            "data-number": attributes.number.toString(),
          };
        },
      },
      label: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-label") || "",
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }
          return {
            "data-label": attributes.label,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="equation"]',
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          return {
            latex: element.getAttribute("data-latex") || "",
            number: parseInt(element.getAttribute("data-number") || "0", 10),
            label: element.getAttribute("data-label") || "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as BlockEquationNodeAttributes;
    const latex = attrs.latex || "";
    const equationNumber = attrs.number || 0;

    return [
      "div",
      {
        "data-type": "equation",
        "data-latex": latex,
        "data-number": equationNumber.toString(),
        "data-label": attrs.label || "",
        class: "research-equation",
        ...HTMLAttributes,
      },
      [
        "div",
        {
          class: "equation-content",
        },
        latex || "", // Display LaTeX code as text for now
      ],
      equationNumber > 0
        ? [
            "div",
            {
              class: "equation-number",
            },
            `(${equationNumber})`,
          ]
        : [],
    ];
  },

  addCommands() {
    return {
      insertEquation:
        (options: Partial<BlockEquationNodeAttributes>) =>
        ({ commands, state }: { commands: any; state: any }) => {
          // Auto-number equations by counting existing equations
          const equations: number[] = [];
          state.doc.descendants((node: any) => {
            if (node.type.name === "blockEquation") {
              const num = node.attrs.number || 0;
              if (num > 0) equations.push(num);
            }
          });

          const nextNumber =
            equations.length > 0 ? Math.max(...equations) + 1 : 1;

          return commands.insertContent({
            type: this.name,
            attrs: {
              latex: options.latex || "",
              number: options.number || nextNumber,
              label: options.label || "",
            },
          });
        },
      updateEquation:
        (options: Partial<BlockEquationNodeAttributes>) =>
        ({ commands }: { commands: any }) => {
          return commands.updateAttributes(this.name, options);
        },
    } as any;
  },
});

