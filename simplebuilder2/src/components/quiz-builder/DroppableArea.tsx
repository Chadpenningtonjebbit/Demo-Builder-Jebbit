"use client";

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useQuizStore } from '@/store/useQuizStore';
import { SectionType } from '@/types';
import { Layout, ArrowDown, AlignJustify } from 'lucide-react';

interface DroppableAreaProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  sectionId?: SectionType;
  style?: React.CSSProperties;
}

export function DroppableArea({ id, children, className = '', sectionId, style = {} }: DroppableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const { selectedSectionId, selectSection, quiz } = useQuizStore();
  const isSelected = selectedSectionId === sectionId;
  const [isHovered, setIsHovered] = useState(false);
  
  // Get the current section's layout and styles if this is a section
  const currentScreen = quiz.screens[quiz.currentScreenIndex];
  const section = sectionId ? currentScreen.sections[sectionId] : null;
  const sectionLayout = section?.layout;
  const sectionStyles = section?.styles || {};
  
  const handleSectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sectionId) {
      selectSection(sectionId);
    }
  };
  
  // Combine user styles with section styles
  const combinedStyles: React.CSSProperties = { 
    ...style,
    boxSizing: 'border-box',
    backgroundColor: sectionStyles.backgroundColor || '',
    padding: sectionStyles.padding || '',
    margin: sectionStyles.margin || '',
    border: sectionStyles.border !== 'none' ? sectionStyles.border : '',
    borderRadius: sectionStyles.borderRadius || '',
  };
  
  // Generate layout styles based on the section's flexbox configuration
  const layoutStyles: React.CSSProperties = {
    boxSizing: 'border-box',
  };
  
  if (sectionLayout) {
    // Apply flexbox layout styles
    layoutStyles.display = 'flex';
    layoutStyles.flexDirection = sectionLayout.direction;
    layoutStyles.flexWrap = sectionLayout.wrap;
    layoutStyles.justifyContent = sectionLayout.justifyContent;
    layoutStyles.alignItems = sectionLayout.alignItems;
    layoutStyles.alignContent = sectionLayout.alignContent;
    layoutStyles.gap = sectionLayout.gap;
  }
  
  // Get the appropriate icon for the section type
  const getSectionIcon = () => {
    switch (sectionId) {
      case 'header': return <Layout className="h-3 w-3" />;
      case 'footer': return <ArrowDown className="h-3 w-3" />;
      case 'body': return <AlignJustify className="h-3 w-3" />;
      default: return <Layout className="h-3 w-3" />;
    }
  };
  
  // Format section name for display
  const formatSectionName = (section?: SectionType) => {
    if (!section) return '';
    return section.charAt(0).toUpperCase() + section.slice(1);
  };
  
  return (
    <div
      ref={setNodeRef}
      className={`
        ${className} 
        ${sectionId ? 'relative cursor-pointer transition-all duration-100' : ''}
        ${isSelected ? 'z-10' : 'z-0'}
        ${sectionId === 'body' ? 'flex-1 h-full' : ''}
      `}
      onClick={sectionId ? handleSectionClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-section-id={sectionId}
      style={combinedStyles}
    >
      {/* Webflow-style section UI */}
      {sectionId && (isSelected || isHovered || isOver) && (
        <>
          {/* Section label */}
          <div 
            className={`
              absolute -top-8 left-0 h-6 px-2
              flex items-center text-xs font-medium
              ${isSelected ? 'bg-primary text-white' : 'bg-gray-800 text-white'}
              rounded-t-sm z-10
            `}
            style={{ borderRadius: '4px' }}
          >
            <span className="flex items-center gap-1.5">
              {getSectionIcon()}
              {formatSectionName(sectionId)} Section
            </span>
          </div>
          
          {/* Selection outline */}
          <div 
            className={`
              absolute inset-0 pointer-events-none
              ${isSelected 
                ? 'border-2 border-primary' 
                : isOver 
                  ? 'border-2 border-primary bg-primary/10' 
                  : 'border border-gray-800/70'}
              transition-all duration-100
              ${sectionId === 'header' ? 'rounded-t-lg' : ''}
              ${sectionId === 'footer' ? 'rounded-b-lg' : ''}
            `}
            style={{
              borderRadius: sectionStyles.borderRadius || '',
              boxSizing: 'border-box',
            }}
          ></div>
          
          {/* Drop indicator */}
          {isOver && (
            <div className="absolute inset-0 pointer-events-none bg-primary/10 z-0 flex items-center justify-center">
              <div className="text-primary font-medium text-sm bg-white/80 px-3 py-1 rounded-full shadow-sm">
                Drop here
              </div>
            </div>
          )}
        </>
      )}
      
      <div style={layoutStyles} className="h-full">
        {children}
      </div>
    </div>
  );
} 