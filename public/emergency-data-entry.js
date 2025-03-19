// Emergency data entry tool - completely bypasses React
(function() {
  console.log('[EMERGENCY] Emergency data entry tool activated');
  
  // Track edited elements
  const trackedElements = {};
  
  // Add double-click handler to entire document
  document.addEventListener('dblclick', function(e) {
    // Find the closest input-like element
    const target = e.target.closest('input') || 
                   e.target.closest('textarea') || 
                   e.target.closest('.editable') ||
                   e.target;
    
    // Check if this is a label with a "for" attribute
    if (target.tagName === 'LABEL' && target.getAttribute('for')) {
      const inputId = target.getAttribute('for');
      const input = document.getElementById(inputId);
      if (input) {
        openValueEditor(input, e.clientX, e.clientY);
        return;
      }
    }
    
    // Check for non-editable but display-like elements (often used in dashboards)
    const isDisplayValue = 
      target.classList.contains('value') || 
      target.classList.contains('amount') ||
      target.classList.contains('number') ||
      target.parentElement.classList.contains('value') ||
      target.parentElement.classList.contains('field') ||
      target.parentElement.classList.contains('input-wrapper');
    
    // Open editor for input elements or display values
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        isDisplayValue) {
      openValueEditor(target, e.clientX, e.clientY);
    }
  });
  
  // Create a value editor popup
  function openValueEditor(element, x, y) {
    if (trackedElements[element.id]) {
      return; // prevent duplicate editors
    }
    
    // Create unique ID if none exists
    if (!element.id) {
      element.id = 'emergency-editable-' + Math.random().toString(36).substring(2, 11);
    }
    
    console.log('[EMERGENCY] Opening value editor for:', element);
    
    // Get current value
    const currentValue = element.value || element.textContent || '0';
    
    // Create editor container
    const editor = document.createElement('div');
    editor.className = 'emergency-editor';
    editor.style.position = 'fixed';
    editor.style.left = x + 'px';
    editor.style.top = y + 'px';
    editor.style.backgroundColor = 'white';
    editor.style.border = '2px solid #3b82f6';
    editor.style.borderRadius = '8px';
    editor.style.padding = '10px';
    editor.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    editor.style.zIndex = '999999';
    editor.style.width = '300px';
    
    // Create title
    const title = document.createElement('div');
    title.textContent = 'Emergency Data Entry';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    title.style.color = '#3b82f6';
    editor.appendChild(title);
    
    // Create label
    const label = document.createElement('div');
    label.textContent = 'Enter value:';
    label.style.marginBottom = '5px';
    editor.appendChild(label);
    
    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.style.width = '100%';
    input.style.padding = '8px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    input.style.marginBottom = '10px';
    input.style.boxSizing = 'border-box';
    editor.appendChild(input);
    
    // Focus input
    setTimeout(() => input.focus(), 0);
    
    // Create buttons container
    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'space-between';
    
    // Create save button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.style.padding = '8px 16px';
    saveButton.style.backgroundColor = '#3b82f6';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '4px';
    saveButton.style.cursor = 'pointer';
    
    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.backgroundColor = '#f3f4f6';
    cancelButton.style.color = '#333';
    cancelButton.style.border = '1px solid #ddd';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';
    
    // Add buttons to container
    buttons.appendChild(cancelButton);
    buttons.appendChild(saveButton);
    editor.appendChild(buttons);
    
    // Add to document
    document.body.appendChild(editor);
    
    // Track this element
    trackedElements[element.id] = {
      element: element,
      editor: editor
    };
    
    // Handle save
    saveButton.addEventListener('click', function() {
      applyValue(element, input.value);
      closeEditor(element.id);
    });
    
    // Handle cancel
    cancelButton.addEventListener('click', function() {
      closeEditor(element.id);
    });
    
    // Handle enter key
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        applyValue(element, input.value);
        closeEditor(element.id);
      } else if (e.key === 'Escape') {
        closeEditor(element.id);
      }
    });
  }
  
  // Close the editor
  function closeEditor(id) {
    if (trackedElements[id]) {
      trackedElements[id].editor.remove();
      delete trackedElements[id];
    }
  }
  
  // Apply value to the element and trigger appropriate events
  function applyValue(element, value) {
    console.log('[EMERGENCY] Applying value:', value, 'to element:', element);
    
    // For input elements
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      // Set the value
      element.value = value;
      
      // Manually update React's internal state by triggering multiple events
      // Input event
      const inputEvent = new Event('input', { bubbles: true });
      element.dispatchEvent(inputEvent);
      
      // Change event
      const changeEvent = new Event('change', { bubbles: true });
      Object.defineProperty(changeEvent, 'target', {
        get: function() {
          return { value: value };
        }
      });
      element.dispatchEvent(changeEvent);
      
      // Also try React's synthetic event (this is a best effort)
      try {
        // Try to access React's internal setter
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(element),
          'value'
        );
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, value);
        }
      } catch (err) {
        console.warn('[EMERGENCY] Error accessing property descriptor:', err);
      }
      
      // Create a key event (some React components rely on these)
      ['keydown', 'keypress', 'keyup'].forEach(eventType => {
        const keyEvent = new KeyboardEvent(eventType, {
          bubbles: true,
          cancelable: true,
          key: 'Enter'
        });
        element.dispatchEvent(keyEvent);
      });
    }
    // For other elements (display values)
    else {
      // Update text content
      element.textContent = value;
      
      // For display elements, try to find associated input
      const nearestInput = findNearestInput(element);
      if (nearestInput) {
        applyValue(nearestInput, value);
      }
      
      // Create a custom event that our numeric fix might catch
      const customEvent = new CustomEvent('emergency-value-change', {
        bubbles: true,
        detail: { value: value, element: element }
      });
      element.dispatchEvent(customEvent);
    }
    
    // Add visual feedback
    const valueDisplay = document.createElement('div');
    valueDisplay.textContent = "Value set: " + value;
    valueDisplay.style.position = 'fixed';
    valueDisplay.style.bottom = '20px';
    valueDisplay.style.right = '20px';
    valueDisplay.style.backgroundColor = '#3b82f6';
    valueDisplay.style.color = 'white';
    valueDisplay.style.padding = '10px 20px';
    valueDisplay.style.borderRadius = '4px';
    valueDisplay.style.zIndex = '999999';
    document.body.appendChild(valueDisplay);
    
    // Remove after 3 seconds
    setTimeout(() => {
      valueDisplay.remove();
    }, 3000);
  }
  
  // Find nearest input element for a display value
  function findNearestInput(element) {
    // Check for direct connection via label
    if (element.tagName === 'LABEL' && element.getAttribute('for')) {
      return document.getElementById(element.getAttribute('for'));
    }
    
    // Check if element is inside a label
    const parentLabel = element.closest('label');
    if (parentLabel && parentLabel.getAttribute('for')) {
      return document.getElementById(parentLabel.getAttribute('for'));
    }
    
    // Check surrounding elements for inputs
    let current = element;
    
    // Check siblings
    let sibling = current.nextElementSibling;
    while (sibling) {
      if (sibling.tagName === 'INPUT' || sibling.tagName === 'TEXTAREA') {
        return sibling;
      }
      const nestedInput = sibling.querySelector('input, textarea');
      if (nestedInput) {
        return nestedInput;
      }
      sibling = sibling.nextElementSibling;
    }
    
    // Check parent's siblings
    if (current.parentElement) {
      let parentSibling = current.parentElement.nextElementSibling;
      while (parentSibling) {
        if (parentSibling.tagName === 'INPUT' || parentSibling.tagName === 'TEXTAREA') {
          return parentSibling;
        }
        const nestedInput = parentSibling.querySelector('input, textarea');
        if (nestedInput) {
          return nestedInput;
        }
        parentSibling = parentSibling.nextElementSibling;
      }
    }
    
    // Look for hidden inputs nearby
    const nearbyInputs = document.querySelectorAll('input, textarea');
    let closestInput = null;
    let closestDistance = Infinity;
    
    const rect = element.getBoundingClientRect();
    const elementX = rect.left + rect.width / 2;
    const elementY = rect.top + rect.height / 2;
    
    for (const input of nearbyInputs) {
      const inputRect = input.getBoundingClientRect();
      const inputX = inputRect.left + inputRect.width / 2;
      const inputY = inputRect.top + inputRect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(elementX - inputX, 2) + Math.pow(elementY - inputY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestInput = input;
      }
    }
    
    // Only return if reasonably close (within 200px)
    if (closestDistance < 200) {
      return closestInput;
    }
    
    return null;
  }
  
  // Add instructions to page
  function addInstructions() {
    const instructions = document.createElement('div');
    instructions.innerHTML = `
      <div style="position: fixed; bottom: 10px; left: 10px; padding: 10px; 
                  background-color: rgba(59, 130, 246, 0.9); color: white; 
                  border-radius: 8px; font-size: 14px; z-index: 999998; 
                  max-width: 220px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
        <strong>Emergency Data Entry</strong>
        <p style="margin: 5px 0">Double-click any input field to edit its value</p>
        <button id="dismiss-emergency-instructions" style="background: #2563eb; 
                border: none; color: white; padding: 3px 8px; border-radius: 4px;
                font-size: 12px; cursor: pointer;">Dismiss</button>
      </div>
    `;
    document.body.appendChild(instructions);
    
    document.getElementById('dismiss-emergency-instructions').addEventListener('click', function() {
      instructions.remove();
    });
  }
  
  // Initialize when the DOM is loaded
  window.addEventListener('DOMContentLoaded', () => {
    console.log('[EMERGENCY] DOM loaded, initializing emergency data entry tool');
    setTimeout(addInstructions, 2000);
  });
  
  // Expose global functions for debugging
  window.emergencyDataEntry = {
    openEditor: function(selector) {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        openValueEditor(element, rect.left, rect.top);
      } else {
        console.error('[EMERGENCY] Element not found:', selector);
      }
    },
    setValue: function(selector, value) {
      const element = document.querySelector(selector);
      if (element) {
        applyValue(element, value);
      } else {
        console.error('[EMERGENCY] Element not found:', selector);
      }
    }
  };
})(); 