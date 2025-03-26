import React, { useRef, useLayoutEffect, useEffect } from 'react';

interface IsolatedInputProps {
  value?: string | number;
  onChange?: (e: unknown) => void;
  onValueChange?: (value: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  isTextarea?: boolean;
  rows?: number;
  label?: string;
}

/**
 * IsolatedInput - Creates an input completely outside of React's control
 */
const IsolatedInput: React.FC<IsolatedInputProps> = ({ 
  value, 
  onChange, 
  onValueChange,
  type = 'text', 
  className = '', 
  placeholder = '',
  min,
  max,
  step,
  id,
  name,
  required = false,
  disabled = false,
  readOnly = false,
  isTextarea = false,
  rows = 3,
  label,
  ...props 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementIdRef = useRef<string>(`isolated-input-${Math.random().toString(36).substring(2, 9)}`);
  
  // Initial setup of the input
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    // Clear any existing content
    containerRef.current.innerHTML = '';
    
    // Create wrapper div
    const wrapper = document.createElement('div');
    wrapper.className = 'isolated-input-wrapper';
    
    // Add label if provided
    if (label) {
      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      labelEl.htmlFor = elementIdRef.current;
      wrapper.appendChild(labelEl);
    }
    
    // Create input element
    let inputEl;
    if (isTextarea) {
      inputEl = document.createElement('textarea');
      if (rows) {
        inputEl.rows = rows;
      }
    } else {
      inputEl = document.createElement('input');
      
      // Handle number inputs specially
      if (type === 'number') {
        // Use text input for better cursor control
        inputEl.type = 'text';
        inputEl.inputMode = 'numeric';
        inputEl.pattern = '[0-9]*\\.?[0-9]*';
      } else {
        inputEl.type = type;
      }
    }
    
    // Set common attributes
    inputEl.id = elementIdRef.current;
    if (name) inputEl.name = name;
    inputEl.placeholder = placeholder || '';
    inputEl.disabled = disabled;
    inputEl.readOnly = readOnly;
    inputEl.required = required;
    
    // Add styling
    inputEl.style.width = '100%';
    inputEl.style.padding = '0.5rem';
    inputEl.style.border = '1px solid #ccc';
    inputEl.style.borderRadius = '0.25rem';
    inputEl.style.fontSize = '1rem';
    
    // Set data attributes for min/max/step
    if (min !== undefined) inputEl.setAttribute('data-min', String(min));
    if (max !== undefined) inputEl.setAttribute('data-max', String(max));
    if (step !== undefined) inputEl.setAttribute('data-step', String(step));
    
    // Set initial value
    if (value !== undefined && value !== null) {
      // For number inputs with value 0, don't display the 0
      if (type === 'number' && value === 0) {
        inputEl.value = '';
      } else {
        inputEl.value = String(value);
      }
    }
    
    // Create hidden input to sync with React
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.id = `${elementIdRef.current}-hidden`;
    hiddenInput.value = value !== undefined && value !== null ? String(value) : '';
    
    // Store input values directly on change
    inputEl.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      let newValue = target.value;
      
      // For number inputs, clean the input
      if (!isTextarea && type === 'number') {
        // Allow only numbers and decimal point
        newValue = newValue.replace(/[^0-9.]/g, '');
        
        // Ensure only one decimal point
        const decimalCount = (newValue.match(/\./g) || []).length;
        if (decimalCount > 1) {
          const parts = newValue.split('.');
          newValue = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Update if cleaned
        if (newValue !== target.value) {
          target.value = newValue;
        }
      }
      
      // Update hidden input
      hiddenInput.value = newValue;
      
      // Notify React of change
      if (onChange) {
        const event = {
          target: { value: newValue },
          currentTarget: { value: newValue },
          preventDefault: () => {},
          stopPropagation: () => {}
        };
        onChange(event);
      }
      
      if (onValueChange) {
        onValueChange(newValue);
      }
    });
    
    // Handle blur event for number validation
    if (type === 'number') {
      inputEl.addEventListener('blur', (e) => {
        const target = e.target as HTMLInputElement;
        
        // If empty, don't convert to 0
        if (target.value === '') {
          hiddenInput.value = '';
          
          if (onChange) {
            const event = {
              target: { value: '' },
              currentTarget: { value: '' },
              preventDefault: () => {},
              stopPropagation: () => {}
            };
            onChange(event);
          }
          
          if (onValueChange) {
            onValueChange('');
          }
          return;
        }
        
        let numValue = parseFloat(target.value);
        
        if (!isNaN(numValue)) {
          // Apply min/max constraints
          const minVal = target.getAttribute('data-min') ? parseFloat(target.getAttribute('data-min') || '') : undefined;
          const maxVal = target.getAttribute('data-max') ? parseFloat(target.getAttribute('data-max') || '') : undefined;
          
          if (minVal !== undefined && numValue < minVal) numValue = minVal;
          if (maxVal !== undefined && numValue > maxVal) numValue = maxVal;
          
          // Update with validated value
          const validatedValue = String(numValue);
          target.value = validatedValue;
          hiddenInput.value = validatedValue;
          
          if (onChange) {
            const event = {
              target: { value: validatedValue },
              currentTarget: { value: validatedValue },
              preventDefault: () => {},
              stopPropagation: () => {}
            };
            onChange(event);
          }
          
          if (onValueChange) {
            onValueChange(validatedValue);
          }
        }
      });
    }
    
    // Add to DOM
    wrapper.appendChild(inputEl);
    wrapper.appendChild(hiddenInput);
    containerRef.current.appendChild(wrapper);
    
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [
    disabled,
    isTextarea,
    label,
    max,
    min,
    name,
    onChange,
    onValueChange,
    placeholder,
    readOnly,
    required,
    rows,
    step,
    type,
    value
  ]);
  
  // Update the input value when the React prop changes
  useEffect(() => {
    if (containerRef.current) {
      const input = document.getElementById(elementIdRef.current) as HTMLInputElement | HTMLTextAreaElement;
      const hiddenInput = document.getElementById(`${elementIdRef.current}-hidden`) as HTMLInputElement;
      
      if (input && hiddenInput) {
        // Skip update if the current value is already correct
        // This prevents cursor jumping
        if (
          (value !== undefined && value !== null && hiddenInput.value !== String(value)) ||
          (value === undefined || value === null) && hiddenInput.value !== ''
        ) {
          // For number inputs with value 0, don't display the 0
          if (type === 'number' && value === 0) {
            input.value = '';
          } else {
            input.value = value !== undefined && value !== null ? String(value) : '';
          }
          
          hiddenInput.value = value !== undefined && value !== null ? String(value) : '';
        }
      }
    }
  }, [value, type]);
  
  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ 
        position: 'relative',
        minHeight: isTextarea ? '100px' : '40px',
        width: '100%'
      }}
      data-type={type}
      {...props}
    />
  );
};

export default IsolatedInput; 