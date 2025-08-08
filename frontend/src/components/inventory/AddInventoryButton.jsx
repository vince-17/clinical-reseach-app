import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  border: 1px solid #2563eb;
  color: #ffffff;
  background: #2563eb;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: #1d4ed8;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  }
`;

export default function AddInventoryButton({ children, onClick }) {
  return <Button onClick={onClick} type="button">{children}</Button>;
}


