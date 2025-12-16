"use client";
import { useState } from "react";
import type { CommentData } from "../extensions/research-paper/CommentMark";

interface CommentThreadProps {
  comment: CommentData;
  onResolve: (commentId: string) => void;
  onReply: (commentId: string, reply: string) => void;
  replies?: CommentData[];
}

export function CommentThread({
  comment,
  onResolve,
  onReply,
  replies = [],
}: CommentThreadProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [replyText, setReplyText] = useState("");

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText("");
    }
  };

  return (
    <div className="border border-[var(--border-primary)] rounded-lg p-3 mb-2 bg-[var(--bg-secondary)]">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {comment.author}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {new Date(comment.timestamp).toLocaleString()}
            </span>
            {comment.resolved && (
              <span className="text-xs text-green-500">✓ Resolved</span>
            )}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{comment.content}</p>
        </div>
        <button
          onClick={() => onResolve(comment.id)}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          disabled={comment.resolved}
        >
          {comment.resolved ? "Resolved" : "Resolve"}
        </button>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-4 mt-2 space-y-2">
          {replies.map((reply) => (
            <div key={reply.id} className="border-l-2 border-[var(--border-primary)] pl-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {reply.author}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {new Date(reply.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Input */}
      {!comment.resolved && (
        <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Add a reply..."
            rows={2}
            className="w-full px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
          />
          <button
            onClick={handleReply}
            className="mt-2 px-3 py-1 bg-[var(--accent-primary)] text-white rounded text-xs hover:opacity-90 transition-opacity"
          >
            Reply
          </button>
        </div>
      )}
    </div>
  );
}

