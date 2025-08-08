import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Container = styled.div`
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(2, 6, 23, 0.05);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const StudyList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const StudyItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f8fafc;
  }
`;

const StudyInfo = styled.div`
  flex: 1;
`;

const StudyName = styled.div`
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
`;

const StudyId = styled.div`
  font-size: 12px;
  color: #64748b;
`;

const UsageCount = styled.div`
  font-size: 12px;
  color: #059669;
  margin-top: 4px;
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #dc2626;
  font-size: 12px;
  cursor: pointer;
  transition: all 120ms ease;
  
  &:hover {
    background: #fef2f2;
    border-color: #fecaca;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: #9ca3af;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
`;

const Warning = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  margin: 16px 20px;
  font-size: 14px;
  color: #92400e;
`;

export default function StudyManager({ onStudyDeleted }) {
  const { token } = useAuth();
  const [studies, setStudies] = useState([]);
  const [studyUsage, setStudyUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/basic/studies', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setStudies(data);
      
      // Load inventory to count usage
      const invRes = await fetch('/api/basic/inventory', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const invData = await invRes.json();
      
      // Count how many inventory items use each study
      const usage = {};
      invData.forEach(item => {
        const studyName = item.study_name;
        usage[studyName] = (usage[studyName] || 0) + 1;
      });
      setStudyUsage(usage);
      
    } catch (err) {
      console.error('Failed to load studies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudies();
  }, [token]);

  const handleDelete = async (study) => {
    const usageCount = studyUsage[study.study_name] || 0;
    
    if (usageCount > 0) {
      alert(`Cannot delete "${study.study_name}" - it is being used by ${usageCount} inventory item(s)`);
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete study "${study.study_name}"?`)) {
      return;
    }
    
    try {
      setDeleting(study.id);
      const res = await fetch(`/api/basic/studies/${study.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete study');
      }
      
      // Refresh studies list
      await loadStudies();
      onStudyDeleted?.();
      
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Study Management</Title>
        </Header>
        <EmptyState>Loading studies...</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Study Management</Title>
      </Header>
      
      <Warning>
        <AlertTriangle size={16} />
        You can only delete studies that are not being used by any inventory items.
      </Warning>
      
      <StudyList>
        {studies.length === 0 ? (
          <EmptyState>No studies found</EmptyState>
        ) : (
          studies.map((study) => {
            const usageCount = studyUsage[study.study_name] || 0;
            const canDelete = usageCount === 0;
            
            return (
              <StudyItem key={study.id}>
                <StudyInfo>
                  <StudyName>{study.study_name}</StudyName>
                  <StudyId>ID: {study.study_id}</StudyId>
                  <UsageCount>
                    Used by {usageCount} inventory item{usageCount !== 1 ? 's' : ''}
                  </UsageCount>
                </StudyInfo>
                
                <DeleteButton
                  onClick={() => handleDelete(study)}
                  disabled={!canDelete || deleting === study.id}
                >
                  <Trash2 size={14} />
                  {deleting === study.id ? 'Deleting...' : 'Delete'}
                </DeleteButton>
              </StudyItem>
            );
          })
        )}
      </StudyList>
    </Container>
  );
}
