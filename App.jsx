import React, { useEffect, useMemo, useRef, useState } from 'react';

const greetings = [
  'Hello Kumar',
  'Hai Kumar',
  'Welcome Kumar',
  'Good to see you, Kumar',
  'Have a great day, Kumar',
  'Ready to upload, Kumar?',
  'You are doing great, Kumar',
  'Keep going, Kumar',
  'Nice work today, Kumar',
  'Let us start, Kumar',
  'All set, Kumar?',
  'Great energy, Kumar',
  'Happy coding, Kumar',
  'Wishing you success, Kumar',
  'Good morning, Kumar',
  'Good afternoon, Kumar',
  'Good evening, Kumar',
  'You got this, Kumar',
  'Let us build something awesome, Kumar',
  'Welcome back, Kumar'
];

function isPdf(file) {
  const byMime = file.type === 'application/pdf';
  const byExt = file.name.toLowerCase().endsWith('.pdf');
  return byMime || byExt;
}

function readSavedTheme() {
  try {
    return localStorage.getItem('pdf_uploader_theme') === 'dark';
  } catch {
    return false;
  }
}

function saveTheme(isDark) {
  try {
    localStorage.setItem('pdf_uploader_theme', isDark ? 'dark' : 'light');
  } catch {
    // Ignore storage errors and continue with in-memory theme state.
  }
}

async function countPdfPages(file) {
  try {
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(new Uint8Array(buffer));
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return matches ? matches.length : 0;
  } catch {
    return -1;
  }
}

export default function App() {
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [isDark, setIsDark] = useState(readSavedTheme);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [pageCount, setPageCount] = useState('--');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const greetingText = useMemo(() => greetings[greetingIndex], [greetingIndex]);

  useEffect(() => {
    const id = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % greetings.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
    saveTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setPageCount('--');
  };

  const processFile = async (file) => {
    setMessage('');
    setMessageType('');

    if (!file) {
      clearPreview();
      setMessage('Please choose a PDF file.');
      setMessageType('error');
      return;
    }

    if (!isPdf(file)) {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      clearPreview();
      setMessage('Only PDF files are allowed.');
      setMessageType('error');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    setPageCount('counting...');
    const count = await countPdfPages(file);
    setPageCount(count > 0 ? String(count) : 'unknown');

    setMessage(`Selected: ${file.name} (PDF accepted).`);
    setMessageType('ok');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    await processFile(file);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer?.files?.[0];
    if (file && inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
    }
    await processFile(file);
  };

  return (
    <main className="card">
      <div className="top-actions">
        <button
          id="themeToggle"
          className="theme-btn"
          type="button"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title="Switch theme"
          onClick={() => setIsDark((prev) => !prev)}
        >
          {isDark ? '?' : '?'}
        </button>
      </div>

      <h1>Upload Your PDF</h1>
      <p>Choose one file and we will accept only PDF format.</p>
      <div id="greetingBar" className="greeting-bar" aria-live="polite">{greetingText}</div>

      <form id="uploadForm" onSubmit={handleSubmit} noValidate>
        <div
          className={`dropzone ${dragOver ? 'dragover' : ''}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={handleDrop}
        >
          <label htmlFor="pdfFile">Select File</label>
          <p className="hint">Supported format: `.pdf` only</p>
          <input
            id="pdfFile"
            ref={inputRef}
            type="file"
            name="pdf"
            accept="application/pdf,.pdf"
            required
          />
        </div>
        <button type="submit">Upload</button>
        <div id="message" className={messageType} aria-live="polite">{message}</div>
      </form>

      <section id="previewWrap" className="preview-wrap" style={{ display: previewUrl ? 'block' : 'none' }}>
        <div className="preview-head">
          <span>PDF Preview</span>
          <span id="pageCount">Pages: {pageCount}</span>
        </div>
        <iframe id="pdfPreview" title="PDF Preview" src={previewUrl}></iframe>
      </section>
    </main>
  );
}
