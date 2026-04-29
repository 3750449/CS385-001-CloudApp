// src/api.ts
export type Health = { ok: boolean; service: string; timestamp: string };
export type Note = {
  id: number;
  title: string;
  course: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  edits?: number;
};

const BASE =
  (typeof window !== "undefined" && (window as any).__VITE_API_URL__) ||
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8199`;

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export async function health(): Promise<Health> {
  const res = await fetch(`${BASE}/api/health`);
  return j<Health>(res);
}

export async function listNotes(course?: string): Promise<Note[]> {
  const url = new URL(`${BASE}/api/notes`);
  if (course) url.searchParams.set("course", course);
  const res = await fetch(url);
  return j<Note[]>(res);
}

export async function createNote(n: {
  title: string;
  course: string;
  content: string;
}): Promise<Note> {
  const res = await fetch(`${BASE}/api/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(n),
  });
  return j<Note>(res);
}

export async function updateNote(
  id: number,
  patch: Partial<Pick<Note, "title" | "course" | "content">>
): Promise<Note> {
  const res = await fetch(`${BASE}/api/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return j<Note>(res);
}

export async function removeNote(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/notes/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Delete failed");
}

export async function importNotes(): Promise<{ imported: number } & { notes: Note[] }> {
  const res = await fetch(`${BASE}/api/notes/import`, { method: "POST" });
  return j(res);
}
