// Last resort emergency fix for input fields
(function() {
  console.log('[EMERGENCY] Input field emergency fix loaded');

  // Wait for app to be loaded
  setTimeout(function() {
    console.log('[EMERGENCY] Injecting native input overlays');
    injectNativeInputs();
  }, 5000);

  function injectNativeInputs() {
    // Find all React-controlled inputs
    const reactInputs = document.querySelectorAll('input, textarea, select');
    
    console.log(`[EMERGENCY] Found ${reactInputs.length} form fields to fix`);
    
    reactInputs.forEach(function(input, index) {
      const rect = input.getBoundingClientRect();
      
      // Only create overlays for visible inputs
      if (rect.width > 0 && rect.height > 0) {
        // Create a native input that will sit on top
        const nativeInput = document.createElement(input.tagName);
        if (input.type) nativeInput.type = input.type;
        
        // Copy styling and position
        nativeInput.className = input.className;
        nativeInput.placeholder = input.placeholder || '';
        nativeInput.value = input.value || '';
        
        // Position absolutely on top of the React input
        nativeInput.style.position = 'absolute';
        nativeInput.style.left = `${rect.left}px`;
        nativeInput.style.top = `${rect.top}px`;
        nativeInput.style.width = `${rect.width}px`;
        nativeInput.style.height = `${rect.height}px`;
        nativeInput.style.zIndex = '9999';
        nativeInput.style.backgroundColor = 'transparent';
        
        // Add data attribute for identification
        nativeInput.setAttribute('data-emergency-input', index.toString());
        
        // Add event listeners to sync values
        nativeInput.addEventListener('input', function(e) {
          // Update original input value
          const value = this.value;
          input.value = value;
          
          // Create a synthetic React-like event
          const syntheticEvent = {
            target: { value },
            currentTarget: { value },
            preventDefault: () => {},
            stopPropagation: () => {},
            nativeEvent: e,
            type: 'change',
            bubbles: true,
            cancelable: true
          };
          
          // Trigger React's synthetic events
          // First create and dispatch a normal DOM event
          const inputEvent = new Event('input', { bubbles: true });
          Object.defineProperty(inputEvent, 'target', { value: { value } });
          input.dispatchEvent(inputEvent);
          
          // Then for change events
          const changeEvent = new Event('change', { bubbles: true });
          Object.defineProperty(changeEvent, 'target', { value: { value } });
          input.dispatchEvent(changeEvent);
          
          console.log(`[EMERGENCY] Native input ${index} updated with: ${value}`);
          
          // Try to find React props/handlers directly
          const reactKey = Object.keys(input).find(key => key.startsWith('__reactProps$'));
          if (reactKey && input[reactKey] && input[reactKey].onChange) {
            console.log('[EMERGENCY] Found React onChange handler, calling directly');
            input[reactKey].onChange(syntheticEvent);
          }
        });
        
        // Add to document
        document.body.appendChild(nativeInput);
        console.log(`[EMERGENCY] Injected native input overlay for input ${index}`);
      }
    });
    
    // Reposition on window resize
    window.addEventListener('resize', function() {
      document.querySelectorAll('[data-emergency-input]').forEach(function(nativeInput) {
        const index = parseInt(nativeInput.getAttribute('data-emergency-input') || '0');
        const originalInput = reactInputs[index];
        
        if (originalInput) {
          const rect = originalInput.getBoundingClientRect();
          nativeInput.style.left = `${rect.left}px`;
          nativeInput.style.top = `${rect.top}px`;
          nativeInput.style.width = `${rect.width}px`;
          nativeInput.style.height = `${rect.height}px`;
        }
      });
    });
    
    // Update positions periodically in case of dynamic content
    setInterval(function() {
      document.querySelectorAll('[data-emergency-input]').forEach(function(nativeInput) {
        const index = parseInt(nativeInput.getAttribute('data-emergency-input') || '0');
        const originalInput = reactInputs[index];
        
        if (originalInput) {
          const rect = originalInput.getBoundingClientRect();
          nativeInput.style.left = `${rect.left}px`;
          nativeInput.style.top = `${rect.top}px`;
          nativeInput.style.width = `${rect.width}px`;
          nativeInput.style.height = `${rect.height}px`;
          
          // Keep values in sync
          if (nativeInput.value !== originalInput.value) {
            nativeInput.value = originalInput.value;
          }
        }
      });
    }, 1000);
  }
})(); 