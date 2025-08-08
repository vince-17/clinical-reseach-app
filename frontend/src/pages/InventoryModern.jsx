import React, { useState } from 'react';
import styled from 'styled-components';
import { Plus } from 'lucide-react';
import AddInventoryButton from '../components/inventory/AddInventoryButton.jsx';
import InventoryTable from '../components/inventory/InventoryTable.jsx';
import AddInventoryModal from '../components/inventory/AddInventoryModal.jsx';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ImportExcelButton from '../components/inventory/ImportExcelButton.jsx';

const Page = styled.div`
  display: grid;
  gap: 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: var(--text, #0f172a);
  margin: 0;
`;

const Card = styled.div`
  background: var(--card, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
`;

export default function InventoryModern() {
  const { token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studies, setStudies] = useState([]);
  const studyOptions = React.useMemo(() => {
    const map = new Map();
    for (const s of studies) {
      if (!s) continue;
      const key = (s.study_name || '').trim();
      if (key && !map.has(key)) map.set(key, { study_name: s.study_name, study_id: s.study_id, id: s.id });
    }
    for (const r of rows) {
      const key = (r.study_name || '').trim();
      if (key && !map.has(key)) map.set(key, { study_name: r.study_name, study_id: r.study_id, id: r.id });
    }
    return Array.from(map.values()).sort((a, b) => a.study_name.localeCompare(b.study_name));
  }, [studies, rows]);

  const loadRows = React.useCallback(async function loadRows() {
    setLoading(true);
    try {
      const data = await api('/api/basic/inventory', { method: 'GET', token });
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadStudies = React.useCallback(async function loadStudies() {
    try {
      const data = await api('/api/basic/studies', { method: 'GET', token });
      setStudies(data || []);
    } catch {}
  }, [token]);

  React.useEffect(() => { loadRows(); loadStudies(); }, [loadRows, loadStudies]);

  async function handleSave(newRow) {
    await api('/api/basic/inventory/new', { method: 'POST', token, body: newRow });
    await Promise.all([loadRows(), loadStudies()]);
    setSuccess('Inventory added');
    setTimeout(() => setSuccess(''), 1800);
  }

  async function handleDelete(row) {
    if (!window.confirm('Delete this inventory item?')) return;
    await api(`/api/basic/inventory/${row.id}`, { method: 'DELETE', token });
    await Promise.all([loadRows(), loadStudies()]);
  }

  async function handleEdit(row) {
    const v = window.prompt('New quantity', String(row.quantity));
    if (v == null) return;
    const q = Number(v);
    if (!Number.isFinite(q) || q < 0) return alert('Quantity must be a non-negative number');
    await api(`/api/basic/inventory/${row.id}`, { method: 'PATCH', token, body: { quantity: q } });
    await loadRows();
  }

  return (
    <Page>
      <Header>
        <Title>Inventory</Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <ImportExcelButton token={token} onImported={() => { loadRows(); loadStudies(); }} />
          <AddInventoryButton onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Add Inventory
          </AddInventoryButton>
        </div>
      </Header>

      {success && (
        <div style={{
          background: '#ecfdf5',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 13,
          fontWeight: 600,
        }}>
          {success}
        </div>
      )}

      {/* Table */}
      <Card>
        <InventoryTable rows={rows} loading={loading} onDelete={handleDelete} onEdit={handleEdit} />
      </Card>

      <AddInventoryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (payload) => {
          await handleSave(payload);
          setIsModalOpen(false);
        }}
        studies={studyOptions}
        defaultStudy={rows[0]?.study_name || ''}
      />
    </Page>
  );
}


