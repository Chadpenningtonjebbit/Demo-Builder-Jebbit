"use client";

import React, { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { QuizElement, SectionType } from '@/types';
import { useQuizStore } from '@/store/useQuizStore';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { Trash, Copy, Clipboard, Type, Square, Link as LinkIcon, Image, CheckSquare, Radio, ListFilter, AlignLeft, Group, Ungroup, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ElementRendererProps {
  element: QuizElement;
}

export function ElementRenderer({ element }: ElementRendererProps) {
  const { 
    selectedElementIds, 
    selectElement,
    removeElement,
    copySelectedElements,
    pasteElements,
    groupSelectedElements,
    ungroupElements,
    reorderElement,
    quiz
  } = useQuizStore();
  
  // Track hover state
  const [isHovered, setIsHovered] = useState(false);
  
  // Add a lightweight global click handler to clear hover states
  // This helps ensure hover states don't persist when clicking elsewhere
  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Only clear hover if we're not clicking on this element
      const elementNode = document.getElementById(`element-${element.id}`);
      if (elementNode && !elementNode.contains(e.target as Node)) {
        setIsHovered(false);
      }
    };
    
    // Use capture phase to ensure our handler runs before other handlers
    document.addEventListener('click', handleGlobalClick, true);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [element.id]);
  
  // Check if this element's parent group is selected or if any element in the same group is selected
  const isParentGroupSelected = useMemo(() => {
    if (!element.groupId) return true; // Not in a group, so always interactive
    
    // Check if the parent group is selected
    if (selectedElementIds.includes(element.groupId)) {
      return true;
    }
    
    // Check if any element in the same group is selected
    // This allows selecting multiple elements within the same group
    for (const selectedId of selectedElementIds) {
      // Find the selected element
      for (const screen of quiz.screens) {
        for (const sectionKey of Object.keys(screen.sections) as SectionType[]) {
          const section = screen.sections[sectionKey as keyof typeof screen.sections];
          
          // Check if the selected element is in the same group as this element
          for (const groupEl of section.elements) {
            if (groupEl.isGroup && groupEl.id === element.groupId && groupEl.children) {
              // Check if any child of this group is selected
              const hasSelectedSibling = groupEl.children.some(
                (child: QuizElement) => selectedElementIds.includes(child.id)
              );
              
              if (hasSelectedSibling) {
                return true;
              }
            }
          }
        }
      }
    }
    
    return false;
  }, [element.groupId, selectedElementIds, quiz.screens]);
  
  // Make the element draggable
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: element.id,
    data: {
      type: element.type,
      sectionId: element.sectionId,
    },
  });
  
  // Build the element style
  let style: React.CSSProperties = {};
  
  // Apply transform from drag operation if present
  if (transform) {
    style.transform = CSS.Translate.toString(transform);
  }
  
  // Apply element styles
  Object.entries(element.styles || {}).forEach(([key, value]) => {
    // Only include width/height if explicitly set
    if ((key === 'width' || key === 'height') && !value) {
      return;
    }
    
    // Skip applying certain styles to the container for button elements
    // These will be applied directly to the button element instead
    if (element.type === 'button' && 
        (key === 'padding' || 
         key === 'borderRadius' || 
         key === 'backgroundColor' || 
         key === 'color' || 
         key === 'border' || 
         key === 'fontSize' || 
         key === 'fontWeight')) {
      return;
    }
    
    // Use type assertion to handle dynamic style properties
    (style as any)[key] = value;
  });
  
  // Handle click with hierarchical selection
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation to prevent section selection
    
    // If this element is in a group and the group is not selected, select the group instead
    if (element.groupId && !isParentGroupSelected) {
      selectElement(element.groupId);
      return;
    }
    
    // Check if shift key is pressed for multi-select
    const isMultiSelect = e.shiftKey;
    selectElement(element.id, isMultiSelect);
  };
  
  const handleDelete = () => {
    if (selectedElementIds.length > 1 && selectedElementIds.includes(element.id)) {
      // Delete all selected elements
      selectedElementIds.forEach(id => removeElement(id));
    } else {
      // Delete just this element
      removeElement(element.id);
    }
  };
  
  const handleCopy = () => {
    // If this element is not in the current selection, select it first
    if (!selectedElementIds.includes(element.id)) {
      selectElement(element.id);
    }
    copySelectedElements();
  };
  
  const handlePaste = () => {
    pasteElements(element.sectionId);
  };
  
  const handleGroup = () => {
    // If this element is not in the current selection, select it first
    if (!selectedElementIds.includes(element.id)) {
      selectElement(element.id, true); // Multi-select
    }
    groupSelectedElements();
  };
  
  const handleUngroup = () => {
    if (element.isGroup) {
      ungroupElements(element.id);
    }
  };
  
  const isSelected = selectedElementIds.includes(element.id);
  
  // Determine if this element should be interactive
  const isInteractive = element.groupId ? isParentGroupSelected : true;
  
  // Create an overlay for group children to prevent interaction until group is selected
  const needsOverlay = element.groupId && !isParentGroupSelected;
  
  // Only show hover state if the element is interactive (parent group is selected or not in a group)
  const showHoverState = isHovered && isInteractive;
  
  // Determine if this element should show reordering controls
  const shouldShowReorderingControls = useMemo(() => {
    // Only show reordering controls if this element is selected
    if (!isSelected) return false;
    
    // If only one element is selected, show controls on that element
    if (selectedElementIds.length === 1) return true;
    
    // If multiple elements are selected, only show controls on the first selected element
    return selectedElementIds[0] === element.id;
  }, [isSelected, selectedElementIds, element.id]);
  
  // Get the appropriate icon for the element type
  const getElementIcon = () => {
    switch (element.type) {
      case 'text': return <Type className="h-3 w-3" />;
      case 'button': return <Square className="h-3 w-3" />;
      case 'link': return <LinkIcon className="h-3 w-3" />;
      case 'image': return <Image className="h-3 w-3" />;
      case 'input': return <Type className="h-3 w-3" />;
      case 'checkbox': return <CheckSquare className="h-3 w-3" />;
      case 'radio': return <Radio className="h-3 w-3" />;
      case 'select': return <ListFilter className="h-3 w-3" />;
      case 'textarea': return <AlignLeft className="h-3 w-3" />;
      case 'group': return <Group className="h-3 w-3" />;
      default: return <Square className="h-3 w-3" />;
    }
  };
  
  // Format element type for display
  const formatElementType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  // Determine the parent container's flex direction
  const getParentFlexDirection = (): 'row' | 'column' => {
    // For elements in a group
    if (element.groupId) {
      // Find the parent group
      for (const screen of quiz.screens) {
        for (const sectionKey of Object.keys(screen.sections) as SectionType[]) {
          const section = screen.sections[sectionKey as keyof typeof screen.sections];
          const parentGroup = section.elements.find((el: QuizElement) => 
            el.id === element.groupId && el.isGroup
          );
          
          if (parentGroup && parentGroup.layout) {
            return parentGroup.layout.direction.startsWith('row') ? 'row' : 'column';
          }
        }
      }
    }
    
    // For elements directly in a section
    if (element.sectionId) {
      const currentScreen = quiz.screens[quiz.currentScreenIndex];
      const section = currentScreen.sections[element.sectionId];
      
      if (section && section.layout) {
        return section.layout.direction.startsWith('row') ? 'row' : 'column';
      }
    }
    
    // Default to row if we can't determine
    return 'row';
  };
  
  // Handle moving multiple elements up
  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    // If multiple elements are selected, move all of them
    if (selectedElementIds.length > 1) {
      // Move each selected element
      selectedElementIds.forEach(id => {
        reorderElement(id, 'up');
      });
    } else {
      // Move just this element
      reorderElement(element.id, 'up');
    }
  };
  
  // Handle moving multiple elements down
  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    // If multiple elements are selected, move all of them
    if (selectedElementIds.length > 1) {
      // Move each selected element in reverse order to avoid index issues
      [...selectedElementIds].reverse().forEach(id => {
        reorderElement(id, 'down');
      });
    } else {
      // Move just this element
      reorderElement(element.id, 'down');
    }
  };
  
  // Handle moving multiple elements left
  const handleMoveLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    // If multiple elements are selected, move all of them
    if (selectedElementIds.length > 1) {
      // Move each selected element
      selectedElementIds.forEach(id => {
        reorderElement(id, 'left');
      });
    } else {
      // Move just this element
      reorderElement(element.id, 'left');
    }
  };
  
  // Handle moving multiple elements right
  const handleMoveRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    // If multiple elements are selected, move all of them
    if (selectedElementIds.length > 1) {
      // Move each selected element in reverse order to avoid index issues
      [...selectedElementIds].reverse().forEach(id => {
        reorderElement(id, 'right');
      });
    } else {
      // Move just this element
      reorderElement(element.id, 'right');
    }
  };
  
  // Determine which reordering controls to show based on flex direction
  const flexDirection = getParentFlexDirection();
  const showVerticalControls = flexDirection === 'column';
  const showHorizontalControls = flexDirection === 'row';
  
  // Render group container with improved hover handling
  const renderGroupContainer = () => {
    if (element.type !== 'group' || !element.children) return null;
    
    // Get width and height from styles, defaulting to 100% if not set
    const width = element.styles?.width || '100%';
    const height = element.styles?.height || '100%';
    
    return (
      <div 
        className="group-container"
        style={{
          display: 'flex',
          flexDirection: element.layout?.direction || 'row',
          flexWrap: element.layout?.wrap || 'wrap',
          justifyContent: element.layout?.justifyContent || 'flex-start',
          alignItems: element.layout?.alignItems || 'center',
          alignContent: element.layout?.alignContent || 'flex-start',
          gap: element.layout?.gap || '8px',
          width: width,
          height: height,
          position: 'relative',
          zIndex: 1
        }}
        onClick={(e) => {
          if (e.currentTarget === e.target) {
            e.stopPropagation();
          }
        }}
        onMouseLeave={(e) => {
          // Ensure hover state is cleared when mouse leaves the group
          setIsHovered(false);
          e.stopPropagation();
        }}
      >
        {element.children.map(childElement => (
          <ElementRenderer key={childElement.id} element={childElement} />
        ))}
      </div>
    );
  };
  
  // Optimized mouse enter handler for better hover state responsiveness
  const handleMouseEnter = (e: React.MouseEvent) => {
    // Only set hover if this is the direct target, not from bubbling
    // AND only if the parent group is selected (or not in a group)
    if (e.currentTarget === e.target && isInteractive) {
      setIsHovered(true);
    }
    e.stopPropagation();
  };
  
  // Optimized mouse leave handler for better hover state responsiveness
  const handleMouseLeave = (e: React.MouseEvent) => {
    // Only clear hover if this is the direct target, not from bubbling
    if (e.currentTarget === e.target) {
      setIsHovered(false);
    }
    e.stopPropagation();
  };
  
  // Determine if this element should show controls
  const showControls = isSelected || isHovered;
  
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          id={`element-${element.id}`}
          ref={setNodeRef}
          className={`
            element-renderer relative 
            ${isSelected ? 'z-10' : 'z-0'}
            transition-all duration-100
          `}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-no-focus="true"
          style={{
            borderRadius: element.styles?.borderRadius || 'inherit',
            overflow: 'visible'
          }}
          {...listeners}
          {...attributes}
        >
          {/* Add overlay for group children to capture all events */}
          {needsOverlay && (
            <div 
              className="absolute inset-0 z-50 bg-transparent cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                // Select the parent group instead
                if (element.groupId) {
                  selectElement(element.groupId);
                }
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                // We don't want to show hover state for the child
                setIsHovered(false);
                
                // But we do want to show hover state for the parent group
                // Find the parent group element
                const parentGroupElement = document.getElementById(`element-${element.groupId}`);
                if (parentGroupElement) {
                  // Dispatch a synthetic mouseenter event to the parent group
                  const mouseEvent = new MouseEvent('mouseenter', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                  });
                  parentGroupElement.dispatchEvent(mouseEvent);
                }
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                // We don't want to show hover state for the child
                setIsHovered(false);
              }}
            />
          )}
          
          {/* Webflow-style selection UI */}
          {showControls && (
            <>
              {/* Element type label */}
              <div 
                className={`
                  absolute -top-7 left-0 h-5 px-1.5 
                  flex items-center text-[10px] font-medium
                  ${isSelected ? 'bg-primary text-white' : 'bg-gray-800 text-white'}
                  rounded-t-sm z-10
                `}
                style={{ borderRadius: '4px' }}
              >
                <span className="flex items-center gap-1">
                  {getElementIcon()}
                  {formatElementType(element.type)}
                </span>
              </div>
              
              {/* Selection outline */}
              <div 
                className={`
                  absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5
                  pointer-events-none
                  ${isSelected 
                    ? 'border-2 border-primary bg-primary/10' 
                    : 'border border-gray-800/70 bg-transparent'}
                  z-0
                `} 
                style={{ borderRadius: element.styles?.borderRadius ? `calc(${element.styles.borderRadius} + 2px)` : 'inherit' }}
              ></div>
              
              {/* Reordering controls - only show when selected and this is the first selected element */}
              {shouldShowReorderingControls && (
                <>
                  {/* Vertical controls (for column layout) */}
                  {showVerticalControls && (
                    <div 
                      className="absolute -left-8 top-1/2 transform -translate-y-1/2 flex flex-col gap-1.5 z-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.nativeEvent.stopImmediatePropagation();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <button 
                        className="bg-primary text-white rounded-md p-1 hover:bg-primary/80 transition-colors shadow-sm"
                        onClick={handleMoveUp}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        title={selectedElementIds.length > 1 ? "Move Selected Elements Up" : "Move Up"}
                        type="button"
                        style={{ pointerEvents: 'all', borderRadius: '4px' }}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button 
                        className="bg-primary text-white rounded-md p-1 hover:bg-primary/80 transition-colors shadow-sm"
                        onClick={handleMoveDown}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        title={selectedElementIds.length > 1 ? "Move Selected Elements Down" : "Move Down"}
                        type="button"
                        style={{ pointerEvents: 'all', borderRadius: '4px' }}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Horizontal controls (for row layout) */}
                  {showHorizontalControls && (
                    <div 
                      className="absolute top-[-24px] right-0 flex gap-1.5 z-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.nativeEvent.stopImmediatePropagation();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <button 
                        className="bg-primary text-white rounded-md p-1 hover:bg-primary/80 transition-colors shadow-sm"
                        onClick={handleMoveLeft}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        title={selectedElementIds.length > 1 ? "Move Selected Elements Left" : "Move Left"}
                        type="button"
                        style={{ pointerEvents: 'all', borderRadius: '4px' }}
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button 
                        className="bg-primary text-white rounded-md p-1 hover:bg-primary/80 transition-colors shadow-sm"
                        onClick={handleMoveRight}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        title={selectedElementIds.length > 1 ? "Move Selected Elements Right" : "Move Right"}
                        type="button"
                        style={{ pointerEvents: 'all', borderRadius: '4px' }}
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          
          {/* Actual element content */}
          <div style={style}>
            {element.type === 'text' && (
              <p>{element.content}</p>
            )}
            
            {element.type === 'button' && (
              <button 
                className="cursor-pointer" 
                style={{
                  padding: element.styles?.padding || '8px 16px',
                  borderRadius: element.styles?.borderRadius || '4px',
                  backgroundColor: element.styles?.backgroundColor || 'var(--primary)',
                  color: element.styles?.color || 'white',
                  border: element.styles?.border || 'none',
                  fontSize: element.styles?.fontSize || '16px',
                  fontWeight: element.styles?.fontWeight || 'normal',
                  width: element.styles?.width || 'auto',
                  height: element.styles?.height || 'auto',
                  display: 'inline-block',
                  textAlign: (element.styles?.textAlign as any) || 'center',
                  lineHeight: 'normal',
                  boxSizing: 'border-box'
                }}
              >
                {element.content}
              </button>
            )}
            
            {element.type === 'link' && (
              <a 
                href={element.attributes.href || '#'} 
                target={element.attributes.target || '_self'}
                className="cursor-pointer" 
                style={{
                  textDecoration: 'underline',
                  color: element.styles.color || 'var(--primary)',
                  fontSize: element.styles.fontSize || '16px',
                  fontWeight: element.styles.fontWeight || 'normal',
                  padding: element.styles.padding || '0',
                }}
                onClick={(e) => e.preventDefault()} // Prevent navigation in builder
              >
                {element.content || 'Link'}
              </a>
            )}
            
            {element.type === 'image' && (
              <div className="relative">
                <img 
                  src={element.attributes.src || 'https://placehold.co/400x200?text=Image'} 
                  alt={element.attributes.alt || 'Image'} 
                  className="h-auto w-full" 
                  style={{
                    borderRadius: element.styles.borderRadius || '0',
                    border: element.styles.border || 'none',
                  }}
                />
                {element.content && (
                  <div className="mt-1 text-center text-sm text-muted-foreground">
                    {element.content}
                  </div>
                )}
              </div>
            )}
            
            {element.type === 'input' && (
              <input 
                type="text" 
                className="border p-1 rounded m-0 w-auto" 
                placeholder={element.attributes.placeholder || 'Input'} 
              />
            )}
            
            {element.type === 'checkbox' && (
              <div className="flex items-center space-x-2 p-1">
                <input type="checkbox" className="h-4 w-4" />
                <label>{element.content || 'Checkbox'}</label>
              </div>
            )}
            
            {element.type === 'radio' && (
              <div className="flex items-center space-x-2 p-1">
                <input type="radio" className="h-4 w-4" name={element.attributes.name || 'radio-group'} />
                <label>{element.content || 'Radio'}</label>
              </div>
            )}
            
            {element.type === 'select' && (
              <select className="border p-1 rounded m-0 w-full">
                <option value="">{element.content || 'Select an option'}</option>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
                <option value="option3">Option 3</option>
              </select>
            )}
            
            {element.type === 'textarea' && (
              <textarea 
                className="border p-1 rounded m-0 min-w-[200px] min-h-[100px]" 
                placeholder={element.attributes.placeholder || 'Textarea'} 
              />
            )}
            
            {element.type === 'group' && element.children && renderGroupContainer()}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={handlePaste}>
          <Clipboard className="h-4 w-4 mr-2" />
          Paste
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        {selectedElementIds.length > 1 && !element.isGroup && (
          <ContextMenuItem onClick={handleGroup}>
            <Group className="h-4 w-4 mr-2" />
            Group Elements
            <ContextMenuShortcut>Ctrl+G</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {element.isGroup && (
          <ContextMenuItem onClick={handleUngroup}>
            <Ungroup className="h-4 w-4 mr-2" />
            Ungroup
            <ContextMenuShortcut>Ctrl+Shift+G</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleDelete} className="text-destructive">
          <Trash className="h-4 w-4 mr-2" />
          Delete
          <ContextMenuShortcut>Delete</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
} 