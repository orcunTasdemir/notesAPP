import type { Note } from '../types';

const API = '/api/notes';

export const fetchNotes = async (): Promise<Note[]> => {
  const res = await fetch(API);
  return await res.json();
};

export const saveNote = async (note: Note) => {
  await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
};

export const deleteNote = async (id: number) => {
  await fetch(`${API}?id=${id}`, { method: 'DELETE' });
};
