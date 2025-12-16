import { Mark } from "@tiptap/core";

export interface CommentData {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  resolved?: boolean;
}

export const CommentMark = Mark.create({
  name: "comment",
  inclusive: false,
  group: "inline",

  addAttributes() {
    return {
      commentId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-comment-id") || "",
      },
      commentAuthor: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-comment-author") || "",
      },
      commentContent: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-comment-content") || "",
      },
      commentTimestamp: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-comment-timestamp") || "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          return {
            commentId: element.getAttribute("data-comment-id") || "",
            commentAuthor: element.getAttribute("data-comment-author") || "",
            commentContent: element.getAttribute("data-comment-content") || "",
            commentTimestamp: element.getAttribute("data-comment-timestamp") || "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, mark }) {
    const attrs = mark.attrs as any;
    const commentId = attrs.commentId || "";

    return [
      "span",
      {
        "data-comment-id": commentId,
        class: "comment-mark",
        style: "background-color: yellow; cursor: pointer;",
        ...HTMLAttributes,
      },
      0,
    ];
  },

  addCommands() {
    return {
      addComment:
        (comment: CommentData) =>
        ({ commands }: { commands: any }) => {
          return commands.setMark(this.name, {
            commentId: comment.id,
            commentAuthor: comment.author,
            commentContent: comment.content,
            commentTimestamp: comment.timestamp.toISOString(),
          });
        },
      removeComment:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.unsetMark(this.name);
        },
    } as any;
  },
});

