import { useEffect, useMemo, useState } from "react";
import {
  health as apiHealth,
  listNotes,
  createNote,
  updateNote,
  removeNote,
  type Note,
  type Health,
} from "./api";
import "./App.css";

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState<string | "ALL">("ALL");
  const [q, setQ] = useState("");

  // minimal create form (can be collapsed if you want)
  const [newTitle, setNewTitle] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [h, ns] = await Promise.all([apiHealth(), listNotes()]);
        setHealth(h);
        setNotes(ns);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const courses = useMemo(() => {
    const s = new Set(notes.map((n) => n.course));
    return ["ALL", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [notes]);

  const filtered = useMemo(() => {
    const hay = (s: string) => s.toLowerCase();
    const qq = hay(q);
    return notes
      .filter((n) => (activeCourse === "ALL" ? true : n.course === activeCourse))
      .filter(
        (n) =>
          !qq ||
          hay(n.title).includes(qq) ||
          hay(n.course).includes(qq) ||
          hay(n.content).includes(qq)
      )
      .sort((a, b) => b.id - a.id);
  }, [notes, activeCourse, q]);

  async function onCreate() {
    if (!newTitle || !newCourse || !newContent) return;
    const created = await createNote({
      title: newTitle,
      course: newCourse,
      content: newContent,
    });
    setNotes((prev) => [created, ...prev]);
    setNewTitle("");
    setNewCourse("");
    setNewContent("");
    setActiveCourse("ALL");
  }

  async function onDelete(n: Note) {
    await removeNote(n.id);
    setNotes((prev) => prev.filter((x) => x.id !== n.id));
  }

  async function onQuickEdit(n: Note, patch: Partial<Pick<Note, "title" | "course" | "content">>) {
    const updated = await updateNote(n.id, patch);
    setNotes((prev) => prev.map((x) => (x.id === n.id ? updated : x)));
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>Class Notes</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes… (title, course, content)"
          className="search"
        />
      </header>

      <main className="layout">
        {/* LEFT: course column */}
        <aside className="left-nav">
          <div className="left-title">Courses</div>
          <ul className="course-list">
            {courses.map((c) => (
              <li
                key={c}
                className={["course-pill", activeCourse === c ? "active" : ""].join(" ")}
                onClick={() => setActiveCourse(c as any)}
                title={c === "ALL" ? "Show all courses" : c}
              >
                {c}
              </li>
            ))}
          </ul>

          {/* small health chip */}
          <div className="health">
            {health ? (
              health.ok ? (
                <span>API ✅</span>
              ) : (
                <span>API ⚠️</span>
              )
            ) : (
              <span>API …</span>
            )}
          </div>
        </aside>

        {/* RIGHT: content */}
        <section className="content">
          {/* create form (optional) */}
          <div className="create">
            <input
              className="in"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={120}
            />
            <input
              className="in"
              placeholder="Course (e.g., ENGL_273)"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              maxLength={32}
            />
            <textarea
              className="in"
              placeholder="Content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              maxLength={5000}
              rows={3}
            />
            <button className="btn" onClick={onCreate}>
              Add Note
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No notes match your filters.</div>
          ) : (
            <ul className="notes">
              {filtered.map((n) => (
                <li key={n.id} className="note-card" tabIndex={0}>
                  <div className="note-title">{n.title}</div>
                  <div className="note-meta">
                    {n.course} • {new Date(n.createdAt).toLocaleString()}
                  </div>
                  <div className="note-body">{n.content}</div>
                  <div className="note-actions">
                    <button
                      className="btn subtle"
                      onClick={() => onQuickEdit(n, { title: n.title + " (edited)" })}
                      title="Quick edit title (demo)"
                    >
                      Edit
                    </button>
                    <button className="btn danger" onClick={() => onDelete(n)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="foot">© {new Date().getFullYear()} StudyLink</footer>
    </div>
  );
}
