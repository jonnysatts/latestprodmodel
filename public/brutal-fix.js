// BRUTAL FIX FOR INPUT PROBLEMS
// This script completely bypasses React's event system for inputs

(function() {
  // Run immediately
  brutalFix();
  
  // And keep checking for new elements
  setInterval(brutalFix, 50);
  
  function brutalFix() {
    // Target all input elements
    const elements = document.querySelectorAll('input, textarea, select');
    
    elements.forEach(function(el) {
      // Skip elements we've already fixed
      if (el.dataset.brutalFixed) return;
      
      // Mark as fixed
      el.dataset.brutalFixed = 'true';
      
      // Create a native HTML clone positioned directly on top
      const rect = el.getBoundingClientRect();
      const nativeInput = document.createElement(el.tagName.toLowerCase());
      
      // Copy attributes
      Array.from(el.attributes).forEach(attr => {
        if (attr.name !== 'data-brutal-fixed') {
          nativeInput.setAttribute(attr.name, attr.value);
        }
      });
      
      // Style to overlay exactly
      nativeInput.style.position = 'absolute';
      nativeInput.style.left = rect.left + 'px';
      nativeInput.style.top = rect.top + 'px';
      nativeInput.style.width = rect.width + 'px';
      nativeInput.style.height = rect.height + 'px';
      nativeInput.style.zIndex = '9999999';
      nativeInput.style.background = 'transparent';
      nativeInput.style.border = 'none';
      
      // Set the current value
      nativeInput.value = el.value;
      
      // Sync values in both directions
      nativeInput.addEventListener('input', function() {
        // Update React-controlled input
        el.value = nativeInput.value;
        
        // Force React to recognize the change with native events
        const nativeEvent = new Event('input', { bubbles: true });
        el.dispatchEvent(nativeEvent);
        
        const changeEvent = new Event('change', { bubbles: true });
        el.dispatchEvent(changeEvent);
      });
      
      // When React updates the original, update our overlay
      const observer = new MutationObserver(function() {
        nativeInput.value = el.value;
      });
      
      observer.observe(el, { attributes: true, childList: true, characterData: true });
      
      // Add to DOM
      document.body.appendChild(nativeInput);
    });
  }
})(); 