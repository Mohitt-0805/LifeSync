import React, { useState, useEffect } from "react";
import {
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} from "./notesApi";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Dropdown } from "../../components/ui/Dropdown";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { Folder, Pin, Plus, Search, Star, Trash2, FileText, Save, Tag } from "lucide-react";

export default function Notes() {
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("");

  // Editor states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folder, setFolder] = useState("General");
  const [tagsInput, setTagsInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  // Queries & Mutations
  const { data: notesRes, isLoading } = useGetNotesQuery({
    folder: folderFilter || undefined,
    search: searchQuery || undefined,
  });

  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
  const [updateNote, { isLoading: isSaving }] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  const notesList = notesRes?.data?.notes || [];
  const foldersList = notesRes?.data?.folders || [];

  const selectedNote = notesList.find((note) => note._id === selectedNoteId);

  // Sync editor fields with selected note
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content || "");
      setFolder(selectedNote.folder || "General");
      setTagsInput(selectedNote.tags?.join(", ") || "");
      setIsPinned(selectedNote.isPinned || false);
    } else if (notesList.length > 0 && !selectedNoteId) {
      // Auto-select first note if none selected
      setSelectedNoteId(notesList[0]._id);
    }
  }, [selectedNoteId, selectedNote, notesList]);

  const handleCreateNote = async () => {
    try {
      const res = await createNote({
        title: "Untitled Note",
        content: "",
        folder: folderFilter || "General",
        tags: [],
      }).unwrap();
      setSelectedNoteId(res.data._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNoteId) return;
    const tags = tagsInput
      ? tagsInput.split(",").map((t) => t.trim()).filter((t) => t)
      : [];

    try {
      await updateNote({
        id: selectedNoteId,
        title,
        content,
        folder,
        tags,
        isPinned,
      }).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePin = async () => {
    if (!selectedNoteId) return;
    const nextPinState = !isPinned;
    setIsPinned(nextPinState);
    try {
      await updateNote({
        id: selectedNoteId,
        isPinned: nextPinState,
      }).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNoteId) return;
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote(selectedNoteId).unwrap();
        setSelectedNoteId(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-heading font-bold text-candy-notes">Notes Workspace</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Jot down ideas, organize folders, and search key thoughts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Sidebar list */}
        <Card hoverable={false} className="lg:col-span-1 p-4 bg-white dark:bg-navy-900 border-2 border-black flex flex-col gap-4">
          <div className="flex gap-2 items-center justify-between">
            <h2 className="text-lg font-heading font-bold">My Notes</h2>
            <button
              onClick={handleCreateNote}
              className="p-1.5 border-2 border-black dark:border-white rounded-xl bg-candy-notes text-white hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search titles or text..."
            />
          </div>

          {/* Folder tabs filter list */}
          <div className="flex flex-wrap gap-1.5 border-b-2 border-black dark:border-white/20 pb-3">
            <button
              onClick={() => setFolderFilter("")}
              className={`px-2.5 py-1 text-xs font-heading font-bold border-2 rounded-xl transition-all ${
                folderFilter === ""
                  ? "bg-black text-white dark:bg-white dark:text-black border-black"
                  : "bg-transparent border-transparent hover:bg-cream-dark dark:hover:bg-navy-800"
              }`}
            >
              All
            </button>
            {foldersList.map((fld) => (
              <button
                key={fld}
                onClick={() => setFolderFilter(fld)}
                className={`px-2.5 py-1 text-xs font-heading font-bold border-2 rounded-xl capitalize transition-all ${
                  folderFilter === fld
                    ? "bg-black text-white dark:bg-white dark:text-black border-black"
                    : "bg-transparent border-transparent hover:bg-cream-dark dark:hover:bg-navy-800"
                }`}
              >
                {fld}
              </button>
            ))}
          </div>

          {/* List of notes */}
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12" variant="text" />
              <Skeleton className="h-12" variant="text" />
            </div>
          ) : notesList.length === 0 ? (
            <div className="text-center py-6 text-gray-400 italic text-xs">
              No notes found. Create a new one!
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {notesList.map((note) => (
                <div
                  key={note._id}
                  onClick={() => setSelectedNoteId(note._id)}
                  className={`p-3 border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-all spring-transition ${
                    selectedNoteId === note._id
                      ? "bg-cream-dark border-black dark:bg-navy-800 dark:border-white"
                      : "bg-white border-transparent hover:bg-cream-light dark:bg-navy-950 dark:hover:bg-navy-850"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {note.isPinned && <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                      <span className="font-heading font-bold text-sm truncate block">
                        {note.title || "Untitled"}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-0.5 capitalize">
                      {note.folder} • {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <FileText size={16} className="text-gray-400 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right Side: Note editor details */}
        <Card hoverable={false} className="lg:col-span-2 p-6 bg-white dark:bg-navy-900 border-2 border-black min-h-[450px] flex flex-col">
          {selectedNote ? (
            <div className="flex-1 flex flex-col gap-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black dark:border-white/20 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePin}
                    className={`p-2 border-2 border-black dark:border-white rounded-xl hover:scale-105 active:scale-95 transition-transform ${
                      isPinned ? "bg-yellow-300 text-black" : "bg-transparent"
                    }`}
                    title={isPinned ? "Unpin Note" : "Pin Note"}
                  >
                    <Star size={16} className={isPinned ? "fill-yellow-500" : ""} />
                  </button>

                  <Dropdown
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    options={[
                      { label: "General", value: "General" },
                      { label: "Work", value: "Work" },
                      { label: "Personal", value: "Personal" },
                      { label: "Drafts", value: "Drafts" },
                    ]}
                    className="w-32 py-1.5"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDeleteNote} className="flex items-center gap-1.5">
                    <Trash2 size={16} />
                    Delete
                  </Button>
                  <Button onClick={handleSaveNote} loading={isSaving} className="flex items-center gap-1.5">
                    <Save size={16} />
                    Save
                  </Button>
                </div>
              </div>

              {/* Title & tags */}
              <div className="space-y-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title"
                  className="w-full text-3xl font-heading font-bold bg-transparent outline-none text-navy-900 dark:text-white border-b-2 border-transparent focus:border-brand/40 pb-1"
                />

                <div className="flex items-center gap-2 text-xs">
                  <Tag size={14} className="text-gray-400" />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Add tags, separated by commas..."
                    className="flex-1 bg-transparent outline-none text-gray-500 dark:text-gray-300"
                  />
                </div>

                {/* Display tags */}
                {selectedNote.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedNote.tags.map((tg) => (
                      <span
                        key={tg}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-navy-800 border border-black/10 rounded text-[10px]"
                      >
                        {tg}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Text editor body */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing ideas here..."
                className="flex-1 w-full bg-cream-light dark:bg-navy-950/40 border-2 border-black dark:border-white p-4 rounded-2xl outline-none font-body text-sm resize-none focus:ring-2 focus:ring-brand"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <FileText size={48} className="text-gray-300 dark:text-gray-700 mb-2" />
              <h3 className="font-heading font-bold text-lg">No note selected</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mt-1">
                Select an existing note from the sidebar panel or create a new one to begin editing.
              </p>
              <Button onClick={handleCreateNote} className="mt-4">
                Create Note
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
