import React, { useState } from 'react';
import styled from 'styled-components';
import { Plus, Settings } from 'lucide-react';
import AddInventoryButton from '../components/inventory/AddInventoryButton.jsx';
import InventoryTable from '../components/inventory/InventoryTable.jsx';
import AddInventoryModal from '../components/inventory/AddInventoryModal.jsx';
import EditInventoryModal from '../components/inventory/EditInventoryModal.jsx';
import StudyManager from '../components/StudyManager.jsx';
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showStudyManager, setShowStudyManager] = useState(false);
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
    try {
      await api('/api/basic/inventory/new', { method: 'POST', token, body: newRow });
      await Promise.all([loadRows(), loadStudies()]);
      setSuccess('Inventory added');
      setTimeout(() => setSuccess(''), 1800);
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving inventory: ' + (error.message || 'Unknown error'));
    }
  }

  async function handleDelete(row) {
    if (!window.confirm('Delete this inventory item?')) return;
    await api(`/api/basic/inventory/${row.id}`, { method: 'DELETE', token });
    await Promise.all([loadRows(), loadStudies()]);
  }

  async function handleEdit(row) {
    setEditingItem(row);
    setIsEditModalOpen(true);
  }

  async function handleSaveEdit(updatedItem) {
    try {
      await api(`/api/basic/inventory/${updatedItem.id}`, { 
        method: 'PATCH', 
        token, 
        body: updatedItem 
      });
      await Promise.all([loadRows(), loadStudies()]);
      setSuccess('Inventory item updated');
      setTimeout(() => setSuccess(''), 1800);
    } catch (error) {
      console.error('Edit error:', error);
      alert('Error updating inventory: ' + (error.message || 'Unknown error'));
    }
  }

  return (
    <Page>
      <Header>
        <Title>Inventory</Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowStudyManager(!showStudyManager)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              background: showStudyManager ? '#f0f4f8' : '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              color: '#64748b'
            }}
          >
            <Settings size={16} />
            Manage Studies
          </button>
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

      {/* Study Manager */}
      {showStudyManager && (
        <Card>
          <StudyManager onStudyDeleted={() => { loadRows(); loadStudies(); }} />
        </Card>
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

      <EditInventoryModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEdit}
        studies={studyOptions}
        item={editingItem}
      />
    </Page>
  );
}


