'use client';

import { useState, useEffect } from 'react';
import { ref, update, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import currentMonthData from '@/content/monthly/current-month.json';

interface SessionMetaEditorProps {
  sessionId: string;
}

export function SessionMetaEditor({ sessionId }: SessionMetaEditorProps) {
  const [country, setCountry] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [zoomLink, setZoomLink] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // 1. Fetch from Firebase on initial load
  useEffect(() => {
    if (!sessionId) return;

    async function loadFirebaseData() {
      setIsLoading(true);
      try {
        const sessionRef = ref(db, `sessions/${sessionId}`);
        const snapshot = await get(sessionRef);

        if (snapshot.exists() && snapshot.val()?.featuredBook) {
          const data = snapshot.val();
          setCountry(data.featuredCountry || '');
          setBookTitle(data.featuredBook || '');
          setAuthor(data.featuredAuthor || '');
          setZoomLink(data.meetingZoomLink || '');
        } else {
          // If session in DB is empty, pre-fill inputs with JSON data automatically
          populateFromJSON();
        }
      } catch (err) {
        console.error('Failed to read from Firebase:', err);
        populateFromJSON();
      } finally {
        setIsLoading(false);
      }
    }

    loadFirebaseData();
  }, [sessionId]);

  // Helper to load values straight from current-month.json
  const populateFromJSON = () => {
    setCountry(currentMonthData.country || '');
    setBookTitle(currentMonthData.bookTitle || '');
    setAuthor(currentMonthData.author || '');
    setZoomLink(currentMonthData.meetingZoomLink || '');
  };

  // 2. Save changes to Realtime Database
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    try {
      await update(ref(db, `sessions/${sessionId}`), {
        featuredCountry: country,
        featuredBook: bookTitle,
        featuredAuthor: author,
        meetingZoomLink: zoomLink,
      });
      setSaveMessage('Session details updated live!');
    } catch (error) {
      console.error('Failed to update session meta:', error);
      setSaveMessage('Error updating details.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm max-w-lg animate-pulse text-sm text-muted">
        Loading session metadata...
      </div>
    );
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm space-y-4 max-w-lg">
      <div className="flex items-center justify-between border-b border-card-border pb-3">
        <h3 className="text-lg font-bold text-primary">📚 Monthly Book & Session Meta</h3>
        <button
          type="button"
          onClick={populateFromJSON}
          className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1"
        >
          <span>📥</span> Load from JSON File
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-3 text-sm">
        <div>
          <label className="block text-xs font-bold text-muted mb-1">Featured Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Georgia"
            className="w-full p-2.5 rounded-xl border border-card-border bg-main text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-1">Book Title</label>
          <input
            type="text"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="e.g. The Lack of Light"
            className="w-full p-2.5 rounded-xl border border-card-border bg-main text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-1">Author Name</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Nino Haratischwili"
            className="w-full p-2.5 rounded-xl border border-card-border bg-main text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-1">Zoom Meeting Link</label>
          <input
            type="url"
            value={zoomLink}
            onChange={(e) => setZoomLink(e.target.value)}
            placeholder="https://zoom.us/..."
            className="w-full p-2.5 rounded-xl border border-card-border bg-main text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-brand-accent text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Update Session Data'}
          </button>
          {saveMessage && <span className="text-xs font-bold text-emerald-600">{saveMessage}</span>}
        </div>
      </form>
    </div>
  );
}