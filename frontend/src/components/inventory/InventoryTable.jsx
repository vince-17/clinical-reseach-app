import React from 'react';
import styled from 'styled-components';
import { Pencil, Trash2 } from 'lucide-react';

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 14px;
  color: var(--muted, #64748b);
  font-weight: 700;
  border-bottom: 1px solid var(--border, #e2e8f0);
  background: var(--card, #fff);
  position: sticky;
  top: 0;
  z-index: 1;
`;

const Tr = styled.tr`
  &:nth-child(odd) td {
    background: rgba(148, 163, 184, 0.06);
  }
  &:hover td {
    background: rgba(148, 163, 184, 0.12);
  }
`;

const Td = styled.td`
  padding: 12px 14px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  color: var(--text, #0f172a);
`;

const Empty = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--muted, #64748b);
`;

const Actions = styled.div`
  display: inline-flex;
  gap: 8px;
`;

const IconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease;
  &:hover { background: #f8fafc; transform: translateY(-1px); }
`;

export default function InventoryTable({ rows = [], loading = false, onEdit, onDelete }) {
  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th style={{ width: '40%' }}>Item Name</Th>
            <Th style={{ width: '40%' }}>Study</Th>
            <Th style={{ width: '15%' }}>Quantity</Th>
            <Th style={{ width: '5%' }}>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.id}>
              <Td>{r.item_name}</Td>
              <Td>{r.study_name}</Td>
              <Td>{r.quantity}</Td>
              <Td>
                <Actions>
                  <IconBtn aria-label="Edit" onClick={() => onEdit?.(r)}><Pencil size={16} /></IconBtn>
                  <IconBtn aria-label="Delete" onClick={() => onDelete?.(r)}><Trash2 size={16} /></IconBtn>
                </Actions>
              </Td>
            </Tr>
          ))}
          {!rows.length && !loading && (
            <tr>
              <Td colSpan={4}>
                <Empty>No inventory yet. Click “Add Inventory” to create the first one.</Empty>
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </TableWrapper>
  );
}


