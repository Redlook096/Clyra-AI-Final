import React from 'react';
import './MemoryBar.css';

interface MemoryBarProps {
  hasMemory: boolean;
  memory: number | null;
}

const MemoryBar: React.FC<MemoryBarProps> = React.memo(({ hasMemory, memory }) => {
  if (!hasMemory || memory === null) return null;

  return (
    <div className="memory-bar">
      <span className="memory-bar__label">M =</span>
      <span className="memory-bar__value">{memory}</span>
    </div>
  );
});

MemoryBar.displayName = 'MemoryBar';
export default MemoryBar;
