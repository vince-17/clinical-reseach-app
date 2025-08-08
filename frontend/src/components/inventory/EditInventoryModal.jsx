import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { X } from 'lucide-react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const zoomIn = keyframes`
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 120ms ease;
  z-index: 50;
`;

const Sheet = styled.div`
  width: min(560px, 92vw);
  max-height: 90vh;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 60px rgba(2, 6, 23, 0.25);
  animation: ${zoomIn} 140ms ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
`;

const Title = styled.div`
  font-weight: 700;
  color: #0f172a;
`;

const Close = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease;
  &:hover { background: #f8fafc; transform: translateY(-1px); }
`;

const Body = styled.div`
  padding: 16px;
  display: grid;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
`;

const Input = styled.input`
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  outline: none;
  transition: border 120ms ease, box-shadow 120ms ease;
  &:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
`;

const Select = styled.select`
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  outline: none;
  transition: border 120ms ease, box-shadow 120ms ease;
  &:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
`;

const Footer = styled.div`
  padding: 14px 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-shrink: 0;
`;

const Button = styled.button`
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease, box-shadow 120ms ease;
  &:hover { background: #f8fafc; transform: translateY(-1px); }
`;

const Primary = styled(Button)`
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
  &:hover { background: #1d4ed8; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
`;

const ErrorText = styled.div`
  font-size: 12px;
  color: #b91c1c;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.6);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: ${spin} 700ms linear infinite;
`;

