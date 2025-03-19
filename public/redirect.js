// Emergency redirect to the standalone form if inputs don't work

(function() {
  // Wait for the page to fully load
  window.addEventListener('load', function() {
    // Give the app some time to initialize
    setTimeout(checkForInteraction, 5000);
    
    // Track if any input has been successfully interacted with
    let hasInteracted = false;
    
    // Listen for any input activity
    document.addEventListener('input', function() {
      hasInteracted = true;
    });
    
    function checkForInteraction() {
      if (!hasInteracted) {
        // Create emergency button that shows at the bottom of the screen
        const emergencyDiv = document.createElement('div');
        emergencyDiv.style.position = 'fixed';
        emergencyDiv.style.bottom = '10px';
        emergencyDiv.style.left = '10px';
        emergencyDiv.style.right = '10px';
        emergencyDiv.style.zIndex = '999999';
        emergencyDiv.style.textAlign = 'center';
        emergencyDiv.style.padding = '10px';
        emergencyDiv.style.backgroundColor = '#fee2e2';
        emergencyDiv.style.borderRadius = '5px';
        emergencyDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        
        emergencyDiv.innerHTML = `
          <p style="margin: 0 0 10px; font-weight: bold; color: #b91c1c;">
            Having trouble with input fields?
          </p>
          <button id="emergencyFormButton" style="background: #b91c1c; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
            Open Emergency Data Entry Form
          </button>
        `;
        
        document.body.appendChild(emergencyDiv);
        
        // Add click handler to the button
        document.getElementById('emergencyFormButton').addEventListener('click', function() {
          window.location.href = '/emergency-form.html';
        });
        
        // Check again after 10 more seconds
        setTimeout(function() {
          if (!hasInteracted) {
            if (confirm("It looks like you're having trouble interacting with this application. Would you like to use the emergency data entry form instead?")) {
              window.location.href = '/emergency-form.html';
            }
          }
        }, 10000);
      }
    }
  });
})(); 