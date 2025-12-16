import { Node } from "@tiptap/core";

export const AbstractNode = Node.create({
  name: "abstract",
  group: "block",
  content: "paragraph+",
  defining: true,

  addAttributes() {
    return {
      wordCount: {
        default: 0,
        parseHTML: (element) => {
          const count = element.getAttribute("data-word-count");
          return count ? parseInt(count, 10) : 0;
        },
        renderHTML: (attributes) => {
          if (!attributes.wordCount) {
            return {};
          }
          return {
            "data-word-count": attributes.wordCount.toString(),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-type="abstract"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      {
        "data-type": "abstract",
        class: "research-abstract",
        ...HTMLAttributes,
      },
      0,
    ];
  },

  addCommands() {
    return {
      insertAbstract:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Abstract",
                    marks: [{ type: "bold" }],
                  },
                ],
              },
              {
                type: "paragraph",
              },
            ],
          });
        },
    } as any;
  },
});

