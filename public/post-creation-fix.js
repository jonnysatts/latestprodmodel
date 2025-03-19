// Script to fix inputs after product creation
(function() {
  console.log('[POST-CREATION] Initializing post-creation input fix');
  
  // Track application state to detect product creation
  let productCreated = false;
  
  // Store original inputs and their proxies
  const inputProxies = new Map();
  
  // Create a proxy for an input element
  function createInputProxy(input) {
    if (!input || !input.isConnected || inputProxies.has(input)) return null;
    
    const rect = input.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    
    console.log('[POST-CREATION] Creating proxy for input:', input);
    
    // Create the proxy element
    const proxy = document.createElement(input.tagName);
    proxy.className = input.className + ' post-creation-proxy';
    
    // Copy attributes
    for (const attr of input.attributes) {
      if (attr.name !== 'id') { // Don't duplicate ID
        proxy.setAttribute(attr.name, attr.value);
      }
    }
    
    // Special handling for different input types
    if (input.tagName.toLowerCase() === 'input') {
      proxy.type = input.type || 'text';
    }
    
    // Copy current state
    proxy.value = input.value || '';
    proxy.placeholder = input.placeholder || '';
    
    // Position the proxy over the original input
    proxy.style.position = 'absolute';
    proxy.style.left = rect.left + 'px';
    proxy.style.top = rect.top + 'px';
    proxy.style.width = rect.width + 'px';
    proxy.style.height = rect.height + 'px';
    proxy.style.zIndex = '999999';
    
    // Make the proxy fully interactive
    proxy.style.opacity = '1';
    proxy.style.pointerEvents = 'auto';
    
    // Style the original input
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    
    // Connect the proxy to the original input
    proxy.addEventListener('input', () => {
      input.value = proxy.value;
      
      // Trigger React synthetic events
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);
      
      const changeEvent = new Event('change', { bubbles: true });
      input.dispatchEvent(changeEvent);
      
      // Create a synthetic React event object
      try {
        // Access React's synthetic event system via debugging APIs or hooks
        const eventData = {
          target: input,
          currentTarget: input,
          type: 'change',
          bubbles: true,
          cancelable: true,
          defaultPrevented: false,
          timeStamp: Date.now(),
          nativeEvent: changeEvent
        };
        
        // Set target properties directly
        Object.defineProperty(eventData, 'target', {
          get: function() { return { value: proxy.value }; }
        });
        
        // Try to access React's internal event handling
        const reactEvent = new CustomEvent('react-internal-change', { 
          bubbles: true, 
          detail: eventData 
        });
        input.dispatchEvent(reactEvent);
      } catch (err) {
        console.error('[POST-CREATION] Error creating synthetic event:', err);
      }
    });
    
    // Add the proxy to the document
    if (!document.getElementById('post-creation-container')) {
      const container = document.createElement('div');
      container.id = 'post-creation-container';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '999999';
      document.body.appendChild(container);
    }
    
    const container = document.getElementById('post-creation-container');
    container.appendChild(proxy);
    
    // Store the proxy
    inputProxies.set(input, proxy);
    
    return proxy;
  }
  
  // Update proxy positions
  function updateProxyPositions() {
    inputProxies.forEach((proxy, input) => {
      if (!input.isConnected) {
        // Input was removed, remove the proxy
        if (proxy.parentNode) {
          proxy.parentNode.removeChild(proxy);
        }
        inputProxies.delete(input);
        return;
      }
      
      const rect = input.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        proxy.style.display = 'none';
        return;
      }
      
      proxy.style.display = '';
      proxy.style.left = rect.left + 'px';
      proxy.style.top = rect.top + 'px';
      proxy.style.width = rect.width + 'px';
      proxy.style.height = rect.height + 'px';
      
      // Keep values in sync (input -> proxy)
      if (input.value !== proxy.value) {
        proxy.value = input.value;
      }
    });
  }
  
  // Process all inputs
  function processAllInputs() {
    if (!productCreated) {
      // Look for signs that a product has been created
      const productElements = document.querySelectorAll('.product-card');
      if (productElements.length > 0) {
        console.log('[POST-CREATION] Product detected, activating fix');
        productCreated = true;
      }
    }
    
    if (productCreated) {
      // Process all input fields that appear after product creation
      const inputs = document.querySelectorAll('input:not(.post-creation-proxy), textarea:not(.post-creation-proxy), select:not(.post-creation-proxy)');
      
      inputs.forEach(input => {
        // Skip certain input types
        if (input.type === 'hidden' || input.type === 'radio' || input.type === 'checkbox' || input.type === 'submit' || input.type === 'button') {
          return;
        }
        
        // Create proxies for inputs that don't have them yet
        if (!inputProxies.has(input)) {
          createInputProxy(input);
        }
      });
      
      // Update positions of all proxies
      updateProxyPositions();
    }
  }
  
  // Set up mutation observer to detect new inputs
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let needsProcessing = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
              if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT' ||
                  node.querySelector('input, textarea, select')) {
                needsProcessing = true;
                break;
              }
              
              // Also check for product creation
              if (node.classList && node.classList.contains('product-card')) {
                productCreated = true;
                needsProcessing = true;
                break;
              }
            }
          }
        }
        
        if (needsProcessing) break;
      }
      
      if (needsProcessing) {
        processAllInputs();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  
  // Initialize on DOMContentLoaded
  window.addEventListener('DOMContentLoaded', () => {
    console.log('[POST-CREATION] DOM loaded, initializing');
    
    // Add styles for proxy elements
    const style = document.createElement('style');
    style.textContent = `
      .post-creation-proxy {
        background-color: transparent !important;
        font-family: inherit !important;
        font-size: inherit !important;
        box-sizing: border-box !important;
      }
      
      .post-creation-proxy:focus {
        outline: 2px solid #3b82f6 !important; 
      }
    `;
    document.head.appendChild(style);
    
    // Initial processing
    setTimeout(processAllInputs, 1000);
    
    // Set up observer
    setupObserver();
    
    // Set up periodic updates
    setInterval(processAllInputs, 2000);
    
    // Update positions on scroll and resize
    window.addEventListener('scroll', updateProxyPositions, { passive: true });
    window.addEventListener('resize', updateProxyPositions, { passive: true });
  });
  
  // Alternative detection method for product creation
  window.addEventListener('click', (e) => {
    // Check if user clicked a button that might create a product
    if (e.target && (
        (e.target.tagName === 'BUTTON' && e.target.innerText.includes('Create')) ||
        (e.target.closest('button') && e.target.closest('button').innerText.includes('Create'))
    )) {
      console.log('[POST-CREATION] Detected potential product creation button click');
      setTimeout(() => {
        productCreated = true;
        processAllInputs();
      }, 500);
    }
  });
  
  // Make functions available globally for debugging
  window.postCreationFix = {
    processAllInputs,
    updateProxyPositions,
    setProductCreated: (value) => { productCreated = value; }
  };
})(); 