// src/api.ts

export type Health = {
  ok: boolean;
  service: string;
  timestamp: string;
};

export type Note = {
  id: number;
  title: string;
  course: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  edits?: number;
  authorEmail?: string;
  fileUrl?: string;
  fileName?: string;
};

export type Profile = {
  email: string;
  name?: string;
  contactInfo?: string;
  about?: string;
  photoUrl?: string;
  updatedAt?: string;
};

const BASE = "https://cs385-001-cloudapp-production.up.railway.app";

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function health(): Promise<Health> {
  const res = await fetch(`${BASE}/api/health`);
  return j<Health>(res);
}

export async function listNotes(): Promise<Note[]> {
  const res = await fetch(`${BASE}/api/notes`);
  return j<Note[]>(res);
}

export async function createNote(n: {
  title: string;
  course: string;
  content: string;
  authorEmail?: string;
  fileUrl?: string;
  fileName?: string;
}): Promise<Note> {
  const res = await fetch(`${BASE}/api/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });

  return j<Note>(res);
}

export async function removeNote(id: number, email: string): Promise<void> {
  const url = new URL(`${BASE}/api/notes/${id}`);
  url.searchParams.set("email", email);

  const res = await fetch(url, {
    method: "DELETE",
  });

  if (!res.ok && res.status !== 204) {
    throw new Error("Delete failed");
  }
}

export async function getProfile(email: string): Promise<Profile | null> {
  const url = new URL(`${BASE}/api/profile`);
  url.searchParams.set("email", email);

  const res = await fetch(url);
  return j<Profile | null>(res);
}

export async function saveProfile(p: Profile): Promise<Profile> {
  const res = await fetch(`${BASE}/api/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(p),
  });

  return j<Profile>(res);
}
