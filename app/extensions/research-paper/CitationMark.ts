import { Mark } from "@tiptap/core";
import type { CitationData } from "../../types/research-paper";

export interface CitationMarkAttributes {
  id: string;
  style: "apa" | "ieee" | "mla" | "acm";
  data?: CitationData;
}

export const CitationMark = Mark.create({
  name: "citation",
  inclusive: false,
  group: "inline",

  addAttributes() {
    return {
      id: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-citation-id") || "",
      },
      style: {
        default: "apa" as const,
        parseHTML: (element) => {
          const style = element.getAttribute("data-citation-style");
          return (style as "apa" | "ieee" | "mla" | "acm") || "apa";
        },
      },
      data: {
        default: null,
        parseHTML: (element) => {
          const data = element.getAttribute("data-citation-data");
          return data ? JSON.parse(data) : null;
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-citation-id]',
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          return {
            id: element.getAttribute("data-citation-id") || "",
            style: (element.getAttribute("data-citation-style") ||
              "apa") as "apa" | "ieee" | "mla" | "acm",
            data: element.getAttribute("data-citation-data")
              ? JSON.parse(element.getAttribute("data-citation-data") || "{}")
              : null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, mark }) {
    const attrs = mark.attrs as CitationMarkAttributes;
    const citationId = attrs.id || "";
    const displayText = citationId ? `[${citationId}]` : "[Citation]";

    return [
      "span",
      {
        "data-citation-id": citationId,
        "data-citation-style": attrs.style || "apa",
        class: "citation-mark",
        ...HTMLAttributes,
      },
      ...(citationId ? [displayText] : [0]), // Render text or children (0)
    ];
  },

  addCommands() {
    return {
      insertCitation:
        (id: string, style?: "apa" | "ieee" | "mla" | "acm", data?: CitationData) =>
        ({ commands }: { commands: any }) => {
          return commands.setMark(this.name, {
            id,
            style: style || "apa",
            data: data || null,
          });
        },
      removeCitation:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.unsetMark(this.name);
        },
    } as any;
  },
});

