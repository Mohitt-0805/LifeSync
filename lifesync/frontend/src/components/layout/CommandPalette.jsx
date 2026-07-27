import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalSearchQuery } from "../../features/dashboard/dashboardApi";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckSquare, Target, FileText, Calendar, X } from "lucide-react";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const { data: searchRes, isFetching } = useGlobalSearchQuery(debouncedQuery, {
    skip: !debouncedQuery,
  });

  // Listen to Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    const handleOpenEvent = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-global-search", handleOpenEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-global-search", handleOpenEvent);
    };
  }, []);

  const handleSelectResult = (path) => {
    setIsOpen(false);
    setQuery("");
    navigate(path);
  };

  const results = searchRes?.data || { tasks: [], goals: [], notes: [], events: [] };
  const hasResults =
    results.tasks?.length > 0 ||
    results.goals?.length > 0 ||
    results.notes?.length > 0 ||
    results.events?.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black"
          />

          {/* Dialog content */}
          <motion.div
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-2xl bg-white dark:bg-navy-900 border-4 border-black dark:border-white rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] z-10"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3 border-b-4 border-black dark:border-white px-4 py-3 bg-cream-light dark:bg-navy-950/20">
              <Search size={22} className="text-gray-500 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search dashboard (Tasks, Goals, Notes, Calendar)..."
                className="flex-1 bg-transparent border-none outline-none font-heading font-bold text-base text-black dark:text-white placeholder-gray-400"
                autoFocus
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 border border-black dark:border-white rounded-lg hover:bg-cream-dark dark:hover:bg-navy-800"
              >
                <X size={14} />
              </button>
            </div>

            {/* Results Grid */}
            <div className="max-h-[50vh] overflow-y-auto p-4 space-y-4">
              {isFetching ? (
                <div className="text-center py-6 text-sm font-heading font-bold text-gray-500 animate-pulse">
                  Searching database...
                </div>
              ) : !debouncedQuery ? (
                <div className="text-center py-8 text-xs text-gray-400 font-heading font-bold uppercase">
                  Start typing to find tasks, goals, events, or notes
                </div>
              ) : !hasResults ? (
                <div className="text-center py-8 text-sm font-heading font-bold text-gray-500">
                  No matching results found for "{query}"
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tasks */}
                  {results.tasks?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-heading font-bold text-candy-tasks uppercase tracking-wider mb-2">
                        Tasks
                      </h4>
                      <div className="space-y-1">
                        {results.tasks.map((task) => (
                          <div
                            key={task._id}
                            onClick={() => handleSelectResult("/tasks")}
                            className="flex items-center gap-3 p-2 bg-cream-light hover:bg-candy-tasks/15 rounded-xl border border-transparent hover:border-black cursor-pointer dark:bg-navy-950/20"
                          >
                            <CheckSquare size={16} className="text-candy-tasks" />
                            <span className="text-xs font-bold truncate">{task.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Goals */}
                  {results.goals?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-heading font-bold text-candy-goals uppercase tracking-wider mb-2">
                        Goals
                      </h4>
                      <div className="space-y-1">
                        {results.goals.map((goal) => (
                          <div
                            key={goal._id}
                            onClick={() => handleSelectResult("/goals")}
                            className="flex items-center gap-3 p-2 bg-cream-light hover:bg-candy-goals/15 rounded-xl border border-transparent hover:border-black cursor-pointer dark:bg-navy-950/20"
                          >
                            <Target size={16} className="text-candy-goals" />
                            <span className="text-xs font-bold truncate">{goal.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {results.notes?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-heading font-bold text-candy-notes uppercase tracking-wider mb-2">
                        Notes
                      </h4>
                      <div className="space-y-1">
                        {results.notes.map((note) => (
                          <div
                            key={note._id}
                            onClick={() => handleSelectResult("/notes")}
                            className="flex items-center gap-3 p-2 bg-cream-light hover:bg-candy-notes/15 rounded-xl border border-transparent hover:border-black cursor-pointer dark:bg-navy-950/20"
                          >
                            <FileText size={16} className="text-candy-notes" />
                            <span className="text-xs font-bold truncate">{note.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events */}
                  {results.events?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-heading font-bold text-candy-calendar uppercase tracking-wider mb-2">
                        Events
                      </h4>
                      <div className="space-y-1">
                        {results.events.map((evt) => (
                          <div
                            key={evt._id}
                            onClick={() => handleSelectResult("/calendar")}
                            className="flex items-center gap-3 p-2 bg-cream-light hover:bg-candy-calendar/15 rounded-xl border border-transparent hover:border-black cursor-pointer dark:bg-navy-950/20"
                          >
                            <Calendar size={16} className="text-candy-calendar" />
                            <span className="text-xs font-bold truncate">{evt.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
