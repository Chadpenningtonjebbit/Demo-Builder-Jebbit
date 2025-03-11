import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { QuizElement, QuizScreen, SectionType } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateElementHtml(element: QuizElement): string {
  let html = ''
  
  switch (element.type) {
    case 'text':
      html = `<p id="${element.id}">${element.content}</p>`
      break
    case 'button':
      html = `<button id="${element.id}">${element.content}</button>`
      break
    case 'image':
      html = `<img id="${element.id}" src="${element.attributes.src || ''}" alt="${element.attributes.alt || ''}" />`
      break
    case 'input':
      html = `<input id="${element.id}" type="text" placeholder="${element.attributes.placeholder || ''}" name="${element.attributes.name || ''}" />`
      break
    case 'checkbox':
      html = `<div id="${element.id}">
  <input type="checkbox" id="${element.id}-checkbox" name="${element.attributes.name || ''}" />
  <label for="${element.id}-checkbox">${element.content || 'Checkbox'}</label>
</div>`
      break
    case 'radio':
      html = `<div id="${element.id}">
  <input type="radio" id="${element.id}-radio" name="${element.attributes.name || ''}" />
  <label for="${element.id}-radio">${element.content || 'Radio'}</label>
</div>`
      break
    case 'select':
      html = `<select id="${element.id}" name="${element.attributes.name || ''}">
  <option value="">${element.content || 'Select an option'}</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
  <option value="option3">Option 3</option>
</select>`
      break
    case 'textarea':
      html = `<textarea id="${element.id}" placeholder="${element.attributes.placeholder || ''}" name="${element.attributes.name || ''}"></textarea>`
      break
    default:
      html = `<div id="${element.id}"></div>`
  }
  
  return html
}

export function generateElementCss(element: QuizElement): string {
  const styles = element.styles
  let css = `#${element.id} {\n`
  
  for (const [property, value] of Object.entries(styles)) {
    if (value) {
      // Convert camelCase to kebab-case
      const kebabProperty = property.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
      css += `  ${kebabProperty}: ${value};\n`
    }
  }
  
  css += '}\n'
  
  return css
}

export function generateScreenHtml(screen: QuizScreen): string {
  let html = `<div id="${screen.id}" class="quiz-screen">\n`;
  
  // Process each section
  Object.entries(screen.sections).forEach(([sectionId, section]) => {
    if (section.enabled) {
      html += `  <div id="section-${sectionId}" class="quiz-section quiz-section-${sectionId}">\n`;
      
      // Process elements in this section
      section.elements.forEach(element => {
        html += `    ${generateElementHtml(element).replace(/\n/g, '\n    ')}\n`;
      });
      
      html += `  </div>\n`;
    }
  });
  
  html += '</div>';
  
  return html;
}

export function generateScreenCss(screen: QuizScreen): string {
  let css = `.quiz-screen {\n  width: 100%;\n}\n\n`;
  
  // Add styles for each section
  css += `.quiz-section-header {\n  padding: 10px;\n  border-bottom: 1px solid #e2e8f0;\n}\n\n`;
  css += `.quiz-section-body {\n  padding: 20px;\n  flex: 1;\n}\n\n`;
  css += `.quiz-section-footer {\n  padding: 10px;\n  border-top: 1px solid #e2e8f0;\n}\n\n`;
  
  // Process each section
  Object.entries(screen.sections).forEach(([sectionId, section]) => {
    if (section.enabled) {
      // Add CSS for each element in this section
      section.elements.forEach(element => {
        css += generateElementCss(element) + '\n';
      });
    }
  });
  
  return css;
}

export function parseHtml(html: string): { elements: QuizElement[] } {
  // This is a simplified parser for demonstration purposes
  // In a real application, you would use a proper HTML parser
  
  const elements: QuizElement[] = []
  
  // Simple regex to extract elements (this is not a robust solution)
  const elementRegex = /<([a-z]+)[^>]*id="([^"]+)"[^>]*>([^<]*)<\/\1>/g
  let match
  
  while ((match = elementRegex.exec(html)) !== null) {
    const [_, tagName, id, content] = match
    
    let type: any = 'text'
    switch (tagName) {
      case 'p':
        type = 'text'
        break
      case 'button':
        type = 'button'
        break
      case 'img':
        type = 'image'
        break
      case 'input':
        type = 'input'
        break
      case 'select':
        type = 'select'
        break
      case 'textarea':
        type = 'textarea'
        break
      default:
        type = 'text'
    }
    
    // Try to determine the section from the HTML context
    // Default to 'body' if we can't determine it
    let sectionId: SectionType = 'body'
    
    // Check if the element is inside a section div
    const sectionMatch = html.substring(0, match.index).match(/id="section-([^"]+)"/)
    if (sectionMatch && ['header', 'body', 'footer'].includes(sectionMatch[1])) {
      sectionId = sectionMatch[1] as SectionType
    }
    
    elements.push({
      id,
      type,
      content,
      styles: {},
      attributes: {},
      sectionId,
    })
  }
  
  return { elements }
}

export function parseCss(css: string, elements: QuizElement[]): QuizElement[] {
  // This is a simplified parser for demonstration purposes
  // In a real application, you would use a proper CSS parser
  
  const updatedElements = [...elements]
  
  // Simple regex to extract CSS rules (this is not a robust solution)
  const ruleRegex = /#([a-zA-Z0-9-_]+)\s*{([^}]*)}/g
  let match
  
  while ((match = ruleRegex.exec(css)) !== null) {
    const [_, id, stylesText] = match
    
    const element = updatedElements.find(el => el.id === id)
    if (element) {
      const styleProps = stylesText.split(';').filter(Boolean)
      
      for (const prop of styleProps) {
        const [property, value] = prop.split(':').map(s => s.trim())
        if (property && value) {
          // Convert kebab-case to camelCase
          const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
          element.styles[camelProperty] = value
        }
      }
    }
  }
  
  return updatedElements
}
