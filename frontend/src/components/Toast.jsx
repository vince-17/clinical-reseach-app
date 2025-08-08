import { useEffect } from 'react';

export function Toast({ message, type = 'info', onDone, duration = 2000 }) {
  useEffect(() => {
    const id = setTimeout(onDone, duration);
    return () => clearTimeout(id);
  }, [onDone, duration]);
  if (!message) return null;
  const bg = type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#e0f2fe';
  const fg = '#0f172a';
  return (
    <div style={{ position:'fixed', bottom:16, right:16, background:bg, color:fg, border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px', boxShadow:'0 6px 16px rgba(0,0,0,0.12)', zIndex:1000 }}>
      {message}
    </div>
  );
}


