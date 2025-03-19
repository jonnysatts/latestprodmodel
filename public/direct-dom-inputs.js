// Direct DOM Input Manipulation
(function() {
  console.log("[DIRECT-DOM] Initializing direct DOM input manipulation");
  
  // Create globally accessible functions
  window.directDOMInputs = {
    fixAll: fixAllInputs,
    fixInput: createProxyInput,
    fixTextarea: createProxyTextarea,
    getValueFromReact: getValueFromReactComponent,
    sendValueToReact: sendValueToReactComponent
  };
  
  // Store references to proxy and original inputs
  const inputMappings = new Map();
  
  // Utility function to generate a unique ID
  function generateId() {
    return `direct-dom-${Math.random().toString(36).substring(2, 11)}`;
  }
  
  // Process a single React input and create a proxy
  function createProxyInput(reactInput) {
    if (!reactInput || !reactInput.isConnected) return null;
    if (inputMappings.has(reactInput)) return inputMappings.get(reactInput);
    
    // Skip if this is already one of our proxy elements
    if (reactInput.classList.contains('direct-dom-proxy')) return null;
    
    // Get the position and size
    const rect = reactInput.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    
    // Get computed style
    const style = window.getComputedStyle(reactInput);
    
    // Create a proxy input that will be visible to the user
    const proxyInput = document.createElement('input');
    proxyInput.type = reactInput.type || 'text';
    proxyInput.value = reactInput.value || '';
    proxyInput.placeholder = reactInput.placeholder || '';
    proxyInput.className = 'direct-dom-proxy';
    proxyInput.setAttribute('data-for-id', reactInput.id || generateId());
    
    // Apply styles to match the original
    proxyInput.style.position = 'absolute';
    proxyInput.style.left = `${rect.left}px`;
    proxyInput.style.top = `${rect.top}px`;
    proxyInput.style.width = `${rect.width}px`;
    proxyInput.style.height = `${rect.height}px`;
    proxyInput.style.font = style.font;
    proxyInput.style.color = style.color;
    proxyInput.style.backgroundColor = style.backgroundColor;
    proxyInput.style.border = 'none';
    proxyInput.style.outline = style.outline;
    proxyInput.style.padding = style.padding;
    proxyInput.style.margin = '0';
    proxyInput.style.zIndex = '99999';
    
    // Hide the original React input
    reactInput.style.opacity = '0';
    reactInput.style.position = 'absolute';
    reactInput.tabIndex = -1; // Prevent focusing
    
    // Event handlers for the proxy input
    proxyInput.addEventListener('input', () => {
      sendValueToReactComponent(reactInput, proxyInput.value);
    });
    
    proxyInput.addEventListener('focus', () => {
      // Ensure we have the latest value from React
      proxyInput.value = getValueFromReactComponent(reactInput);
    });
    
    proxyInput.addEventListener('blur', () => {
      // Ensure value is synced back to React
      sendValueToReactComponent(reactInput, proxyInput.value);
    });
    
    // Store the mapping
    inputMappings.set(reactInput, proxyInput);
    
    // Add to the document
    if (!document.getElementById('direct-dom-container')) {
      const container = document.createElement('div');
      container.id = 'direct-dom-container';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '99999';
      document.body.appendChild(container);
    }
    
    const container = document.getElementById('direct-dom-container');
    proxyInput.style.pointerEvents = 'auto';
    container.appendChild(proxyInput);
    
    console.log("[DIRECT-DOM] Created proxy for input:", reactInput);
    return proxyInput;
  }
  
  // Process a single React textarea and create a proxy
  function createProxyTextarea(reactTextarea) {
    if (!reactTextarea || !reactTextarea.isConnected) return null;
    if (inputMappings.has(reactTextarea)) return inputMappings.get(reactTextarea);
    
    // Skip if this is already one of our proxy elements
    if (reactTextarea.classList.contains('direct-dom-proxy')) return null;
    
    // Get the position and size
    const rect = reactTextarea.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    
    // Get computed style
    const style = window.getComputedStyle(reactTextarea);
    
    // Create a proxy textarea that will be visible to the user
    const proxyTextarea = document.createElement('textarea');
    proxyTextarea.value = reactTextarea.value || '';
    proxyTextarea.placeholder = reactTextarea.placeholder || '';
    proxyTextarea.className = 'direct-dom-proxy';
    proxyTextarea.setAttribute('data-for-id', reactTextarea.id || generateId());
    
    // Apply styles to match the original
    proxyTextarea.style.position = 'absolute';
    proxyTextarea.style.left = `${rect.left}px`;
    proxyTextarea.style.top = `${rect.top}px`;
    proxyTextarea.style.width = `${rect.width}px`;
    proxyTextarea.style.height = `${rect.height}px`;
    proxyTextarea.style.font = style.font;
    proxyTextarea.style.color = style.color;
    proxyTextarea.style.backgroundColor = style.backgroundColor;
    proxyTextarea.style.border = 'none';
    proxyTextarea.style.outline = style.outline;
    proxyTextarea.style.padding = style.padding;
    proxyTextarea.style.margin = '0';
    proxyTextarea.style.zIndex = '99999';
    proxyTextarea.style.resize = 'none';
    
    // Hide the original React textarea
    reactTextarea.style.opacity = '0';
    reactTextarea.style.position = 'absolute';
    reactTextarea.tabIndex = -1; // Prevent focusing
    
    // Event handlers for the proxy textarea
    proxyTextarea.addEventListener('input', () => {
      sendValueToReactComponent(reactTextarea, proxyTextarea.value);
    });
    
    proxyTextarea.addEventListener('focus', () => {
      // Ensure we have the latest value from React
      proxyTextarea.value = getValueFromReactComponent(reactTextarea);
    });
    
    proxyTextarea.addEventListener('blur', () => {
      // Ensure value is synced back to React
      sendValueToReactComponent(reactTextarea, proxyTextarea.value);
    });
    
    // Store the mapping
    inputMappings.set(reactTextarea, proxyTextarea);
    
    // Add to the document
    if (!document.getElementById('direct-dom-container')) {
      const container = document.createElement('div');
      container.id = 'direct-dom-container';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '99999';
      document.body.appendChild(container);
    }
    
    const container = document.getElementById('direct-dom-container');
    proxyTextarea.style.pointerEvents = 'auto';
    container.appendChild(proxyTextarea);
    
    console.log("[DIRECT-DOM] Created proxy for textarea:", reactTextarea);
    return proxyTextarea;
  }
  
  // Get the current value from a React component
  function getValueFromReactComponent(reactElement) {
    try {
      return reactElement.value || '';
    } catch (err) {
      console.error("[DIRECT-DOM] Error getting value from React component:", err);
      return '';
    }
  }
  
  // Set a value to a React component and trigger necessary events
  function sendValueToReactComponent(reactElement, value) {
    try {
      // Set the value property directly
      reactElement.value = value;
      
      // Try to set via property descriptor (bypasses getters/setters)
      try {
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(reactElement),
          'value'
        );
        
        if (descriptor && descriptor.set) {
          descriptor.set.call(reactElement, value);
        }
      } catch (err) {
        console.warn("[DIRECT-DOM] Could not set via property descriptor:", err);
      }
      
      // Dispatch events to notify React
      const inputEvent = new Event('input', { bubbles: true });
      reactElement.dispatchEvent(inputEvent);
      
      const changeEvent = new Event('change', { bubbles: true });
      reactElement.dispatchEvent(changeEvent);
      
      // Custom event with more data
      const customEvent = new CustomEvent('direct-dom-change', { 
        bubbles: true,
        detail: { value, originalTarget: reactElement }
      });
      reactElement.dispatchEvent(customEvent);
      
      console.log("[DIRECT-DOM] Value sent to React component:", value);
    } catch (err) {
      console.error("[DIRECT-DOM] Error sending value to React component:", err);
    }
  }
  
  // Update positions of all proxy inputs/textareas
  function updatePositions() {
    inputMappings.forEach((proxyElement, reactElement) => {
      if (!reactElement.isConnected) {
        // React element is no longer in the DOM, remove proxy
        if (proxyElement.parentNode) {
          proxyElement.parentNode.removeChild(proxyElement);
        }
        inputMappings.delete(reactElement);
        return;
      }
      
      if (!proxyElement.isConnected) {
        // Proxy was removed, but React element still exists
        document.getElementById('direct-dom-container')?.appendChild(proxyElement);
        return;
      }
      
      // Update position based on React element
      const rect = reactElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        proxyElement.style.display = 'none';
        return;
      }
      
      proxyElement.style.display = '';
      proxyElement.style.left = `${rect.left}px`;
      proxyElement.style.top = `${rect.top}px`;
      proxyElement.style.width = `${rect.width}px`;
      proxyElement.style.height = `${rect.height}px`;
      
      // Update value if React's value changed
      const reactValue = getValueFromReactComponent(reactElement);
      if (proxyElement.value !== reactValue) {
        proxyElement.value = reactValue;
      }
    });
  }
  
  // Process all inputs and textareas on the page
  function fixAllInputs() {
    // Find all inputs that aren't already proxied
    const inputs = Array.from(document.querySelectorAll('input:not(.direct-dom-proxy):not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"])'));
    const textareas = Array.from(document.querySelectorAll('textarea:not(.direct-dom-proxy)'));
    
    console.log(`[DIRECT-DOM] Found ${inputs.length} inputs and ${textareas.length} textareas to proxy`);
    
    // Clear any proxy elements that no longer have a source
    inputMappings.forEach((proxy, source) => {
      if (!source.isConnected) {
        if (proxy.parentNode) {
          proxy.parentNode.removeChild(proxy);
        }
        inputMappings.delete(source);
      }
    });
    
    // Create proxies for all inputs
    inputs.forEach(input => createProxyInput(input));
    textareas.forEach(textarea => createProxyTextarea(textarea));
    
    // Update all positions
    updatePositions();
  }
  
  // Initialize when DOM is loaded
  window.addEventListener('DOMContentLoaded', () => {
    console.log("[DIRECT-DOM] DOM content loaded, initializing");
    
    // Run initial fix
    setTimeout(fixAllInputs, 500);
    
    // Set up a mutation observer to detect new inputs
    const observer = new MutationObserver((mutations) => {
      // Only run if we see relevant changes
      const shouldRun = mutations.some(mutation => {
        return mutation.addedNodes.length > 0 || 
               mutation.type === 'attributes' || 
               mutation.type === 'childList';
      });
      
      if (shouldRun) {
        fixAllInputs();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // Set up periodic updates for positioning
    setInterval(updatePositions, 500);
    
    // Update on scroll or resize
    window.addEventListener('scroll', updatePositions, { passive: true });
    window.addEventListener('resize', updatePositions, { passive: true });
    
    // Add global styles
    const style = document.createElement('style');
    style.textContent = `
      .direct-dom-proxy {
        box-sizing: border-box;
        outline: none;
      }
      .direct-dom-proxy:focus {
        outline: 2px solid #3b82f6 !important;
        z-index: 99999 !important;
      }
    `;
    document.head.appendChild(style);
  });
  
  // Run when page is fully loaded
  window.addEventListener('load', () => {
    console.log("[DIRECT-DOM] Page loaded, running final initialization");
    setTimeout(fixAllInputs, 1000);
    setTimeout(fixAllInputs, 2000);
  });
})(); 