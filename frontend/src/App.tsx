import { useEffect, useMemo, useState } from "react";
import { useOktaAuth } from "@okta/okta-react";

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth, googleProvider } from "./firebase";
import { supabase } from "./supabase";

import {
  health as apiHealth,
  listNotes,
  createNote,
  updateNote,
  removeNote,
  getProfile,
  saveProfile,
  type Note,
  type Health,
  type Profile,
} from "./api";

import "./App.css";

export default function App() {
  const { authState } = useOktaAuth();

  const [googleUser, setGoogleUser] = useState<User | null>(null);

  const ADMIN_EMAILS = ["3750449@gmail.com"];

  const isAdmin = googleUser?.email
    ? ADMIN_EMAILS.includes(googleUser.email)
    : false;

  const [activePage, setActivePage] =
    useState<"notes" | "files" | "about" | "settings">("notes");


  const [health, setHealth] = useState<Health | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState<string | "ALL">("ALL");
  const [activeAuthor, setActiveAuthor] = useState<string | "ALL">("ALL");
  const [q, setQ] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

const [editingId, setEditingId] = useState<number | null>(null);
const [editTitle, setEditTitle] = useState("");
const [editCourse, setEditCourse] = useState("");
const [editContent, setEditContent] = useState("");

const [profile, setProfile] = useState<Profile | null>(null);
const [profileName, setProfileName] = useState("");
const [profileContact, setProfileContact] = useState("");
const [profileAbout, setProfileAbout] = useState("");
const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setGoogleUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authState?.isAuthenticated && !googleUser) return;

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
  }, [authState?.isAuthenticated, googleUser]);

useEffect(() => {
  if (!googleUser?.email) return;

  (async () => {
    try {
      const p = await getProfile(googleUser.email);

      setProfile(p);

      setProfileName(p?.name || googleUser.displayName || "");
      setProfileContact(p?.contactInfo || googleUser.email || "");
      setProfileAbout(p?.about || "Student using StudyLink.");
    } catch (e) {
      console.error(e);

      setProfileName(googleUser.displayName || "");
      setProfileContact(googleUser.email || "");
      setProfileAbout("Student using StudyLink.");
    }
  })();
}, [googleUser]);

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logoutGoogle() {
    await signOut(auth);
  }

  async function loginWithOkta() {
    await oktaAuth.signInWithRedirect({ originalUri: "/" });
  }

  async function logoutOkta() {
    await oktaAuth.signOut();
  }

