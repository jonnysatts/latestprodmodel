import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface IsolatedSelectProps {
  options: Option[];
  value?: string;
  onChange?: (e: unknown) => void;
  onValueChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  label?: string;
}

/**
 * IsolatedSelect - Uses Shadow DOM to completely bypass React's event system
 * This component creates a real DOM select element inside shadow DOM, which isolates
 * it from all CSS and JavaScript outside its scope.
 */
const IsolatedSelect: React.FC<IsolatedSelectProps> = ({
  options,
  value,
  onChange,
  onValueChange,
  className = '',
  placeholder,
  id,
  name,
  required = false,
  disabled = false,
  label,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState<string>(value || '');
  
  // Create an isolated DOM structure on mount
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous content
    containerRef.current.innerHTML = '';
    
    try {
      // Create a shadow root to isolate from external CSS
      const shadow = containerRef.current.attachShadow({ mode: 'open' });
      
      // Add styles to the shadow DOM
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
          width: 100%;
          position: relative;
        }
        .select-container {
          width: 100%;
          position: relative;
        }
        select {
          width: 100%;
          padding: 8px 32px 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
          background-color: white;
          color: black;
          appearance: none;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
        }
        .chevron {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 10px;
          height: 10px;
          pointer-events: none;
        }
        .chevron::before,
        .chevron::after {
          content: "";
          position: absolute;
          width: 8px;
          height: 2px;
          background-color: #6b7280;
          top: 4px;
        }
        .chevron::before {
          left: 0;
          transform: rotate(45deg);
        }
        .chevron::after {
          right: 0;
          transform: rotate(-45deg);
        }
        label {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        .required {
          color: #ef4444;
          margin-left: 2px;
        }
        select:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }
      `;
      shadow.appendChild(style);
      
      // Create a container for the select
      const container = document.createElement('div');
      container.className = 'select-container';
      
      // Add label if provided
      if (label) {
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        if (id) labelEl.htmlFor = id;
        
        if (required) {
          const requiredMark = document.createElement('span');
          requiredMark.className = 'required';
          requiredMark.textContent = '*';
          labelEl.appendChild(requiredMark);
        }
        
        container.appendChild(labelEl);
      }
      
      // Create the select element
      const selectEl = document.createElement('select');
      
      // Set attributes
      if (id) selectEl.id = id;
      if (name) selectEl.name = name;
      selectEl.disabled = disabled;
      selectEl.required = required;
      
      // Add placeholder option if provided
      if (placeholder) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholder;
        placeholderOption.disabled = required;
        placeholderOption.selected = !value;
        selectEl.appendChild(placeholderOption);
      }
      
      // Add options
      options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        if (option.value === value) {
          optionEl.selected = true;
        }
        selectEl.appendChild(optionEl);
      });
      
      // Add chevron icon (dropdown arrow)
      const chevron = document.createElement('div');
      chevron.className = 'chevron';
      
      // Add change event
      selectEl.addEventListener('change', (e) => {
        const newValue = (e.target as HTMLSelectElement).value;
        setLocalValue(newValue);
        
        // Call provided callbacks
        if (onValueChange) {
          onValueChange(newValue);
        }
        
        if (onChange) {
          // Create a synthetic-like event object
          const syntheticEvent = {
            target: { value: newValue },
            currentTarget: { value: newValue },
            preventDefault: () => {},
            stopPropagation: () => {}
          };
          onChange(syntheticEvent);
        }
        
        console.log('IsolatedSelect value changed:', newValue);
      });
      
      // Add blur event to ensure state is synchronized
      selectEl.addEventListener('blur', () => {
        // On blur, ensure React state is updated with the final select value
        const finalValue = selectEl.value;
        if (onChange && finalValue !== value) {
          const syntheticEvent = {
            target: { value: finalValue },
            currentTarget: { value: finalValue },
            preventDefault: () => {},
            stopPropagation: () => {}
          };
          onChange(syntheticEvent);
        }
      });
      
      // Append elements to the DOM
      container.appendChild(selectEl);
      container.appendChild(chevron);
      shadow.appendChild(container);
      
    } catch (err) {
      console.error('Error creating shadow DOM for isolated select:', err);
      
      // Fallback to a regular select if shadow DOM fails
      const fallbackSelect = document.createElement('select');
      
      if (id) fallbackSelect.id = id;
      if (name) fallbackSelect.name = name;
      fallbackSelect.disabled = disabled;
      fallbackSelect.required = required;
      fallbackSelect.style.width = '100%';
      fallbackSelect.style.padding = '8px 12px';
      fallbackSelect.style.border = '1px solid #d1d5db';
      fallbackSelect.style.borderRadius = '6px';
      fallbackSelect.style.fontSize = '14px';
      
      // Add placeholder
      if (placeholder) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholder;
        placeholderOption.disabled = required;
        if (!value) placeholderOption.selected = true;
        fallbackSelect.appendChild(placeholderOption);
      }
      
      // Add options
      options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        if (option.value === value) optionEl.selected = true;
        fallbackSelect.appendChild(optionEl);
      });
      
      // Add change event
      fallbackSelect.addEventListener('change', (e) => {
        const newValue = (e.target as HTMLSelectElement).value;
        setLocalValue(newValue);
        
        if (onValueChange) {
          onValueChange(newValue);
        }
        
        if (onChange) {
          const syntheticEvent = {
            target: { value: newValue },
            currentTarget: { value: newValue },
            preventDefault: () => {},
            stopPropagation: () => {}
          };
          onChange(syntheticEvent);
        }
      });
      
      containerRef.current.appendChild(fallbackSelect);
    }
    
    // Return cleanup function
    return () => {
      if (containerRef.current) {
        if (containerRef.current.shadowRoot) {
          const shadow = containerRef.current.shadowRoot;
          const selectEl = shadow.querySelector('select');
          if (selectEl) {
            selectEl.removeEventListener('change', () => {});
            selectEl.removeEventListener('blur', () => {});
          }
        } else {
          containerRef.current.innerHTML = '';
        }
      }
    };
  }, [options, placeholder, id, name, required, disabled, label]);
  
  // Keep the select value in sync with the prop
  useEffect(() => {
    if (containerRef.current && containerRef.current.shadowRoot) {
      const selectEl = containerRef.current.shadowRoot.querySelector('select');
      if (selectEl && value !== undefined && value !== localValue) {
        selectEl.value = value;
        setLocalValue(value);
      }
    }
  }, [value, localValue]);
  
  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ 
        position: 'relative',
        minHeight: '40px',
        width: '100%'
      }}
      {...props}
    />
  );
};

export default IsolatedSelect; 