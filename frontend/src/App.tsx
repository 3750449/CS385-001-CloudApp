import { useEffect, useMemo, useState } from "react";
import { useOktaAuth } from "@okta/okta-react";
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
  const { oktaAuth, authState } = useOktaAuth();

  // 🔐 LOGIN SCREEN
  if (!authState || !authState.isAuthenticated) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Login Required</h2>
        <button
          onClick={async () => {
            console.log("Okta login clicked");
            await oktaAuth.signInWithRedirect({ originalUri: "/" });
          }}
        >
          Login with Okta
        </button>
      </div>
    );
  }

  // 👉 Render main app AFTER login
  return <MainApp oktaAuth={oktaAuth} />;
}

/* ========================= */
/* ✅ REAL APP (after login) */
/* ========================= */

function MainApp({ oktaAuth }: any) {
  const [health, setHealth] = useState<Health | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState<string | "ALL">("ALL");
  const [q, setQ] = useState("");

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

  async function onQuickEdit(
    n: Note,
    patch: Partial<Pick<Note, "title" | "course" | "content">>
  ) {
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
          placeholder="Search notes…"
          className="search"
        />

        <button
          className="btn subtle"
          onClick={() => oktaAuth.signOut()}
        >
          Logout
        </button>
      </header>

      <main className="layout">
        <aside className="left-nav">
          <div className="left-title">Courses</div>

          <ul className="course-list">
            {courses.map((c) => (
              <li
                key={c}
                className={[
                  "course-pill",
                  activeCourse === c ? "active" : "",
                ].join(" ")}
                onClick={() => setActiveCourse(c as any)}
              >
                {c}
              </li>
            ))}
          </ul>

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

        <section className="content">
          <div className="create">
            <input
              className="in"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <input
              className="in"
              placeholder="Course"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
            />

            <textarea
              className="in"
              placeholder="Content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
            />

            <button className="btn" onClick={onCreate}>
              Add Note
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No notes found.</div>
          ) : (
            <ul className="notes">
              {filtered.map((n) => (
                <li key={n.id} className="note-card">
                  <div className="note-title">{n.title}</div>

                  <div className="note-meta">
                    {n.course} • {new Date(n.createdAt).toLocaleString()}
                  </div>

                  <div className="note-body">{n.content}</div>

                  <div className="note-actions">

	<button
	  className="btn subtle"
	  onClick={async () => {
	    const title = window.prompt("Edit title:", n.title);
	    if (title === null) return;

	    const course = window.prompt("Edit course:", n.course);
	    if (course === null) return;

	    const content = window.prompt("Edit content:", n.content);
	    if (content === null) return;

	    await onQuickEdit(n, { title, course, content });
	  }}
	>
	  Edit
	</button>

                    <button
                      className="btn danger"
                      onClick={() => onDelete(n)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="foot">
        © {new Date().getFullYear()} StudyLink
      </footer>
    </div>
  );
}
