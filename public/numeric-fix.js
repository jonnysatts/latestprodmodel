// Fix for numeric input fields in dashboards
(function() {
  console.log('[NUMERIC-FIX] Initializing numeric input fix');
  
  // Store proxies and their targets
  const numericProxies = new Map();
  
  // CSS class to identify our proxies
  const PROXY_CLASS = 'numeric-input-proxy';
  
  // Types of inputs to target
  const INPUT_SELECTORS = [
    'input[type="number"]',
    'input[type="text"][placeholder*="$"]',
    'input[type="text"][placeholder*="%"]',
    'input[type="text"][id*="price"]',
    'input[type="text"][id*="rate"]',
    'input[type="text"][id*="cost"]',
    'input[type="text"][id*="spend"]',
    'input[type="text"][id*="visitor"]'
  ];
  
  // Create a numeric input proxy
  function createNumericProxy(originalInput) {
    if (!originalInput || !originalInput.isConnected || numericProxies.has(originalInput)) {
      return null;
    }
    
    // Skip if already proxied or not visible
    if (originalInput.classList.contains(PROXY_CLASS)) return null;
    
    const rect = originalInput.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    
    console.log('[NUMERIC-FIX] Creating proxy for:', originalInput);
    
    // Create the proxy element - always use text type for maximum compatibility
    const proxyInput = document.createElement('input');
    proxyInput.type = 'text';
    proxyInput.className = originalInput.className + ' ' + PROXY_CLASS;
    proxyInput.value = originalInput.value || '';
    proxyInput.placeholder = originalInput.placeholder || '';
    
    // Copy other attributes (except id to avoid duplicates)
    for (const attr of originalInput.attributes) {
      if (attr.name !== 'id' && attr.name !== 'class' && attr.name !== 'type') {
        proxyInput.setAttribute(attr.name, attr.value);
      }
    }
    
    // Position exactly over the original
    proxyInput.style.position = 'absolute';
    proxyInput.style.left = rect.left + 'px';
    proxyInput.style.top = rect.top + 'px';
    proxyInput.style.width = rect.width + 'px';
    proxyInput.style.height = rect.height + 'px';
    proxyInput.style.zIndex = '999999';
    proxyInput.style.backgroundColor = 'transparent';
    proxyInput.style.fontFamily = 'inherit';
    proxyInput.style.fontSize = 'inherit';
    proxyInput.style.lineHeight = 'inherit';
    proxyInput.style.color = 'inherit';
    proxyInput.style.border = 'none';
    proxyInput.style.padding = 'inherit';
    proxyInput.style.margin = '0';
    proxyInput.style.outline = 'none';
    
    // Make the proxy interactive
    proxyInput.style.pointerEvents = 'auto';
    
    // Hide the original
    originalInput.style.opacity = '0';
    originalInput.style.pointerEvents = 'none';
    
    // Handle input events
    proxyInput.addEventListener('input', (e) => {
      // Update the value in the original input
      originalInput.value = proxyInput.value;
      
      // Trigger React's synthetic events
      const inputEvent = new Event('input', { bubbles: true });
      originalInput.dispatchEvent(inputEvent);
      
      const changeEvent = new Event('change', { bubbles: true });
      changeEvent.target = {
        value: proxyInput.value,
        name: originalInput.name
      };
      originalInput.dispatchEvent(changeEvent);
      
      // Attempt to set the value directly using property descriptor
      try {
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(originalInput),
          'value'
        );
        if (descriptor && descriptor.set) {
          descriptor.set.call(originalInput, proxyInput.value);
        }
      } catch (err) {
        console.warn('[NUMERIC-FIX] Failed to use property descriptor:', err);
      }
      
      // Create a React-like synthetic event
      try {
        // Create a custom event with target.value
        const reactEvent = new CustomEvent('react-change', {
          bubbles: true,
          detail: {
            target: { value: proxyInput.value, name: originalInput.name },
            currentTarget: { value: proxyInput.value, name: originalInput.name },
            type: 'change'
          }
        });
        originalInput.dispatchEvent(reactEvent);
      } catch (err) {
        console.error('[NUMERIC-FIX] Error creating synthetic event:', err);
      }
    });
    
    // Handle focus events
    proxyInput.addEventListener('focus', () => {
      proxyInput.style.outline = '2px solid #3b82f6';
    });
    
    proxyInput.addEventListener('blur', () => {
      proxyInput.style.outline = 'none';
      
      // Trigger blur on original
      originalInput.dispatchEvent(new Event('blur', { bubbles: true }));
      
      // Trigger change on original
      originalInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // Create container if needed
    if (!document.getElementById('numeric-proxy-container')) {
      const container = document.createElement('div');
      container.id = 'numeric-proxy-container';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '999999';
      document.body.appendChild(container);
    }
    
    // Add proxy to container
    const container = document.getElementById('numeric-proxy-container');
    container.appendChild(proxyInput);
    
    // Store the proxy
    numericProxies.set(originalInput, proxyInput);
    
    return proxyInput;
  }
  
  // Update positions of all proxies
  function updateProxyPositions() {
    numericProxies.forEach((proxy, original) => {
      if (!original.isConnected) {
        // Original was removed, clean up
        if (proxy.parentNode) {
          proxy.parentNode.removeChild(proxy);
        }
        numericProxies.delete(original);
        return;
      }
      
      const rect = original.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        proxy.style.display = 'none';
        return;
      }
      
      // Update position
      proxy.style.display = '';
      proxy.style.left = rect.left + 'px';
      proxy.style.top = rect.top + 'px';
      proxy.style.width = rect.width + 'px';
      proxy.style.height = rect.height + 'px';
      
      // Ensure values are synced
      if (original.value !== proxy.value) {
        proxy.value = original.value;
      }
    });
  }
  
  // Process all numeric inputs
  function processNumericInputs() {
    // Find all numeric inputs that match our selectors
    const selector = INPUT_SELECTORS.join(', ');
    const inputs = document.querySelectorAll(selector);
    
    console.log(`[NUMERIC-FIX] Found ${inputs.length} numeric inputs to process`);
    
    inputs.forEach(input => {
      if (!numericProxies.has(input)) {
        createNumericProxy(input);
      }
    });
    
    // Also look for inputs with specific labels
    const labels = document.querySelectorAll('label');
    
    const numericLabels = [
      'weekly visitors', 'visitors', 'growth rate', 'ticket price', 
      'spend', 'cost', 'price', 'rate', 'revenue', 'income', 'expense'
    ];
    
    labels.forEach(label => {
      const text = label.textContent.toLowerCase();
      const isNumericLabel = numericLabels.some(term => text.includes(term));
      
      if (isNumericLabel) {
        const id = label.getAttribute('for');
        if (id) {
          const input = document.getElementById(id);
          if (input && input.tagName === 'INPUT' && !numericProxies.has(input)) {
            createNumericProxy(input);
          }
        }
      }
    });
    
    // Update positions
    updateProxyPositions();
  }
  
  // Set up mutation observer to detect new inputs
  function setupObserver() {
    const observer = new MutationObserver(mutations => {
      let shouldProcess = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Check if any added nodes contain inputs
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
              if (node.matches && INPUT_SELECTORS.some(selector => node.matches(selector))) {
                shouldProcess = true;
                break;
              }
              
              // Check for inputs within the added node
              if (node.querySelector && INPUT_SELECTORS.some(selector => node.querySelector(selector))) {
                shouldProcess = true;
                break;
              }
            }
          }
        }
      }
      
      if (shouldProcess) {
        processNumericInputs();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  
  // Initialize when DOM is loaded
  window.addEventListener('DOMContentLoaded', () => {
    console.log('[NUMERIC-FIX] DOM loaded, initializing...');
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .${PROXY_CLASS} {
        box-sizing: border-box !important;
        background: transparent !important;
      }
      
      .${PROXY_CLASS}:focus {
        outline: 2px solid #3b82f6 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Run initially with a delay to allow React to render
    setTimeout(processNumericInputs, 1000);
    setTimeout(processNumericInputs, 2000);
    
    // Setup observer for dynamic changes
    setupObserver();
    
    // Update positions on scroll and resize
    window.addEventListener('scroll', updateProxyPositions, { passive: true });
    window.addEventListener('resize', updateProxyPositions, { passive: true });
    
    // Periodically update positions and check for new inputs
    setInterval(updateProxyPositions, 1000);
    setInterval(processNumericInputs, 3000);
  });
  
  // Additional trigger when navigation happens - dashboard pages might load later
  window.addEventListener('click', event => {
    // Check if user clicked on a navigation element
    if (event.target && (
      event.target.tagName === 'A' || 
      event.target.tagName === 'BUTTON' ||
      event.target.closest('a') || 
      event.target.closest('button')
    )) {
      setTimeout(processNumericInputs, 500);
      setTimeout(processNumericInputs, 1000);
      setTimeout(processNumericInputs, 2000);
    }
  });
  
  // Make functions available globally for debugging
  window.numericFix = {
    processInputs: processNumericInputs,
    updatePositions: updateProxyPositions,
    getProxies: () => Array.from(numericProxies.entries())
  };
})(); 