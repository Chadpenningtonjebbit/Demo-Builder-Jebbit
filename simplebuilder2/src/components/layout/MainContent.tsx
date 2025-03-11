"use client";

import React, { useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Monitor, Tablet, Smartphone, Plus, Undo, Redo } from 'lucide-react';
import { DroppableArea } from '@/components/quiz-builder/DroppableArea';
import { useQuizStore } from '@/store/useQuizStore';
import { ElementRenderer } from '@/components/quiz-builder/ElementRenderer';
import { SectionType } from '@/types';
import { useTheme } from '@/components/ThemeProvider';

export function MainContent() {
  const { 
    quiz, 
    addScreen, 
    setViewMode, 
    viewMode,
    selectElement, 
    selectedElementIds, 
    undo, 
    redo, 
    history, 
    historyIndex, 
    selectSection,
    copySelectedElements,
    pasteElements,
    selectedSectionId,
    groupSelectedElements,
    ungroupElements,
    removeSelectedElements
  } = useQuizStore();
  
  const { theme } = useTheme();
  
  const handleViewModeChange = (mode: string) => {
    console.log('View mode change triggered:', mode);
    setViewMode(mode as 'desktop' | 'tablet' | 'mobile');
    console.log('View mode after change:', viewMode);
  };
  
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas, not on an element or section
    if (e.currentTarget === e.target) {
      selectElement(null);
      selectSection(null);
    }
  };
  
  // Define device sizes
  const deviceSizes = useMemo(() => ({
    desktop: {
      width: 'w-full max-w-[1280px]', // Common desktop width
      minWidth: 'min-w-[768px]', // Minimum desktop width
      height: 'h-full max-h-[800px]', // Reasonable height for desktop
      minHeight: 'min-h-[600px]', // Minimum height
      aspectRatio: 'aspect-[16/10]', // Common desktop aspect ratio
    },
    tablet: {
      width: 'w-full max-w-[768px]', // Common tablet width (iPad)
      minWidth: 'min-w-[640px]', // Minimum tablet width
      height: 'h-full max-h-[1024px]', // Common tablet height
      minHeight: 'min-h-[600px]', // Minimum height
      aspectRatio: 'aspect-[4/3]', // Common tablet aspect ratio
    },
    mobile: {
      width: 'w-full max-w-[390px]', // Common mobile width (iPhone 12/13/14)
      minWidth: 'min-w-[320px]', // Minimum mobile width
      height: 'h-full max-h-[844px]', // Common mobile height
      minHeight: 'min-h-[568px]', // Minimum height (iPhone SE)
      aspectRatio: 'aspect-[9/19.5]', // Common mobile aspect ratio
    }
  }), []);
  
  // Get current device size based on view mode
  const currentDeviceSize = deviceSizes[viewMode];
  
  // Check if undo/redo are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  // Add keyboard shortcuts for undo/redo and copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is in an input or textarea
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
      
      // Escape: Deselect all elements and sections
      if (e.key === 'Escape') {
        e.preventDefault();
        selectElement(null);
        selectSection(null);
      }
      
      // Global copy: Ctrl+C (when no element has focus)
      if (e.ctrlKey && e.key === 'c' && selectedElementIds.length > 0) {
        // Let the ElementRenderer handle this if it's focused
        if (!document.activeElement?.closest('.element-renderer')) {
          e.preventDefault();
          copySelectedElements();
        }
      }
      
      // Global paste: Ctrl+V (when no element has focus)
      if (e.ctrlKey && e.key === 'v') {
        // Let the ElementRenderer handle this if it's focused
        if (!document.activeElement?.closest('.element-renderer')) {
          e.preventDefault();
          // Paste to the selected section or body if none selected
          pasteElements(selectedSectionId || 'body');
        }
      }
      
      // Delete key: Remove selected elements
      if (e.key === 'Delete' && selectedElementIds.length > 0) {
        e.preventDefault();
        removeSelectedElements();
      }
      
      // Group elements: Ctrl+G
      if (e.ctrlKey && e.key === 'g' && !e.shiftKey && selectedElementIds.length > 1) {
        e.preventDefault();
        groupSelectedElements();
      }
      
      // Ungroup elements: Ctrl+Shift+G
      if (e.ctrlKey && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        // Find if any of the selected elements is a group
        const currentScreen = quiz.screens[quiz.currentScreenIndex];
        for (const sectionId of Object.keys(currentScreen.sections) as SectionType[]) {
          const section = currentScreen.sections[sectionId];
          for (const element of section.elements) {
            if (element.isGroup && selectedElementIds.includes(element.id)) {
              ungroupElements(element.id);
              break;
            }
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    copySelectedElements, 
    pasteElements, 
    groupSelectedElements, 
    ungroupElements,
    selectedElementIds, 
    selectedSectionId,
    quiz,
    removeSelectedElements
  ]);
  
  const currentScreen = quiz.screens[quiz.currentScreenIndex];
  const hasHeader = currentScreen.sections.header.enabled;
  const hasFooter = currentScreen.sections.footer.enabled;
  
  // Function to render a section
  const renderSection = (sectionId: SectionType) => {
    const section = currentScreen.sections[sectionId];
    
    // Create style object for body section height
    const sectionStyle: React.CSSProperties = { 
      boxSizing: 'border-box',
    };
    
    // Add specific styles for body section
    if (sectionId === 'body') {
      sectionStyle.flex = '1 1 auto';
      sectionStyle.height = '100%';
      sectionStyle.overflow = 'auto';
    }
    
    return (
      <DroppableArea 
        id={`section-${sectionId}`} 
        sectionId={sectionId}
        className={`
          relative
          ${sectionId === 'header' ? 'border-b border-border' : ''}
          ${sectionId === 'footer' ? 'border-t border-border' : ''}
          ${section.elements.length === 0 ? 'min-h-[60px]' : ''}
          ${sectionId === 'body' ? 'flex-1 h-full' : ''}
        `}
        style={sectionStyle}
      >
        {section.elements.map((element) => (
          <ElementRenderer key={element.id} element={element} />
        ))}
      </DroppableArea>
    );
  };
  
  // Grid background styles based on theme
  const gridBackgroundStyles = theme === 'dark' 
    ? {
        backgroundColor: '#1a1a1a',
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
        backgroundPosition: '-1px -1px, -1px -1px, -1px -1px, -1px -1px'
      }
    : {
        backgroundColor: '#f5f5f5',
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
          linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
        backgroundPosition: '-1px -1px, -1px -1px, -1px -1px, -1px -1px'
      };
  
  return (
    <div className="flex flex-col h-full">
      <div 
        className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center relative"
        style={gridBackgroundStyles}
      >
        {/* Floating Controls Footer */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 w-auto">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg shadow-md p-2 border border-border flex items-center gap-4 floating-footer">
            {/* Add Screen Button */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={addScreen}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Screen
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Add a new screen to your quiz</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-border/50"></div>

            {/* Undo/Redo Controls */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shadow-none" 
                    onClick={undo} 
                    disabled={!canUndo}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Undo (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shadow-none" 
                    onClick={redo} 
                    disabled={!canRedo}
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Redo (Ctrl+Y)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Separator */}
            <div className="h-8 w-px bg-border/50"></div>
            
            {/* Device Preview Controls */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'desktop' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    className="h-8 w-8 shadow-none" 
                    onClick={() => handleViewModeChange('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Desktop View</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'tablet' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    className="h-8 w-8 shadow-none" 
                    onClick={() => handleViewModeChange('tablet')}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Tablet View</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'mobile' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    className="h-8 w-8 shadow-none" 
                    onClick={() => handleViewModeChange('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Mobile View</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        
        {/* Canvas */}
        <div 
          className={`
            relative bg-background shadow-lg border border-border rounded-lg overflow-hidden
            ${currentDeviceSize.width}
            ${currentDeviceSize.minWidth}
            ${currentDeviceSize.height}
            ${currentDeviceSize.minHeight}
          `}
          style={{ boxSizing: 'border-box' }}
          onClick={handleCanvasClick}
        >
          {/* Device Frame */}
          <div className="absolute inset-0 flex flex-col h-full overflow-hidden" style={{ boxSizing: 'border-box' }}>
            {/* Screen Content */}
            <div className="flex flex-col h-full overflow-hidden" style={{ boxSizing: 'border-box' }}>
              {/* Sections */}
              <div className="flex flex-col h-full overflow-hidden" style={{ boxSizing: 'border-box' }}>
                {hasHeader && renderSection('header')}
                <div className="flex-1 overflow-hidden" style={{ boxSizing: 'border-box' }}>
                  {renderSection('body')}
                </div>
                {hasFooter && renderSection('footer')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 