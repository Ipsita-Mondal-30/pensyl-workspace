import { Node } from "@tiptap/core";

export const CaptionNode = Node.create({
  name: "caption",
  group: "block",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [
      {
        tag: "figcaption",
      },
      {
        tag: "caption",
      },
    ];
  },

  renderHTML() {
    return ["figcaption", { class: "research-caption" }, 0];
  },

  addCommands() {
    return {
      setCaption:
        (caption: string) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: "text",
                text: caption,
              },
            ],
          });
        },
    } as any;
  },
});

