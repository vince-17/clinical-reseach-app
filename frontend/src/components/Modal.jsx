export default function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, width:520, maxWidth:'90%', boxShadow:'0 10px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <strong>{title}</strong>
          <button onClick={onClose} className="btn" style={{ padding:'4px 8px' }}>Close</button>
        </div>
        <div style={{ padding:16 }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding:12, borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'flex-end', gap:8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}


