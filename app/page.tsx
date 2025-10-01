"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { fetchNotes, saveNote, deleteNote } from "../utils/api";
import type { Note } from "../types";

const EditorComponent = dynamic(() => import("../components/EditorComponent"), {
  ssr: false,
});

export default function Page() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [animateEditor, setAnimateEditor] = useState(false);
  const [animateViewer, setAnimateViewer] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // Apply dark mode to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Load notes
  useEffect(() => {
    const loadNotes = async () => {
      const fetchedNotes = await fetchNotes();
      setNotes(fetchedNotes);
    };
    loadNotes();
  }, []);

  // Drag-to-resize
  useEffect(() => {
    const handle = handleRef.current;
    const editor = editorRef.current;
    if (!handle || !editor) return;

    let isDragging = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = e.clientX;
      const minWidth = 300;
      const maxWidth = window.innerWidth * 0.8;
      editor.style.flexBasis = `${Math.min(
        Math.max(newWidth, minWidth),
        maxWidth
      )}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.body.style.cursor = "default";
    };

    const onMouseDown = () => {
      isDragging = true;
      document.body.style.cursor = "col-resize";
    };

    handle.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      handle.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleSave = async (note: Note) => {
    //this starts the editor animation immediately
    setAnimateEditor(true);
    //afterwards start the viewer animation as soon as this animation ends
    setTimeout(() => setAnimateViewer(true), 400);

    //as these play out we can run everything else necessary
    await saveNote(note);
    const fetchedNotes = await fetchNotes();
    const sortedNotes = fetchedNotes.sort((a, b) => b.updatedAt - a.updatedAt);

    setNotes(sortedNotes);

    setViewNote(note); // show viewer
    setAnimateEditor(false); // reset for next time
    setAnimateViewer(false);
    setCurrentNote(null); // clear current note
  };

  const handleDelete = async (id: number) => {
    await deleteNote(id);
    const fetchedNotes = await fetchNotes();
    setNotes(fetchedNotes);
  };

  const handleEdit = (note: Note) => {
    setCurrentNote(note);
    setViewNote(null);
  };

  // Filter notes by title or content
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Highlight search matches
  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(
      regex,
      `<mark class="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white">$1</mark>`
    );
  };

  return (
    <div className="pr-3 flex flex-col h-screen bg-gradient-to-b from-indigo-500 to-indigo-50 dark:from-indigo-950 dark:to-indigo-500">
      {/* Navbar */}
      <div className="h-24 flex justify-between items-center p-4 text-white">
        <h1 className="text-3xl font-bold text-gray-50">Notes</h1>
        <div className="flex items-center gap-2">
          {/* New Note Button */}
          <button
            onClick={() => {
              setCurrentNote(null); // clear current note
              setViewNote(null); // exit viewer if open
            }}
            className="btn btn-green mr-5"
          >
            New Note
          </button>

          {/* Global dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="btn btn-gray"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Editor/Viewer Pane */}
        <div
          ref={editorRef}
          className="flex flex-col min-w-[300px] max-w-[80%] border-r border-gray-200 dark:border-gray-700 p-4"
          style={{ flexBasis: "50%" }}
        >
          {/* Label */}
          <div className="mb-2">
            <span
              className={`inline-block px-4 py-1 rounded-full text-xl font-semibold shadow-sm
      ${
        viewNote
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white dark:from-blue-700 dark:to-blue-800"
          : "bg-gradient-to-r from-green-400 to-green-500 text-white dark:from-green-600 dark:to-green-700"
      }`}
            >
              {viewNote ? "Viewer" : "Editor"}
            </span>
          </div>

          {/* Editor or Viewer */}
          <div className="flex-1 overflow-visible">
            {viewNote ? (
              <div
                className={`transition-opacity duration-400 ${
                  animateViewer ? "opacity-0" : "opacity-100"
                }`}
              >
                {/* Viewer card with title inside */}
                <div
                  className={`p-4 border rounded-lg shadow-sm ${
                    darkMode
                      ? "bg-gray-800 text-gray-100 border-gray-700"
                      : "bg-gray-50 text-gray-900 border-gray-200"
                  }`}
                >
                  {/* Title inside the card */}
                  <input
                    type="text"
                    value={viewNote.title || "Untitled"}
                    readOnly
                    className="ml-1 text-xl w-full mb-2 -mx-2 p-2 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold cursor-default"
                  />

                  {/* Note content */}
                  <div
                    className="prose dark:prose-invert ml-1"
                    dangerouslySetInnerHTML={{ __html: viewNote.content }}
                  />
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setCurrentNote(viewNote);
                      setViewNote(null);
                    }}
                    className="btn btn-blue"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setViewNote(null)}
                    className="btn btn-gray"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`transition-opacity duration-550 ${
                  animateEditor ? "opacity-0" : "opacity-100"
                }`}
              >
                <EditorComponent
                  note={currentNote}
                  onSave={handleSave}
                  onCancel={() => setCurrentNote(null)}
                  theme={darkMode ? "dark" : "default"}
                />
              </div>
            )}
          </div>
        </div>

        {/* Drag Handle */}
        <div
          ref={handleRef}
          className="w-2 bg-gray-300 dark:bg-gray-600 cursor-col-resize hover:bg-gray-400 dark:hover:bg-gray-800"
        />

        {/* Notes List Pane */}
        <div className="flex-1 flex flex-col p-4 overflow-auto">
          {/* Label */}
          <div className="mb-2">
            <span className="text-gray-600 dark:text-gray-300 font-semibold">
              Notes
            </span>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-blue-50 dark:bg-gray-800 w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Notes Grid */}
          <div className="space-y-4 flex-1 overflow-auto">
            {filteredNotes.length === 0 ? (
              <p className="text-gray-100 dark:text-gray-400">No notes found</p>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 border rounded-lg shadow-sm bg-blue-50 dark:bg-gray-800 border-blue-100 dark:border-gray-700 hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: highlightText(note.title || "Untitled"),
                      }}
                    />
                  </h3>
                  <div
                    className="mt-2 text-sm text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(note.content),
                    }}
                  />
                  <div className="mt-4 flex justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewNote(note)}
                        className="btn btn-blue"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(note)}
                        className="btn btn-blue"
                      >
                        Edit
                      </button>
                    </div>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="btn btn-red"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
