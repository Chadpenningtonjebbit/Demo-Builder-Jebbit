import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Quiz, QuizElement, QuizScreen, ViewMode, ElementType, SectionType, QuizSection, SectionLayout, FlexDirection, FlexWrap, JustifyContent, AlignItems, AlignContent } from '@/types';

interface QuizState {
  quiz: Quiz;
  selectedElementIds: string[];
  selectedSectionId: SectionType | null;
  viewMode: ViewMode;
  codeView: {
    html: string;
    css: string;
  };
  history: Quiz[];
  historyIndex: number;
  clipboard: QuizElement[];
  
  // Quiz actions
  createQuiz: (name: string) => void;
  addScreen: () => void;
  removeScreen: (screenId: string) => void;
  setCurrentScreen: (index: number) => void;
  
  // Section actions
  toggleSection: (sectionId: SectionType) => void;
  selectSection: (sectionId: SectionType | null) => void;
  updateSectionStyles: (sectionId: SectionType, styles: Partial<Record<string, string>>) => void;
  updateSectionLayout: (sectionId: SectionType, layout: Partial<SectionLayout>) => void;
  
  // Element actions
  addElement: (type: ElementType, sectionId: SectionType, screenId?: string) => void;
  updateElement: (elementId: string, updates: Partial<QuizElement>) => void;
  removeElement: (elementId: string) => void;
  removeSelectedElements: () => void;
  moveElement: (elementId: string, targetSectionId: SectionType) => void;
  selectElement: (elementId: string | null, isMultiSelect?: boolean) => void;
  copySelectedElements: () => void;
  pasteElements: (targetSectionId?: SectionType) => void;
  reorderElement: (elementId: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  
  // Group actions
  groupSelectedElements: () => void;
  ungroupElements: (groupId: string) => void;
  updateGroupStyles: (groupId: string, styles: Partial<Record<string, string>>) => void;
  updateGroupLayout: (groupId: string, layout: Partial<SectionLayout>) => void;
  
  // View actions
  setViewMode: (mode: ViewMode) => void;
  updateCodeView: (html: string, css: string) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  saveToHistory: (quiz: Quiz) => void;
}

// Create default section
const createDefaultSection = (id: SectionType, name: string, enabled: boolean): QuizSection => {
  // Default styles based on section type
  let defaultStyles: Record<string, string> = {
    padding: '16px',
    margin: '0px',
    borderRadius: '0px',
  };
  
  if (id === 'header') {
    defaultStyles = {
      ...defaultStyles,
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
    };
  } else if (id === 'footer') {
    defaultStyles = {
      ...defaultStyles,
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
    };
  } else {
    defaultStyles = {
      ...defaultStyles,
      backgroundColor: '#ffffff',
      border: 'none',
    };
  }
  
  // Default flexbox layout
  const defaultLayout: SectionLayout = {
    direction: 'column',
    wrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'flex-start',
    gap: '16px',
  };
  
  return {
    id,
    name,
    enabled,
    elements: [],
    styles: defaultStyles,
    layout: defaultLayout,
  };
};

const initialQuiz: Quiz = {
  id: uuidv4(),
  name: 'New Quiz',
  screens: [
    {
      id: uuidv4(),
      name: 'Screen 1',
      sections: {
        header: createDefaultSection('header', 'Header', false),
        body: createDefaultSection('body', 'Body', true),
        footer: createDefaultSection('footer', 'Footer', false),
      },
    },
  ],
  currentScreenIndex: 0,
};

export const useQuizStore = create<QuizState>((set, get) => ({
  quiz: initialQuiz,
  selectedElementIds: [],
  selectedSectionId: null,
  viewMode: 'desktop',
  codeView: {
    html: '',
    css: '',
  },
  history: [initialQuiz],
  historyIndex: 0,
  clipboard: [],
  
  // Helper function to save current state to history
  saveToHistory: (quiz) => set((state) => {
    // If we're not at the end of the history, truncate it
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    
    // Add the new state to history (deep clone to avoid reference issues)
    newHistory.push(JSON.parse(JSON.stringify(quiz)));
    
    // Limit history to 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  }),
  
  // Undo action
  undo: () => set((state) => {
    if (state.historyIndex <= 0) return state;
    
    const newIndex = state.historyIndex - 1;
    return {
      quiz: JSON.parse(JSON.stringify(state.history[newIndex])),
      historyIndex: newIndex,
    };
  }),
  
  // Redo action
  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state;
    
    const newIndex = state.historyIndex + 1;
    return {
      quiz: JSON.parse(JSON.stringify(state.history[newIndex])),
      historyIndex: newIndex,
    };
  }),
  
  // Quiz actions
  createQuiz: (name) => {
    const newQuiz = {
      ...initialQuiz,
      id: uuidv4(),
      name,
    };
    
    set({ quiz: newQuiz });
    get().saveToHistory(newQuiz);
  },
  
  addScreen: () => set((state) => {
    const newScreen: QuizScreen = {
      id: uuidv4(),
      name: `Screen ${state.quiz.screens.length + 1}`,
      sections: {
        header: createDefaultSection('header', 'Header', false),
        body: createDefaultSection('body', 'Body', true),
        footer: createDefaultSection('footer', 'Footer', false),
      },
    };
    
    const updatedQuiz = {
      ...state.quiz,
      screens: [...state.quiz.screens, newScreen],
      currentScreenIndex: state.quiz.screens.length,
    };
    
    get().saveToHistory(updatedQuiz);
    
    return {
      quiz: updatedQuiz
    };
  }),
  
  removeScreen: (screenId) => set((state) => {
    const screenIndex = state.quiz.screens.findIndex(screen => screen.id === screenId);
    if (screenIndex === -1) return state;
    
    const newScreens = [...state.quiz.screens];
    newScreens.splice(screenIndex, 1);
    
    const updatedQuiz = {
      ...state.quiz,
      screens: newScreens,
      currentScreenIndex: Math.min(state.quiz.currentScreenIndex, newScreens.length - 1),
    };
    
    get().saveToHistory(updatedQuiz);
    
    return {
      quiz: updatedQuiz
    };
  }),
  
  setCurrentScreen: (index) => set((state) => {
    const updatedQuiz = {
      ...state.quiz,
      currentScreenIndex: index,
    };
    
    return {
      quiz: updatedQuiz
    };
  }),
  
  // Section actions
  toggleSection: (sectionId) => set((state) => {
    const currentScreen = state.quiz.screens[state.quiz.currentScreenIndex];
    
    // Toggle the enabled state of the section
    const updatedSections = {
      ...currentScreen.sections,
      [sectionId]: {
        ...currentScreen.sections[sectionId],
        enabled: !currentScreen.sections[sectionId].enabled,
      }
    };
    
    // Update the screen with the new sections
    const updatedScreens = state.quiz.screens.map((screen, index) => {
      if (index === state.quiz.currentScreenIndex) {
        return {
          ...screen,
          sections: updatedSections,
        };
      }
      return screen;
    });
    
    const updatedQuiz = {
      ...state.quiz,
      screens: updatedScreens,
    };
    
    get().saveToHistory(updatedQuiz);
    
    return {
      quiz: updatedQuiz
    };
  }),
  
  selectSection: (sectionId) => set({
    selectedSectionId: sectionId,
    selectedElementIds: [], // Deselect any selected elements
  }),
  
  updateSectionStyles: (sectionId, styles) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const currentScreen = state.quiz.screens[currentScreenIndex];
    
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
    
    // Update the section styles
    newScreen.sections[sectionId].styles = {
      ...newScreen.sections[sectionId].styles || {},
      ...styles
    };
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
    return newState;
  }),
  
  updateSectionLayout: (sectionId, layout) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const currentScreen = state.quiz.screens[currentScreenIndex];
    
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
    
    // Update the section layout
    newScreen.sections[sectionId].layout = {
      ...newScreen.sections[sectionId].layout,
      ...layout
    };
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
    return newState;
  }),
  
  // Element actions
  addElement: (type, sectionId, screenId) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const targetScreenId = screenId || state.quiz.screens[currentScreenIndex].id;
    const targetScreenIndex = state.quiz.screens.findIndex(screen => screen.id === targetScreenId);
    
    if (targetScreenIndex === -1) return state;
    
    // Default styles based on element type
    let defaultStyles = {};
    
    // Set default styles for each element type
    switch (type) {
      case 'button':
        defaultStyles = {
          padding: '8px 16px',
          borderRadius: '4px',
          backgroundColor: '#3b82f6',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'normal',
          cursor: 'pointer'
        };
        break;
      case 'text':
        defaultStyles = {
          fontSize: '16px',
          color: '#000000',
          fontWeight: 'normal'
        };
        break;
    }
    
    const newElement: QuizElement = {
      id: uuidv4(),
      type,
      content: type === 'text' ? 'New Text' : 
               type === 'button' ? 'Button' : '',
      styles: defaultStyles,
      attributes: {},
      sectionId,
    };
    
    // Create a copy of the current screen
    const currentScreen = { ...state.quiz.screens[targetScreenIndex] };
    
    // Add the new element to the specified section
    const updatedSection = {
      ...currentScreen.sections[sectionId],
      elements: [...currentScreen.sections[sectionId].elements, newElement],
    };
    
    // Update the sections in the screen
    const updatedSections = {
      ...currentScreen.sections,
      [sectionId]: updatedSection,
    };
    
    // Create the updated screen
    const updatedScreen = {
      ...currentScreen,
      sections: updatedSections,
    };
    
    // Update the screens array
    const updatedScreens = state.quiz.screens.map((screen, index) => {
      if (index === targetScreenIndex) {
        return updatedScreen;
      }
      return screen;
    });
    
    const updatedQuiz = {
      ...state.quiz,
      screens: updatedScreens,
    };
    
    get().saveToHistory(updatedQuiz);
    
    return {
      quiz: updatedQuiz,
      selectedElementIds: [newElement.id],
    };
  }),
  
  updateElement: (elementId, updates) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const currentScreen = state.quiz.screens[currentScreenIndex];
    
    // Create a copy of the sections
    const updatedSections = { ...currentScreen.sections };
    
    // Find the element in each section and update it if found
    let elementFound = false;
    
    // Helper function to deep clone an object
    const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));
    
    // Recursive function to find and update an element in nested groups
    const updateElementInGroup = (group: QuizElement, targetId: string, updates: Partial<QuizElement>): boolean => {
      if (!group.isGroup || !group.children) return false;
      
      // Check direct children of this group
      const childIndex = group.children.findIndex((child: QuizElement) => child.id === targetId);
      if (childIndex !== -1) {
        // Update the child element
        group.children[childIndex] = {
          ...group.children[childIndex],
          ...updates,
        };
        return true;
      }
      
      // Check nested groups
      for (let i = 0; i < group.children.length; i++) {
        const childElement = group.children[i];
        if (childElement.isGroup && childElement.children) {
          const found = updateElementInGroup(childElement, targetId, updates);
          if (found) return true;
        }
      }
      
      return false;
    };
    
    // First, check if the element is directly in a section
    Object.keys(updatedSections).forEach((sectionKey) => {
      const sectionId = sectionKey as SectionType;
      const section = updatedSections[sectionId];
      
      const elementIndex = section.elements.findIndex(el => el.id === elementId);
      if (elementIndex !== -1) {
        elementFound = true;
        
        // Create a copy of the elements array
        const updatedElements = [...section.elements];
        
        // Update the element
        updatedElements[elementIndex] = {
          ...updatedElements[elementIndex],
          ...updates,
        };
        
        // Update the section with the new elements
        updatedSections[sectionId] = {
          ...section,
          elements: updatedElements,
        };
      }
    });
    
    // If not found directly in a section, check inside groups
    if (!elementFound) {
      Object.keys(updatedSections).forEach((sectionKey) => {
        if (elementFound) return; // Skip if already found
        
        const sectionId = sectionKey as SectionType;
        const section = updatedSections[sectionId];
        
        // Create a copy of the elements array
        const updatedElements = deepClone(section.elements);
        
        // Check each element to see if it's a group
        for (let i = 0; i < updatedElements.length; i++) {
          const element = updatedElements[i];
          
          if (element.isGroup && element.children) {
            // Try to update the element in this group (including nested groups)
            const found = updateElementInGroup(element, elementId, updates);
            
            if (found) {
              elementFound = true;
              
              // Update the section with the modified group
              updatedSections[sectionId] = {
                ...section,
                elements: updatedElements,
              };
              
              break; // Exit the loop once found
            }
          }
        }
      });
    }
    
    if (!elementFound) return state;
    
    // Update the screen with the new sections
    const updatedScreens = state.quiz.screens.map((screen, index) => {
      if (index === currentScreenIndex) {
        return {
          ...screen,
          sections: updatedSections,
        };
      }
      return screen;
    });
    
    // Create the updated quiz
    const updatedQuiz = {
      ...state.quiz,
      screens: updatedScreens,
    };
    
    // Save to history
    get().saveToHistory(updatedQuiz);
    
    return {
      ...state,
      quiz: updatedQuiz,
    };
  }),
  
  removeElement: (elementId: string) => set((state) => {
    const { quiz } = state;
    const currentScreen = quiz.screens[quiz.currentScreenIndex];
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[quiz.currentScreenIndex];
    let elementRemoved = false;
    
    // Recursive function to remove an element from nested groups
    const removeElementFromGroup = (group: QuizElement, targetId: string): boolean => {
      if (!group.isGroup || !group.children) return false;
      
      // Check if the element is a direct child of this group
      const initialLength = group.children.length;
      group.children = group.children.filter((child: QuizElement) => child.id !== targetId);
      
      if (group.children.length < initialLength) {
        return true; // Element was found and removed
      }
      
      // If not found directly, check nested groups
      for (let i = 0; i < group.children.length; i++) {
        const childElement = group.children[i];
        if (childElement.isGroup && childElement.children) {
          const removed = removeElementFromGroup(childElement, targetId);
          if (removed) return true;
        }
      }
      
      return false;
    };
    
    // First try to remove the element directly from sections
    for (const sectionKey of Object.keys(newScreen.sections) as SectionType[]) {
      const section = newScreen.sections[sectionKey];
      const initialLength = section.elements.length;
      
      section.elements = section.elements.filter((element: QuizElement) => element.id !== elementId);
      
      if (section.elements.length < initialLength) {
        elementRemoved = true;
        break;
      }
    }
    
    // If not found directly in sections, check inside groups
    if (!elementRemoved) {
      for (const sectionKey of Object.keys(newScreen.sections) as SectionType[]) {
        if (elementRemoved) break;
        
        const section = newScreen.sections[sectionKey];
        
        // Check each group in the section
        for (let i = 0; i < section.elements.length; i++) {
          const element = section.elements[i];
          
          if (element.isGroup && element.children) {
            const removed = removeElementFromGroup(element, elementId);
            if (removed) {
              elementRemoved = true;
              break;
            }
          }
        }
      }
    }
    
    // Save to history if the element was removed
    if (elementRemoved) {
      get().saveToHistory(newState.quiz);
    }
    
    return { 
      ...newState,
      selectedElementIds: state.selectedElementIds.filter(id => id !== elementId)
    };
  }),
  
  moveElement: (elementId, targetSectionId) => set((state) => {
    console.log(`moveElement called with elementId: ${elementId}, targetSectionId: ${targetSectionId}`);
    
    // Get the current screen
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const currentScreen = state.quiz.screens[currentScreenIndex];
    
    // Find the source section and element index
    let sourceSection: SectionType | null = null;
    let elementIndex = -1;
    
    // Check each section for the element
    for (const sectionKey of ['header', 'body', 'footer'] as SectionType[]) {
      const index = currentScreen.sections[sectionKey].elements.findIndex(el => el.id === elementId);
      if (index !== -1) {
        sourceSection = sectionKey;
        elementIndex = index;
        break;
      }
    }
    
    console.log(`Found element in section: ${sourceSection}, at index: ${elementIndex}`);
    
    // If element wasn't found or source is same as target, do nothing
    if (sourceSection === null || elementIndex === -1 || sourceSection === targetSectionId) {
      console.log('No action needed - element not found or already in target section');
      return state;
    }
    
    // Get a reference to the actual element
    const elementToMove = currentScreen.sections[sourceSection].elements[elementIndex];
    console.log(`Element to move:`, elementToMove);
    
    // Create a new state object with the element moved to the new section
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
    
    // Remove the element from the source section
    newScreen.sections[sourceSection].elements.splice(elementIndex, 1);
    
    // Update the element's sectionId
    elementToMove.sectionId = targetSectionId;
    
    // Add the element to the target section
    newScreen.sections[targetSectionId].elements.push(elementToMove);
    
    console.log(`Element moved to section: ${targetSectionId}`);
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
    return newState;
  }),
  
  selectElement: (elementId: string | null, isMultiSelect = false) => {
    if (!elementId) {
      set({ selectedElementIds: [] });
      return;
    }
    
    const { selectedElementIds } = get();
    
    if (isMultiSelect) {
      // If element is already selected, deselect it
      if (selectedElementIds.includes(elementId)) {
        set({ selectedElementIds: selectedElementIds.filter(id => id !== elementId) });
      } else {
        // Add to selection
        set({ selectedElementIds: [...selectedElementIds, elementId] });
      }
    } else {
      // Single selection
      set({ selectedElementIds: [elementId] });
    }
    
    // Always clear section selection when selecting an element
    set({ selectedSectionId: null });
  },
  
  removeSelectedElements: () => {
    const { quiz, selectedElementIds } = get();
    if (selectedElementIds.length === 0) return;
    
    const currentScreen = quiz.screens[quiz.currentScreenIndex];
    
    // Update each section to remove the selected elements
    const updatedSections = Object.entries(currentScreen.sections).reduce(
      (acc, [sectionId, section]) => {
        return {
          ...acc,
          [sectionId]: {
            ...section,
            elements: section.elements.filter((element) => !selectedElementIds.includes(element.id)),
          },
        };
      },
      {} as Record<SectionType, QuizSection>
    );
    
    // Update the quiz with the new sections
    const updatedScreens = [...quiz.screens];
    updatedScreens[quiz.currentScreenIndex] = {
      ...currentScreen,
      sections: updatedSections as { header: QuizSection; body: QuizSection; footer: QuizSection; },
    };
    
    const updatedQuiz = {
      ...quiz,
      screens: updatedScreens,
    };
    
    set({ 
      quiz: updatedQuiz,
      selectedElementIds: []
    });
    
    get().saveToHistory(updatedQuiz);
  },
  
  // View actions
  setViewMode: (mode) => {
    console.log('Setting view mode in store:', mode);
    set({
      viewMode: mode,
    });
    console.log('View mode set in store:', get().viewMode);
  },
  
  updateCodeView: (html, css) => set({
    codeView: {
      html,
      css,
    }
  }),
  
  copySelectedElements: () => {
    const { quiz, selectedElementIds } = get();
    if (selectedElementIds.length === 0) return;
    
    const currentScreen = quiz.screens[quiz.currentScreenIndex];
    const elementsToCopy: QuizElement[] = [];
    
    // Find all selected elements across all sections
    Object.values(currentScreen.sections).forEach(section => {
      section.elements.forEach(element => {
        if (selectedElementIds.includes(element.id)) {
          // Create a deep copy of the element
          elementsToCopy.push(JSON.parse(JSON.stringify(element)));
        }
      });
    });
    
    // Store in clipboard
    set({ clipboard: elementsToCopy });
  },
  
  pasteElements: (targetSectionId?: SectionType) => {
    const { quiz, clipboard, selectedSectionId } = get();
    if (clipboard.length === 0) return;
    
    // Use provided section ID or the currently selected section or default to body
    const sectionId = targetSectionId || selectedSectionId || 'body';
    const currentScreen = quiz.screens[quiz.currentScreenIndex];
    
    // Create new elements with new IDs and update their section ID
    const newElements = clipboard.map(element => {
      const newElement = { 
        ...JSON.parse(JSON.stringify(element)),
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sectionId: sectionId
      };
      
      // Slightly offset position for visual feedback
      if (newElement.styles) {
        const left = parseInt(newElement.styles.left as string || '0');
        const top = parseInt(newElement.styles.top as string || '0');
        newElement.styles.left = `${left + 10}px`;
        newElement.styles.top = `${top + 10}px`;
      }
      
      return newElement;
    });
    
    // Add the new elements to the section
    const updatedSection = {
      ...currentScreen.sections[sectionId],
      elements: [...currentScreen.sections[sectionId].elements, ...newElements]
    };
    
    // Update the screen with the new section
    const updatedSections = {
      ...currentScreen.sections,
      [sectionId]: updatedSection
    };
    
    const updatedScreens = [...quiz.screens];
    updatedScreens[quiz.currentScreenIndex] = {
      ...currentScreen,
      sections: updatedSections,
    };
    
    const updatedQuiz = {
      ...quiz,
      screens: updatedScreens,
    };
    
    // Select the newly pasted elements
    const newElementIds = newElements.map(el => el.id);
    
    set({ 
      quiz: updatedQuiz,
      selectedElementIds: newElementIds
    });
    
    get().saveToHistory(updatedQuiz);
  },
  
  // Group selected elements
  groupSelectedElements: () => set((state) => {
    const { selectedElementIds } = state;
    
    // Need at least 2 elements to form a group
    if (selectedElementIds.length < 2) return state;
    
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const currentScreen = state.quiz.screens[currentScreenIndex];
    
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
    
    // Find all selected elements
    const selectedElements: QuizElement[] = [];
    const sectionIds = new Set<SectionType>();
    const groupIds = new Set<string>();
    
    // Collect all selected elements and their section IDs
    selectedElementIds.forEach(id => {
      let found = false;
      
      // First check direct children of sections
      for (const sectionId of Object.keys(currentScreen.sections) as SectionType[]) {
        const section = currentScreen.sections[sectionId];
        const element = section.elements.find(el => el.id === id);
        if (element) {
          selectedElements.push(element);
          sectionIds.add(sectionId);
          found = true;
          break;
        }
      }
      
      // If not found directly in a section, check inside groups
      if (!found) {
        for (const sectionId of Object.keys(currentScreen.sections) as SectionType[]) {
          const section = currentScreen.sections[sectionId];
          
          // Check each group in the section
          for (const groupElement of section.elements) {
            if (groupElement.isGroup && groupElement.children) {
              const childElement = groupElement.children.find((child: QuizElement) => child.id === id);
              if (childElement) {
                selectedElements.push(childElement);
                sectionIds.add(sectionId);
                groupIds.add(groupElement.id);
                found = true;
                break;
              }
            }
          }
          if (found) break;
        }
      }
    });
    
    // Can only group elements from the same section
    if (sectionIds.size !== 1) return state;
    
    // Can only group elements from the same parent (either all from a section or all from the same group)
    if (groupIds.size > 1) return state;
    
    // Get the section ID
    const sectionId = Array.from(sectionIds)[0];
    
    // Determine the parent layout properties
    let parentDirection: FlexDirection = 'row';
    let parentWrap: FlexWrap = 'nowrap';
    let parentJustifyContent: JustifyContent = 'flex-start';
    let parentAlignItems: AlignItems = 'center';
    
    // If all elements are from a group, use that group's layout
    if (groupIds.size === 1) {
      const parentGroupId = Array.from(groupIds)[0];
      const section = currentScreen.sections[sectionId];
      const parentGroup = section.elements.find(el => el.id === parentGroupId && el.isGroup);
      
      if (parentGroup && parentGroup.layout) {
        parentDirection = parentGroup.layout.direction || 'row';
        parentWrap = parentGroup.layout.wrap || 'nowrap';
        parentJustifyContent = parentGroup.layout.justifyContent || 'flex-start';
        parentAlignItems = parentGroup.layout.alignItems || 'center';
      }
    } else {
      // Otherwise use the section's layout
      const parentSection = currentScreen.sections[sectionId];
      parentDirection = parentSection.layout.direction || 'row';
      parentWrap = parentSection.layout.wrap || 'nowrap';
      parentJustifyContent = parentSection.layout.justifyContent || 'flex-start';
      parentAlignItems = parentSection.layout.alignItems || 'center';
    }
    
    // Create a new group element
    const groupId = uuidv4();
    const groupElement: QuizElement = {
      id: groupId,
      type: 'group',
      content: 'Group',
      styles: {
        padding: '8px',
        margin: '0px',
        borderRadius: '0px',
        border: 'none', // Set border to none by default
        backgroundColor: 'transparent',
      },
      attributes: {},
      sectionId,
      isGroup: true,
      children: [],
      layout: {
        direction: parentDirection,
        wrap: parentWrap,
        justifyContent: parentJustifyContent,
        alignItems: parentAlignItems,
        alignContent: 'flex-start',
        gap: '8px',
      },
    };
    
    // If all elements are from a group, set the groupId for the new group
    if (groupIds.size === 1) {
      groupElement.groupId = Array.from(groupIds)[0];
    }
    
    // Add all selected elements to the group
    const section = newScreen.sections[sectionId];
    const elementsToRemove = new Set(selectedElementIds);
    
    // If elements are from a section, filter them out and add to the group
    if (groupIds.size === 0) {
      // Filter out elements that will be in the group
      section.elements = section.elements.filter((el: QuizElement) => {
        if (elementsToRemove.has(el.id)) {
          // Clone the element and add it to the group
          const clonedElement = JSON.parse(JSON.stringify(el));
          clonedElement.groupId = groupId;
          groupElement.children!.push(clonedElement);
          return false;
        }
        return true;
      });
      
      // Add the group to the section
      section.elements.push(groupElement);
    } else {
      // Elements are from a group, find the parent group
      const parentGroupId = Array.from(groupIds)[0];
      const parentGroupIndex = section.elements.findIndex((el: QuizElement) => el.id === parentGroupId && el.isGroup);
      
      if (parentGroupIndex !== -1) {
        const parentGroup = section.elements[parentGroupIndex];
        
        // Filter out elements from the parent group that will be in the new group
        parentGroup.children = parentGroup.children!.filter((el: QuizElement) => {
          if (elementsToRemove.has(el.id)) {
            // Clone the element and add it to the new group
            const clonedElement = JSON.parse(JSON.stringify(el));
            clonedElement.groupId = groupId;
            groupElement.children!.push(clonedElement);
            return false;
          }
          return true;
        });
        
        // Add the new group to the parent group's children
        parentGroup.children!.push(groupElement);
      }
    }
    
    // Select only the group
    newState.selectedElementIds = [groupId];
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
    return newState;
  }),
  
  // Ungroup elements
  ungroupElements: (groupId) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const currentScreen = state.quiz.screens[currentScreenIndex];
    
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
    
    // Find the group
    let groupElement: QuizElement | null = null;
    let sectionId: SectionType | null = null;
    let parentGroupId: string | null = null;
    
    // Find the group element and its section
    for (const secId of Object.keys(currentScreen.sections) as SectionType[]) {
      const section = currentScreen.sections[secId];
      
      // First check if the group is directly in the section
      const group = section.elements.find(el => el.id === groupId && el.isGroup);
      if (group) {
        groupElement = group;
        sectionId = secId;
        break;
      }
      
      // If not found directly in the section, check inside other groups
      for (const parentGroup of section.elements) {
        if (parentGroup.isGroup && parentGroup.children) {
          const nestedGroup = parentGroup.children.find(child => child.id === groupId && child.isGroup);
          if (nestedGroup) {
            groupElement = nestedGroup;
            sectionId = secId;
            parentGroupId = parentGroup.id;
            break;
          }
        }
      }
      
      if (groupElement) break;
    }
    
    if (!groupElement || !sectionId || !groupElement.children) return state;
    
    const childrenIds: string[] = [];
    
    // If the group is directly in a section
    if (!parentGroupId) {
      // Get the section
      const section = newScreen.sections[sectionId];
      
      // Remove the group from the section
      section.elements = section.elements.filter((el: QuizElement) => el.id !== groupId);
      
      // Add all children back to the section
      groupElement.children.forEach(child => {
        // Remove the groupId reference
        delete child.groupId;
        childrenIds.push(child.id);
        section.elements.push(child);
      });
    } else {
      // The group is nested inside another group
      const section = newScreen.sections[sectionId];
      const parentGroupIndex = section.elements.findIndex((el: QuizElement) => el.id === parentGroupId);
      
      if (parentGroupIndex !== -1) {
        const parentGroup = section.elements[parentGroupIndex];
        
        // Remove the nested group from the parent group
        parentGroup.children = parentGroup.children!.filter((el: QuizElement) => el.id !== groupId);
        
        // Add all children back to the parent group
        groupElement.children.forEach(child => {
          // Update the groupId reference to point to the parent group
          child.groupId = parentGroupId;
          childrenIds.push(child.id);
          parentGroup.children!.push(child);
        });
      }
    }
    
    // Select all the children that were in the group
    newState.selectedElementIds = childrenIds;
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
    return newState;
  }),
  
  // Update group styles
  updateGroupStyles: (groupId, styles) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const currentScreen = state.quiz.screens[currentScreenIndex];
    
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
    
    let updated = false;
    
    // Find the group and update its styles
    for (const sectionId of Object.keys(currentScreen.sections) as SectionType[]) {
      const section = newScreen.sections[sectionId];
      
      // First check if the group is directly in the section
      const groupIndex = section.elements.findIndex((el: QuizElement) => el.id === groupId && el.isGroup);
      
      if (groupIndex !== -1) {
        section.elements[groupIndex].styles = {
          ...section.elements[groupIndex].styles,
          ...styles,
        };
        updated = true;
        break;
      }
      
      // If not found directly in the section, check inside other groups
      if (!updated) {
        for (let i = 0; i < section.elements.length; i++) {
          const parentGroup = section.elements[i];
          if (parentGroup.isGroup && parentGroup.children) {
            const nestedGroupIndex = parentGroup.children.findIndex(
              (child: QuizElement) => child.id === groupId && child.isGroup
            );
            
            if (nestedGroupIndex !== -1) {
              parentGroup.children[nestedGroupIndex].styles = {
                ...parentGroup.children[nestedGroupIndex].styles,
                ...styles,
              };
              updated = true;
              break;
            }
          }
        }
      }
      
      if (updated) break;
    }
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
    return newState;
  }),
  
  // Update group layout
  updateGroupLayout: (groupId, layout) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const currentScreen = state.quiz.screens[currentScreenIndex];
    
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
    
    let updated = false;
    
    // Find the group and update its layout
    for (const sectionId of Object.keys(currentScreen.sections) as SectionType[]) {
      const section = newScreen.sections[sectionId];
      
      // First check if the group is directly in the section
      const groupIndex = section.elements.findIndex((el: QuizElement) => el.id === groupId && el.isGroup);
      
      if (groupIndex !== -1) {
        section.elements[groupIndex].layout = {
          ...section.elements[groupIndex].layout,
          ...layout,
        };
        updated = true;
        break;
      }
      
      // If not found directly in the section, check inside other groups
      if (!updated) {
        for (let i = 0; i < section.elements.length; i++) {
          const parentGroup = section.elements[i];
          if (parentGroup.isGroup && parentGroup.children) {
            const nestedGroupIndex = parentGroup.children.findIndex(
              (child: QuizElement) => child.id === groupId && child.isGroup
            );
            
            if (nestedGroupIndex !== -1) {
              parentGroup.children[nestedGroupIndex].layout = {
                ...parentGroup.children[nestedGroupIndex].layout,
                ...layout,
              };
              updated = true;
              break;
            }
          }
        }
      }
      
      if (updated) break;
    }
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
    return newState;
  }),
  
  // Reorder element within its container
  reorderElement: (elementId, direction) => set((state) => {
    const currentScreenIndex = state.quiz.currentScreenIndex;
    const currentScreen = state.quiz.screens[currentScreenIndex];
    
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state));
    const newScreen = newState.quiz.screens[currentScreenIndex];
    
    // Find the element
    let foundElement: QuizElement | null = null;
    let foundSectionId: SectionType | null = null;
    let foundGroupId: string | null = null;
    
    // First, check if the element is in a group
    for (const sectionId of Object.keys(currentScreen.sections) as SectionType[]) {
      const section = currentScreen.sections[sectionId];
      
      // Check if the element is in a group in this section
      for (const groupElement of section.elements) {
        if (groupElement.isGroup && groupElement.children) {
          const childIndex = groupElement.children.findIndex((child: QuizElement) => child.id === elementId);
          
          if (childIndex !== -1) {
            foundElement = groupElement.children[childIndex];
            foundSectionId = sectionId;
            foundGroupId = groupElement.id;
            break;
          }
        }
      }
      
      if (foundElement) break;
      
      // Check if the element is directly in this section
      const elementIndex = section.elements.findIndex((el: QuizElement) => el.id === elementId);
      
      if (elementIndex !== -1) {
        foundElement = section.elements[elementIndex];
        foundSectionId = sectionId;
        break;
      }
    }
    
    if (!foundElement || !foundSectionId) return state;
    
    // Handle reordering based on whether the element is in a group or directly in a section
    if (foundGroupId) {
      // Element is in a group
      const section = newScreen.sections[foundSectionId];
      const groupIndex = section.elements.findIndex((el: QuizElement) => el.id === foundGroupId);
      
      if (groupIndex !== -1 && section.elements[groupIndex].children) {
        const group = section.elements[groupIndex];
        const childIndex = group.children!.findIndex((child: QuizElement) => child.id === elementId);
        
        if (childIndex !== -1) {
          // Determine new index based on direction
          let newIndex = childIndex;
          if (direction === 'up' || direction === 'left') {
            newIndex = Math.max(0, childIndex - 1);
          } else {
            newIndex = Math.min(group.children!.length - 1, childIndex + 1);
          }
          
          // Don't do anything if the element is already at the edge
          if (newIndex === childIndex) return state;
          
          // Swap the elements
          const temp = group.children![childIndex];
          group.children![childIndex] = group.children![newIndex];
          group.children![newIndex] = temp;
        }
      }
    } else {
      // Element is directly in a section
      const section = newScreen.sections[foundSectionId];
      const elementIndex = section.elements.findIndex((el: QuizElement) => el.id === elementId);
      
      if (elementIndex !== -1) {
        // Determine new index based on direction
        let newIndex = elementIndex;
        if (direction === 'up' || direction === 'left') {
          newIndex = Math.max(0, elementIndex - 1);
        } else {
          newIndex = Math.min(section.elements.length - 1, elementIndex + 1);
        }
        
        // Don't do anything if the element is already at the edge
        if (newIndex === elementIndex) return state;
        
        // Swap the elements
        const temp = section.elements[elementIndex];
        section.elements[elementIndex] = section.elements[newIndex];
        section.elements[newIndex] = temp;
      }
    }
    
    // Save to history
    get().saveToHistory(newState.quiz);
    
    return newState;
  }),
})); 