export default function EditInventoryModal({ open, onClose, onSave, studies = [], item = null }) {
  const [invCode, setInvCode] = useState('');
  const [name, setName] = useState('');
  const [study, setStudy] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [qtyInStock, setQtyInStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [reorderTimeDays, setReorderTimeDays] = useState('');
  const [qtyInReorder, setQtyInReorder] = useState('');
  const [discontinued, setDiscontinued] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const sheetRef = useRef(null);

  // Load item data when modal opens
  useEffect(() => {
    if (open && item) {
      setInvCode(item.inv_code || '');
      setName(item.name || item.item_name || '');
      setStudy(item.study_name || '');
      setExpiresOn(item.expires_on || '');
      setQtyInStock(String(item.qty_in_stock || item.quantity || ''));
      setReorderLevel(String(item.reorder_level || ''));
      setReorderTimeDays(String(item.reorder_time_days || ''));
      setQtyInReorder(String(item.qty_in_reorder || ''));
      setDiscontinued(!!item.discontinued);
      setNotes(item.notes || '');
      setErrors({});
      setSaving(false);
    }
  }, [open, item]);

  // Clear form when modal closes
  useEffect(() => {
    if (!open) {
      setInvCode('');
      setName('');
      setStudy('');
      setExpiresOn('');
      setQtyInStock('');
      setReorderLevel('');
      setReorderTimeDays('');
      setQtyInReorder('');
      setDiscontinued(false);
      setNotes('');
      setErrors({});
      setSaving(false);
    }
  }, [open]);

  const validate = useCallback(() => {
    const next = {};
    if (!name || !String(name).trim()) next.name = 'Name is required';
    if (!study || !String(study).trim()) next.study = 'Study is required';
    const q = Number(qtyInStock || 0);
    if (!Number.isFinite(q) || q < 0) next.qtyInStock = 'Quantity must be 0 or more';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, study, qtyInStock]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const payload = {
        id: item?.id,
        inv_code: invCode || undefined,
        name: String(name || '').trim(),
        item_name: String(name || '').trim(),
        study_name: String(study || '').trim(),
        expires_on: expiresOn || undefined,
        qty_in_stock: Number(qtyInStock || 0),
        quantity: Number(qtyInStock || 0),
        reorder_level: reorderLevel && reorderLevel !== '' ? Number(reorderLevel) : undefined,
        reorder_time_days: reorderTimeDays && reorderTimeDays !== '' ? Number(reorderTimeDays) : undefined,
        qty_in_reorder: qtyInReorder && qtyInReorder !== '' ? Number(qtyInReorder) : undefined,
        discontinued: !!discontinued,
        notes: notes && String(notes).trim() || undefined,
      };
      await onSave?.(payload);
      onClose?.();
    } finally {
      setSaving(false);
    }
  }, [validate, item?.id, invCode, name, study, expiresOn, qtyInStock, reorderLevel, reorderTimeDays, qtyInReorder, discontinued, notes, onSave, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Enter') {
        if (sheetRef.current && sheetRef.current.contains(document.activeElement)) {
          handleSave();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleSave, onClose]);

  if (!open) return null;
  
  return (
    <Overlay onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()} ref={sheetRef}>
        <Header>
          <Title>Edit Inventory Item</Title>
          <Close onClick={onClose} aria-label="Close">
            <X size={18} />
          </Close>
        </Header>
        <Body>
          <Field>
            <Label>Inventory ID (Optional)</Label>
            <Input placeholder="e.g., INV-001" value={invCode} onChange={(e)=>setInvCode(e.target.value)} />
          </Field>

          <Field>
            <Label>Name</Label>
            <Input autoFocus placeholder="e.g., Syringe 5ml" value={name} onChange={(e)=>setName(e.target.value)} />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}
          </Field>

          <Field>
            <Label>Study</Label>
            <Select value={study} onChange={(e) => setStudy(e.target.value)}>
              <option value="">Select a study</option>
              {Array.isArray(studies) && studies.length > 0 && studies.map((s) => {
                if (!s) return null;
                const studyName = s.study_name || s.name || String(s);
                const studyId = s.study_id || '';
                const key = s.id || s.study_id || studyName || Math.random();
                
                return (
                  <option key={key} value={studyName}>
                    {studyName}{studyId ? ` (${studyId})` : ''}
                  </option>
                );
              }).filter(Boolean)}
            </Select>
            {errors.study && <ErrorText>{errors.study}</ErrorText>}
          </Field>

          <Field>
            <Label>Earliest Expiry Date (Optional)</Label>
            <Input type="date" value={expiresOn} onChange={(e)=>setExpiresOn(e.target.value)} />
          </Field>

          <Field>
            <Label>Quantity in stock</Label>
            <Input type="number" min="0" value={qtyInStock} onChange={(e)=>setQtyInStock(e.target.value)} />
            {errors.qtyInStock && <ErrorText>{errors.qtyInStock}</ErrorText>}
          </Field>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field>
              <Label>Reorder level</Label>
              <Input type="number" min="0" value={reorderLevel} onChange={(e)=>setReorderLevel(e.target.value)} />
            </Field>
            <Field>
              <Label>Reorder time (days)</Label>
              <Input type="number" min="0" value={reorderTimeDays} onChange={(e)=>setReorderTimeDays(e.target.value)} />
            </Field>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field>
              <Label>Qty in reorder</Label>
              <Input type="number" min="0" value={qtyInReorder} onChange={(e)=>setQtyInReorder(e.target.value)} />
            </Field>
            <Field>
              <Label>Discontinued?</Label>
              <div style={{ display:'flex', alignItems:'center', gap:8, height: '38px' }}>
                <input id="edit-discontinued" type="checkbox" checked={discontinued} onChange={(e)=>setDiscontinued(e.target.checked)} />
                <label htmlFor="edit-discontinued" style={{ color:'#334155', fontSize: '14px' }}>Yes</label>
              </div>
            </Field>
          </div>

          <Field>
            <Label>Notes (Optional)</Label>
            <textarea rows={2} style={{ resize:'vertical', padding:12, borderRadius:10, border:'1px solid #e2e8f0' }} value={notes} onChange={(e)=>setNotes(e.target.value)} />
          </Field>
        </Body>
        <Footer>
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Primary type="button" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner /> : 'Update'}
          </Primary>
        </Footer>
      </Sheet>
    </Overlay>
  );
}
