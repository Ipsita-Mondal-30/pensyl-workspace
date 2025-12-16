"use client";
import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/core";
import type { CommentData } from "../extensions/research-paper/CommentMark";
import { CommentThread } from "./CommentThread";

interface ReviewPanelProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: string;
}

export function ReviewPanel({
  editor,
  isOpen,
  onClose,
  currentUser = "Current User",
}: ReviewPanelProps) {
  const [comments, setComments] = useState<Map<string, CommentData>>(new Map());
  const [replies, setReplies] = useState<Map<string, CommentData[]>>(new Map());
  const [showTrackChanges, setShowTrackChanges] = useState(true);

  useEffect(() => {
    if (!editor || !isOpen) return;

    // Extract comments from document
    const { state } = editor.view;
    const { doc } = state;
    const foundComments = new Map<string, CommentData>();

    doc.descendants((node: any) => {
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          if (mark.type.name === "comment") {
            const commentId = mark.attrs.commentId;
            if (commentId && !foundComments.has(commentId)) {
              foundComments.set(commentId, {
                id: commentId,
                author: mark.attrs.commentAuthor || "Unknown",
                content: mark.attrs.commentContent || "",
                timestamp: new Date(mark.attrs.commentTimestamp || Date.now()),
                resolved: false,
              });
            }
          }
        });
      }
    });

    setComments(foundComments);
  }, [editor, isOpen]);

  const handleResolve = (commentId: string) => {
    setComments((prev) => {
      const updated = new Map(prev);
      const comment = updated.get(commentId);
      if (comment) {
        updated.set(commentId, { ...comment, resolved: true });
      }
      return updated;
    });
  };

  const handleReply = (commentId: string, replyText: string) => {
    const reply: CommentData = {
      id: `reply-${Date.now()}`,
      author: currentUser,
      content: replyText,
      timestamp: new Date(),
    };

    setReplies((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(commentId) || [];
      updated.set(commentId, [...existing, reply]);
      return updated;
    });
  };

  const handleAddComment = () => {
    if (!editor) return;

    const { state } = editor.view;
    const { selection } = state;
    const { from, to } = selection;

    if (from === to) {
      alert("Please select text to comment on");
      return;
    }

    const commentText = prompt("Enter your comment:");
    if (!commentText) return;

    const comment: CommentData = {
      id: `comment-${Date.now()}`,
      author: currentUser,
      content: commentText,
      timestamp: new Date(),
    };

    (editor.commands as any).addComment(comment);
    setComments((prev) => new Map(prev).set(comment.id, comment));
  };

  if (!isOpen) return null;

  const commentsList = Array.from(comments.values());

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] flex flex-col z-50">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Review Panel
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleAddComment}
            className="w-full px-4 py-2 bg-[var(--accent-primary)] text-white rounded text-sm hover:opacity-90 transition-opacity"
          >
            Add Comment
          </button>

          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={showTrackChanges}
              onChange={(e) => setShowTrackChanges(e.target.checked)}
            />
            Show Track Changes
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {commentsList.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
            No comments yet. Select text and click "Add Comment" to start.
          </p>
        ) : (
          <div className="space-y-3">
            {commentsList.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onResolve={handleResolve}
                onReply={handleReply}
                replies={replies.get(comment.id) || []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
