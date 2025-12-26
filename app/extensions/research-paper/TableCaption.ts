import { Extension } from "@tiptap/core";
import { Table } from "@tiptap/extension-table";

export interface TableCaptionAttributes {
  caption?: string;
  number?: number;
  label?: string;
}

/**
 * Extension to add caption support to tables
 */
export const TableCaption = Extension.create({
  name: "tableCaption",

  addGlobalAttributes() {
    return [
      {
        types: ["table"],
        attributes: {
          caption: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-caption"),
            renderHTML: (attributes) => {
              if (!attributes.caption) {
                return {};
              }
              return {
                "data-caption": attributes.caption,
              };
            },
          },
          tableNumber: {
            default: 0,
            parseHTML: (element) => {
              const num = element.getAttribute("data-table-number");
              return num ? parseInt(num, 10) : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.tableNumber || attributes.tableNumber === 0) {
                return {};
              }
              return {
                "data-table-number": attributes.tableNumber.toString(),
              };
            },
          },
          tableLabel: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-table-label"),
            renderHTML: (attributes) => {
              if (!attributes.tableLabel) {
                return {};
              }
              return {
                "data-table-label": attributes.tableLabel,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTableCaption:
        (caption: string, number?: number, label?: string) =>
        ({ commands, state }: { commands: any; state: any }) => {
          const { selection } = state;
          const { $anchor } = selection;

          // Find the table node
          let tableNode: any = null;
          let tablePos = 0;

          state.doc.descendants((node: any, pos: number) => {
            if (node.type.name === "table") {
              if (pos <= $anchor.pos && pos + node.nodeSize >= $anchor.pos) {
                tableNode = node;
                tablePos = pos;
                return false;
              }
            }
            return true;
          });

          if (!tableNode) {
            return false;
          }

          // Auto-number if not provided
          let tableNumber = number;
          if (!tableNumber) {
            const tables: number[] = [];
            state.doc.descendants((node: any) => {
              if (node.type.name === "table") {
                const num = node.attrs.tableNumber || 0;
                if (num > 0) tables.push(num);
              }
            });
            tableNumber = tables.length > 0 ? Math.max(...tables) + 1 : 1;
          }

          return commands.updateAttributes("table", {
            caption,
            tableNumber,
            tableLabel: label || null,
          });
        },
    } as any;
  },
});

