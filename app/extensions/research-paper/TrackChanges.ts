import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface ChangeData {
  type: "insertion" | "deletion";
  author: string;
  timestamp: Date;
  content?: string;
}

/**
 * Track Changes Extension - marks insertions and deletions using decorations
 * Note: This is a simplified version that uses decorations instead of text node attributes
 * since ProseMirror text nodes cannot have attributes.
 */
export const TrackChanges = Extension.create({
  name: "trackChanges",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            // Track changes would be implemented here using decorations
            // For now, return empty decoration set
            return DecorationSet.empty;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      markAsInsertion:
        (author: string = "Current User") =>
        ({ commands, state }: { commands: any; state: any }) => {
          const { selection } = state;
          const { from, to } = selection;

          if (from === to) return false;

          return commands.setMark("textStyle", {
            changeType: "insertion",
            changeAuthor: author,
            changeTimestamp: new Date().toISOString(),
          });
        },
      markAsDeletion:
        (author: string = "Current User") =>
        ({ commands }: { commands: any }) => {
          return commands.setMark("textStyle", {
            changeType: "deletion",
            changeAuthor: author,
            changeTimestamp: new Date().toISOString(),
          });
        },
      acceptChange:
        () =>
        ({ commands, state }: { commands: any; state: any }) => {
          const { selection } = state;
          return commands.unsetMark("textStyle", ["changeType", "changeAuthor", "changeTimestamp"]);
        },
      rejectChange:
        () =>
        ({ commands, state }: { commands: any; state: any }) => {
          const { selection } = state;
          const { from, to } = selection;
          // Remove the changed content
          return commands.deleteRange({ from, to });
        },
    } as any;
  },
});

