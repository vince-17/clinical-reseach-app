import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { FileUp } from 'lucide-react';

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease;
  &:hover { background: #f8fafc; transform: translateY(-1px); }
`;

export default function ImportExcelButton({ token, onImported }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  function openPicker() { inputRef.current?.click(); }

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/basic/inventory/import', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.error || 'Import failed');
      }
      onImported?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={onPick} />
      <Btn type="button" onClick={openPicker} disabled={busy}>
        <FileUp size={16} />
        {busy ? 'Importing…' : 'Import Excel'}
      </Btn>
    </>
  );
}


