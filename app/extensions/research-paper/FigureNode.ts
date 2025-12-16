import { Node } from "@tiptap/core";

export interface FigureNodeAttributes {
  src: string;
  caption: string;
  number: number;
  label: string;
  alt?: string;
  width?: number;
  height?: number;
}

export const FigureNode = Node.create({
  name: "figure",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-src") || "",
        renderHTML: (attributes) => {
          if (!attributes.src) {
            return {};
          }
          return {
            "data-src": attributes.src,
          };
        },
      },
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") || "",
        renderHTML: (attributes) => {
          if (!attributes.caption) {
            return {};
          }
          return {
            "data-caption": attributes.caption,
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
      alt: {
        default: "",
        parseHTML: (element) => element.getAttribute("alt") || "",
        renderHTML: (attributes) => {
          if (!attributes.alt) {
            return {};
          }
          return {
            alt: attributes.alt,
          };
        },
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("data-width");
          return width ? parseInt(width, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return {
            "data-width": attributes.width.toString(),
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute("data-height");
          return height ? parseInt(height, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return {
            "data-height": attributes.height.toString(),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="figure"]',
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          return {
            src: element.getAttribute("data-src") || "",
            caption: element.getAttribute("data-caption") || "",
            number: parseInt(element.getAttribute("data-number") || "0", 10),
            label: element.getAttribute("data-label") || "",
            alt: element.getAttribute("alt") || "",
            width: element.getAttribute("data-width")
              ? parseInt(element.getAttribute("data-width") || "0", 10)
              : null,
            height: element.getAttribute("data-height")
              ? parseInt(element.getAttribute("data-height") || "0", 10)
              : null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as FigureNodeAttributes;
    const figureNumber = attrs.number || 0;
    const caption = attrs.caption || "";

    return [
      "figure",
      {
        "data-type": "figure",
        class: "research-figure",
        ...HTMLAttributes,
      },
      [
        "div",
        {
          class: "figure-image-container",
          style: attrs.width
            ? `max-width: ${attrs.width}px;`
            : "max-width: 100%;",
        },
        [
          "img",
          {
            src: attrs.src,
            alt: attrs.alt || caption || `Figure ${figureNumber}`,
            style: "width: 100%; height: auto; display: block;",
          },
        ],
      ],
      [
        "figcaption",
        {
          class: "figure-caption",
        },
        figureNumber > 0 ? `Figure ${figureNumber}: ${caption}` : caption,
      ],
    ];
  },

  addCommands() {
    return {
      insertFigure:
        (options: Partial<FigureNodeAttributes>) =>
        ({ commands, state }: { commands: any; state: any }) => {
          // Auto-number figures by counting existing figures
          const figures: number[] = [];
          state.doc.descendants((node: any) => {
            if (node.type.name === "figure") {
              const num = node.attrs.number || 0;
              if (num > 0) figures.push(num);
            }
          });

          const nextNumber =
            figures.length > 0 ? Math.max(...figures) + 1 : 1;

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src || "",
              caption: options.caption || "",
              number: options.number || nextNumber,
              label: options.label || "",
              alt: options.alt || options.caption || "",
              width: options.width || null,
              height: options.height || null,
            },
          });
        },
      updateFigure:
        (options: Partial<FigureNodeAttributes>) =>
        ({ commands }: { commands: any }) => {
          return commands.updateAttributes(this.name, options);
        },
    } as any;
  },
});