async function onSaveProfile() {
  if (!googleUser?.email) return;

  setSavingProfile(true);

  try {
    let photoUrl = profile?.photoUrl || googleUser.photoURL || "";

    if (profilePhotoFile) {
      const safeName = profilePhotoFile.name.replaceAll(" ", "-");
      const path = `profiles/${googleUser.email}/${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from("Studylink-files")
        .upload(path, profilePhotoFile);

      if (error) {
        console.error(error);
        alert("Profile photo upload failed");
        return;
      }

      const { data } = supabase.storage
        .from("Studylink-files")
        .getPublicUrl(path);

      photoUrl = data.publicUrl;
    }

    const saved = await saveProfile({
      email: googleUser.email,
      name: profileName,
      contactInfo: profileContact,
      about: profileAbout,
      photoUrl,
    });

    setProfile(saved);
    setProfilePhotoFile(null);
    alert("Profile saved");
  } finally {
    setSavingProfile(false);
  }
}

  const courses = useMemo(() => {
    const s = new Set(notes.map((n) => n.course));
    return ["ALL", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [notes]);

  const authors = useMemo(() => {
    const s = new Set(notes.map((n) => n.authorEmail || "Unknown User"));

    return ["ALL", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [notes]);

  const filtered = useMemo(() => {
    const hay = (s: string) => s.toLowerCase();
    const qq = hay(q);

    return notes
      .filter((n) =>
        activeCourse === "ALL" ? true : n.course === activeCourse
      )
      .filter((n) =>
        activeAuthor === "ALL"
          ? true
          : (n.authorEmail || "Unknown User") === activeAuthor
      )
      .filter(
        (n) =>
          !qq ||
          hay(n.title).includes(qq) ||
          hay(n.course).includes(qq) ||
          hay(n.content).includes(qq) ||
          hay(n.authorEmail || "").includes(qq) ||
          hay(n.fileName || "").includes(qq)
      )
      .sort((a, b) => b.id - a.id);
  }, [notes, activeCourse, activeAuthor, q]);

  const files = useMemo(() => {
    return notes
      .filter((n) => n.fileUrl)
      .sort((a, b) => b.id - a.id);
  }, [notes]);

  async function onCreate() {
    if (!newTitle || !newCourse || !newContent) return;

    setUploading(true);

    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;

      if (selectedFile && googleUser?.email) {
        const safeName = selectedFile.name.replaceAll(" ", "-");
        const path = `${googleUser.email}/${Date.now()}-${safeName}`;

        const { error } = await supabase.storage
          .from("Studylink-files")
          .upload(path, selectedFile);

        if (error) {
          console.error(error);
          alert("File upload failed");
          return;
        }

        const { data } = supabase.storage
          .from("Studylink-files")
          .getPublicUrl(path);

        fileUrl = data.publicUrl;
        fileName = selectedFile.name;
      }

      const created = await createNote({
        title: newTitle,
        course: newCourse,
        content: newContent,
        authorEmail: googleUser?.email ?? "unknown",
        fileUrl,
        fileName,
      });

      setNotes((prev) => [created, ...prev]);

      setNewTitle("");
      setNewCourse("");
      setNewContent("");
      setSelectedFile(null);
      setActiveCourse("ALL");
      setActiveAuthor("ALL");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(n: Note) {
    await removeNote(n.id, googleUser?.email || "");
    setNotes((prev) => prev.filter((x) => x.id !== n.id));
  }

  async function onQuickEdit(
    n: Note,
    patch: Partial<Pick<Note, "title" | "course" | "content">>
  ) {
    const updated = await updateNote(n.id, patch);
    setNotes((prev) => prev.map((x) => (x.id === n.id ? updated : x)));
  }

  function canModify(n: Note) {
    return isAdmin || n.authorEmail === googleUser?.email;
  }

  if (!authState?.isAuthenticated && !googleUser) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Login Required</h2>

        <button onClick={loginWithOkta}>Login with Okta</button>

        <br />
        <br />

        <button onClick={loginWithGoogle}>Login with Google</button>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>Class Notes</h1>

        <nav className="tabs">
          <button
            className="btn subtle"
            onClick={() => setActivePage("notes")}
          >
            Notes
          </button>

          <button
            className="btn subtle"
            onClick={() => setActivePage("files")}
          >
            Files
          </button>

          <button
            className="btn subtle"
            onClick={() => setActivePage("about")}
          >
            About
          </button>

          <button
            className="btn subtle"
            onClick={() => setActivePage("settings")}
          >
           Settings
          </button>

        </nav>

        {isAdmin && <span className="admin-badge">Admin</span>}

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes..."
          className="search"
        />

        {googleUser && (
          <button className="btn subtle" onClick={logoutGoogle}>
            Logout Google
          </button>
        )}

        {authState?.isAuthenticated && (
          <button className="btn subtle" onClick={logoutOkta}>
            Logout Okta
          </button>
        )}
      </header>

      {activePage === "notes" && (
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

            <div className="left-title" style={{ marginTop: "1rem" }}>
              Authors
            </div>

            <ul className="course-list">
              {authors.map((a) => (
                <li
                  key={a}
                  className={[
                    "course-pill",
                    activeAuthor === a ? "active" : "",
                  ].join(" ")}
                  onClick={() => setActiveAuthor(a as any)}
                >
                  {a}
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

              <input
                className="in"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />

              <button
                className="btn"
                onClick={onCreate}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Add Note"}
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
                      {n.course} • {n.authorEmail || "Unknown User"} •{" "}
                      {new Date(n.createdAt).toLocaleString()}
                    </div>

                    <div className="note-body">{n.content}</div>

                    {n.fileUrl && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <a href={n.fileUrl} target="_blank" rel="noreferrer">
                          📎 {n.fileName || "Attached file"}
                        </a>
                      </div>
                    )}

{editingId === n.id && (
  <div className="edit-box">
    <input
      className="in"
      value={editTitle}
      onChange={(e) => setEditTitle(e.target.value)}
      placeholder="Edit title"
    />

    <input
      className="in"
      value={editCourse}
      onChange={(e) => setEditCourse(e.target.value)}
      placeholder="Edit course"
    />

    <textarea
      className="in"
      value={editContent}
      onChange={(e) => setEditContent(e.target.value)}
      rows={4}
      placeholder="Edit content"
    />

    <div className="note-actions">
      <button
        className="btn"
        onClick={async () => {
          const updated = await updateNote(n.id, {
            title: editTitle,
            course: editCourse,
            content: editContent,
          });

          setNotes((prev) =>
            prev.map((x) => (x.id === n.id ? updated : x))
          );

          setEditingId(null);
        }}
      >
        Save
      </button>

      <button
        className="btn subtle"
        onClick={() => setEditingId(null)}
      >
        Cancel
      </button>
    </div>
  </div>
)}


<div className="note-actions">
  {canModify(n) && editingId !== n.id && (
    <>
      <button
        className="btn subtle"
        onClick={() => {
          setEditingId(n.id);
          setEditTitle(n.title);
          setEditCourse(n.course);
          setEditContent(n.content);
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
    </>
  )}


                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      )}

      {activePage === "files" && (
        <main className="content">
          <h2>Files</h2>

          {files.length === 0 ? (
            <div className="empty">No files uploaded yet.</div>
          ) : (
            <ul className="notes">
              {files.map((n) => (
                <li key={n.id} className="note-card">
                  <div className="note-title">
                    {n.fileName || "Attached file"}
                  </div>

                  <div className="note-meta">
                    {n.course} • {n.authorEmail || "Unknown User"} •{" "}
                    {new Date(n.createdAt).toLocaleString()}
                  </div>

                  <div className="note-body">
                    Attached to note: {n.title}
                  </div>

                  <a href={n.fileUrl} target="_blank" rel="noreferrer">
                    Open file
                  </a>
                </li>
              ))}
            </ul>
          )}
        </main>
      )}

{activePage === "about" && (
  <main className="content">
    <h2>About StudyLink</h2>

    <p>
      StudyLink is a multi-cloud storage and authentication web application
      designed to help students organize, share, and find course materials more
      easily.
    </p>

    <ul>
      <li>
        Notes and study materials are scattered across chats and personal
        drives.
      </li>

      <li>
        Reliable, course-matched resources can be hard to find quickly.
      </li>

      <li>
        Collaboration friction wastes time and can lower student outcomes.
      </li>
    </ul>

    <p>
      Users can sign in, create notes, upload attachments, filter by course,
      and view shared class materials. The target users are college students
      in medium to large classes, as well as TAs and instructors who want a
      lightweight website hub for sharing access with students from anywhere.
    </p>

    <p>
      StudyLink provides one hub to upload, search, and manage course-tagged
      notes. Users can filter by course, author, or text to quickly locate the
      information they need. Authors can also edit their own posts after
      publishing, making it easy to fix mistakes.
    </p>

    <p>
      The application supports Google-based authentication through Firebase,
      cloud-hosted APIs through Railway, PostgreSQL-backed note storage, and
      Supabase cloud file uploads for attachments and shared study resources.
    </p>
  </main>
)}

{activePage === "settings" && (
  <main className="settings-page">
    <h2>Settings</h2>


<section className="settings-card note-card">
  <h3>Account</h3>

  <div className="profile-row">
    <div className="profile-avatar">
      {profile?.photoUrl || googleUser?.photoURL ? (
        <img
          src={profile?.photoUrl || googleUser?.photoURL || ""}
          alt="Profile"
        />
      ) : (
        <span>👤</span>
      )}
    </div>

    <div className="profile-fields">
      <label>Name</label>
      <input
        className="in"
        placeholder="Name"
        value={profileName}
        onChange={(e) => setProfileName(e.target.value)}
      />

      <label>Contact Info</label>
      <input
        className="in"
        placeholder="Contact email"
        value={profileContact}
        onChange={(e) => setProfileContact(e.target.value)}
      />

      <label>About</label>
      <textarea
        className="in"
        placeholder="About"
        rows={4}
        value={profileAbout}
        onChange={(e) => setProfileAbout(e.target.value)}
      />

      <label>Profile Photo</label>
      <input
        className="in"
        type="file"
        accept="image/*"
        onChange={(e) => setProfilePhotoFile(e.target.files?.[0] ?? null)}
      />

      <button className="btn" onClick={onSaveProfile} disabled={savingProfile}>
        {savingProfile ? "Saving..." : "Save Profile"}
      </button>
    </div>
  </div>
</section>


    <section className="settings-card">
      <h3>System Status</h3>

      <div className="status-list">
        <div>Auth: {googleUser ? "Online ✅" : "Offline ⚠️"}</div>
        <div>Storage: {health?.ok ? "Online ✅" : "Offline ⚠️"}</div>
        <div>Security: {health?.ok ? "Online ✅" : "Offline ⚠️"}</div>
      </div>
    </section>
  </main>
)}

      <footer className="foot">
        © {new Date().getFullYear()} StudyLink
      </footer>
    </div>
  );
}

