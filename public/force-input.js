// Force inputs to work by replacing them with native inputs
(function() {
  console.log('[FORCE-INPUT] Initializing force input script');
  
  // Track original inputs and their wrappers
  const inputMap = new Map();
  
  // Function to create a native input element that mirrors a React input
  function createNativeInput(originalInput) {
    if (!originalInput) return null;
    
    const rect = originalInput.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null; // Skip hidden inputs
    
    // Get computed styles
    const styles = window.getComputedStyle(originalInput);
    
    // Create a new native input
    const nativeInput = document.createElement('input');
    nativeInput.type = originalInput.type || 'text';
    nativeInput.value = originalInput.value || '';
    nativeInput.placeholder = originalInput.placeholder || '';
    nativeInput.className = 'force-native-input';
    
    // Apply positioning
    nativeInput.style.position = 'absolute';
    nativeInput.style.left = rect.left + 'px';
    nativeInput.style.top = rect.top + 'px';
    nativeInput.style.width = rect.width + 'px';
    nativeInput.style.height = rect.height + 'px';
    nativeInput.style.zIndex = '99999';
    
    // Apply styling
    nativeInput.style.backgroundColor = styles.backgroundColor;
    nativeInput.style.color = styles.color;
    nativeInput.style.font = styles.font;
    nativeInput.style.border = styles.border;
    nativeInput.style.borderRadius = styles.borderRadius;
    nativeInput.style.padding = styles.padding;
    
    // Add event listeners to sync with original input
    nativeInput.addEventListener('input', () => {
      // Set value of original input
      originalInput.value = nativeInput.value;
      
      // Trigger React's change event
      const event = new Event('input', { bubbles: true });
      originalInput.dispatchEvent(event);
      
      const changeEvent = new Event('change', { bubbles: true });
      originalInput.dispatchEvent(changeEvent);
      
      // Try to dispatch a React synthetic event
      try {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, "value"
        ).set;
        nativeInputValueSetter.call(originalInput, nativeInput.value);
        const inputEvent = new Event('input', { bubbles: true });
        originalInput.dispatchEvent(inputEvent);
      } catch (err) {
        console.error('[FORCE-INPUT] Error dispatching synthetic event:', err);
      }
    });
    
    // Store the association
    inputMap.set(originalInput, nativeInput);
    
    return nativeInput;
  }
  
  function createNativeTextarea(originalTextarea) {
    if (!originalTextarea) return null;
    
    const rect = originalTextarea.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null; // Skip hidden textareas
    
    // Get computed styles
    const styles = window.getComputedStyle(originalTextarea);
    
    // Create a new native textarea
    const nativeTextarea = document.createElement('textarea');
    nativeTextarea.value = originalTextarea.value || '';
    nativeTextarea.placeholder = originalTextarea.placeholder || '';
    nativeTextarea.className = 'force-native-textarea';
    
    // Apply positioning
    nativeTextarea.style.position = 'absolute';
    nativeTextarea.style.left = rect.left + 'px';
    nativeTextarea.style.top = rect.top + 'px';
    nativeTextarea.style.width = rect.width + 'px';
    nativeTextarea.style.height = rect.height + 'px';
    nativeTextarea.style.zIndex = '99999';
    
    // Apply styling
    nativeTextarea.style.backgroundColor = styles.backgroundColor;
    nativeTextarea.style.color = styles.color;
    nativeTextarea.style.font = styles.font;
    nativeTextarea.style.border = styles.border;
    nativeTextarea.style.borderRadius = styles.borderRadius;
    nativeTextarea.style.padding = styles.padding;
    
    // Add event listeners to sync with original textarea
    nativeTextarea.addEventListener('input', () => {
      // Set value of original textarea
      originalTextarea.value = nativeTextarea.value;
      
      // Trigger React's change event
      const event = new Event('input', { bubbles: true });
      originalTextarea.dispatchEvent(event);
      
      const changeEvent = new Event('change', { bubbles: true });
      originalTextarea.dispatchEvent(changeEvent);
      
      // Try to dispatch a React synthetic event
      try {
        const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, "value"
        ).set;
        nativeTextareaValueSetter.call(originalTextarea, nativeTextarea.value);
        const inputEvent = new Event('input', { bubbles: true });
        originalTextarea.dispatchEvent(inputEvent);
      } catch (err) {
        console.error('[FORCE-INPUT] Error dispatching synthetic event:', err);
      }
    });
    
    // Store the association
    inputMap.set(originalTextarea, nativeTextarea);
    
    return nativeTextarea;
  }
  
  // Function to replace all inputs with native inputs
  function forceInputs() {
    // Find all visible text inputs (not hidden, not file inputs)
    const textInputs = Array.from(document.querySelectorAll('input:not([type="file"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'));
    const textareas = Array.from(document.querySelectorAll('textarea'));
    
    console.log(`[FORCE-INPUT] Found ${textInputs.length} text inputs and ${textareas.length} textareas`);
    
    // Remove existing force inputs
    document.querySelectorAll('.force-native-input, .force-native-textarea').forEach(el => {
      el.remove();
    });
    
    // Create the container for native inputs if it doesn't exist
    let container = document.getElementById('force-input-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'force-input-container';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '99999';
      document.body.appendChild(container);
    }
    
    // Create native inputs for each text input
    textInputs.forEach(input => {
      const nativeInput = createNativeInput(input);
      if (nativeInput) {
        nativeInput.style.pointerEvents = 'auto';
        container.appendChild(nativeInput);
        console.log('[FORCE-INPUT] Created native input for', input);
      }
    });
    
    // Create native textareas for each textarea
    textareas.forEach(textarea => {
      const nativeTextarea = createNativeTextarea(textarea);
      if (nativeTextarea) {
        nativeTextarea.style.pointerEvents = 'auto';
        container.appendChild(nativeTextarea);
        console.log('[FORCE-INPUT] Created native textarea for', textarea);
      }
    });
  }
  
  // Update positions of native inputs when window is resized
  function updatePositions() {
    inputMap.forEach((nativeInput, originalInput) => {
      const rect = originalInput.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        nativeInput.style.display = 'none';
        return;
      }
      
      nativeInput.style.display = '';
      nativeInput.style.left = rect.left + 'px';
      nativeInput.style.top = rect.top + 'px';
      nativeInput.style.width = rect.width + 'px';
      nativeInput.style.height = rect.height + 'px';
    });
  }
  
  // Initialize on DOM content loaded
  window.addEventListener('DOMContentLoaded', () => {
    console.log('[FORCE-INPUT] DOM loaded, waiting for inputs to appear');
    
    // Add CSS for force inputs
    const style = document.createElement('style');
    style.textContent = `
      .force-native-input, .force-native-textarea {
        background-color: transparent;
        color: inherit;
        font: inherit;
        outline: none;
      }
      
      .force-native-input:focus, .force-native-textarea:focus {
        outline: 2px solid #3b82f6;
        outline-offset: -2px;
      }
    `;
    document.head.appendChild(style);
    
    // Run after a short delay to make sure React has rendered
    setTimeout(forceInputs, 1000);
  });
  
  // Reapply when DOM changes
  const observer = new MutationObserver(() => {
    forceInputs();
  });
  
  // Start observing when the page is fully loaded
  window.addEventListener('load', () => {
    console.log('[FORCE-INPUT] Page loaded, starting observer');
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Run the force inputs again after a delay
    setTimeout(forceInputs, 1000);
    setTimeout(forceInputs, 3000);
    
    // Update positions when window is resized
    window.addEventListener('resize', updatePositions);
    
    // Update positions periodically
    setInterval(updatePositions, 1000);
  });
  
  // Expose function globally for debugging
  window.forceInputs = forceInputs;
})(); 