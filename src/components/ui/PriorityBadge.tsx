import React from 'react';
import { TaskPriority } from '../../types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  showText?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showText = true }) => {
  const renderShape = () => {
    switch (priority) {
      case 'HIGH':
        return (
          <div 
            className="w-4 h-4 rounded-full bg-primary-red border-2 border-border inline-block flex-shrink-0"
            title="High Priority: Red Circle"
          />
        );
      case 'MEDIUM':
        return (
          <div 
            className="w-4 h-4 bg-primary-yellow border-2 border-border inline-block flex-shrink-0"
            title="Medium Priority: Yellow Square"
          />
        );
      case 'LOW':
        return (
          <div 
            className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-primary-blue inline-block flex-shrink-0 relative top-[-1px] select-none"
            title="Low Priority: Blue Triangle"
          >
            {/* Offset triangle drop shadow */}
            <div className="absolute top-[2px] left-[-6px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-primary-blue" />
          </div>
        );
      default:
        return null;
    }
  };

  const formatPriorityLabel = (p: TaskPriority) => {
    switch (p) {
      case 'HIGH': return 'High';
      case 'MEDIUM': return 'Medium';
      case 'LOW': return 'Low';
      default: return p;
    }
  };

  return (
    <div className="flex items-center gap-1.5 font-bold text-xs text-canvas-fg select-none">
      <div className="w-5 h-5 flex items-center justify-center">
        {renderShape()}
      </div>
      {showText && <span>{formatPriorityLabel(priority)}</span>}
    </div>
  );
};
