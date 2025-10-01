"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });import type { Note } from "../types";

interface EditorProps {
  note?: Note;
  onSave: (note: Note) => void;
  onCancel?: () => void;
  theme?: "default" | "dark"; // NEW prop for theme
}

const EditorComponent: React.FC<EditorProps> = ({
  note,
  onSave,
  onCancel,
  theme = "default",
}) => {
  const editor = useRef(null);
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
  }, [note]);

  const handleSave = () => {
    const newNote: Note = {
      id: note?.id || Date.now(),
      title,
      content,
      updatedAt: Date.now(),
    };
    onSave(newNote);
    setTitle("");
    setContent("");
  };

  // Configure Jodit editor
  const config = {
    readonly: false,
    iframe: false,
    height: 400,
    toolbarButtonSize: "middle",
    theme: theme, // Pass theme here
    uploader: {
      insertImageAsBase64URI: true,
    },
  };

  return (
    <div className="pt-0">
      <input
        type="text"
        placeholder="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 mb-2 rounded border border-gray-300 bg-gray-50 dark:bg-[#575757] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <JoditEditor
        ref={editor}
        value={content}
        config={config}
        tabIndex={1}
        onBlur={(newContent: string) => setContent(newContent)}
      />
      <div className="mt-5">
        <button className="btn btn-green" onClick={handleSave}>
          Save
        </button>
        {onCancel && (
          <button
            className="btn btn-gray"
            onClick={onCancel}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default EditorComponent;
