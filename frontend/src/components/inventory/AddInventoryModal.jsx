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
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 60px rgba(2, 6, 23, 0.25);
  animation: ${zoomIn} 140ms ease;
  overflow: hidden;
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

export default function AddInventoryModal({ open, onClose, onSave, studies = [] }) {
  const [itemName, setItemName] = useState('');
  const [study, setStudy] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const sheetRef = useRef(null);

  const validate = useCallback(() => {
    const next = {};
    if (!itemName.trim()) next.itemName = 'Item name is required';
    if (!study.trim()) next.study = 'Study is required';
    const q = Number(quantity);
    if (!Number.isFinite(q) || q < 0) next.quantity = 'Quantity must be 0 or more';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [itemName, study, quantity]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await onSave?.({ item_name: itemName.trim(), study_name: study.trim(), quantity: Number(quantity) });
      onClose?.();
    } finally {
      setSaving(false);
    }
  }, [validate, itemName, study, quantity, onSave, onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Enter') {
        // Prevent accidental submits when not focused inside the sheet
        if (sheetRef.current && sheetRef.current.contains(document.activeElement)) {
          handleSave();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleSave, onClose]);

  useEffect(() => {
    if (!open) {
      setItemName('');
      setStudy('');
      setQuantity('');
      setErrors({});
      setSaving(false);
    }
  }, [open]);

  

  

  if (!open) return null;
  return (
    <Overlay onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()} ref={sheetRef}>
        <Header>
          <Title>Add Inventory</Title>
          <Close onClick={onClose} aria-label="Close">
            <X size={18} />
          </Close>
        </Header>
        <Body>
          <Field>
            <Label>Item Name</Label>
            <Input
              autoFocus
              placeholder="e.g., Syringe 5ml"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            {errors.itemName && <ErrorText>{errors.itemName}</ErrorText>}
          </Field>

          <Field>
            <Label>Study</Label>
            <Select value={study} onChange={(e) => setStudy(e.target.value)}>
              <option value="">Select a study</option>
              {studies.map((s) => (
                <option key={s.id ?? s.study_id ?? s} value={s.study_name ?? s}>
                  {(s.study_name ?? s)}{s.study_id ? ` (${s.study_id})` : ''}
                </option>
              ))}
            </Select>
            <div style={{ fontSize: 12, color: '#64748b' }}>Or enter a new one:</div>
            <Input placeholder="e.g., COVID Booster" value={study} onChange={(e) => setStudy(e.target.value)} />
            {errors.study && <ErrorText>{errors.study}</ErrorText>}
          </Field>

          <Field>
            <Label>Quantity</Label>
            <Input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            {errors.quantity && <ErrorText>{errors.quantity}</ErrorText>}
          </Field>
        </Body>
        <Footer>
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Primary type="button" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner /> : 'Save'}
          </Primary>
        </Footer>
      </Sheet>
    </Overlay>
  );
}


