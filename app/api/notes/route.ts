import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Note } from '../../../types';

const filePath = path.join(process.cwd(), 'notes.json');

async function readNotes(): Promise<Note[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeNotes(notes: Note[]) {
  await fs.writeFile(filePath, JSON.stringify(notes, null, 2));
}

export async function GET() {
  const notes = await readNotes();
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const notes = await readNotes();
  const note: Note = await req.json();

  const index = notes.findIndex(n => n.id === note.id);
  if (index !== -1) {
    notes[index] = note; // update existing
  } else {
    notes.push(note); // add new
  }

  await writeNotes(notes);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const idParam = url.searchParams.get('id');
  if (!idParam) return NextResponse.json({ success: false }, { status: 400 });

  const id = Number(idParam);
  let notes = await readNotes();
  notes = notes.filter(n => n.id !== id);
  await writeNotes(notes);

  return NextResponse.json({ success: true });
}
