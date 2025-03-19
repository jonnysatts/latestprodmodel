"use client";

import React, { useState, useEffect, createContext, useContext, forwardRef, useRef } from "react";
import { cn } from "../../lib/utils";

// Context to handle open state
interface DropdownMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined);

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('Dropdown menu components must be used within a DropdownMenu');
  }
  return context;
}

// Simple dropdown components
export interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className={cn("relative inline-block text-left", className)}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export const DropdownMenuTrigger = forwardRef<HTMLDivElement, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger({ children, className, asChild = false }, ref) {
    const { open, setOpen } = useDropdownMenu();
    
    // If asChild, clone the child element with our props
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Call original onClick if it exists
          if (children.props.onClick) {
            children.props.onClick(e);
          }
          
          setOpen(!open);
        },
        "aria-expanded": open,
        "data-state": open ? "open" : "closed",
        ref
      });
    }
    
    // Otherwise render a button
    return (
      <button 
        className={cn("cursor-pointer", className)}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        ref={ref as React.Ref<HTMLButtonElement>}
      >
        {children}
      </button>
    );
  }
);

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  function DropdownMenuContent({ children, className, align = "start" }, ref) {
    const { open, setOpen } = useDropdownMenu();
    const contentRef = useRef<HTMLDivElement>(null);
    
    // Handle clicks outside to close
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      
      if (open) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [open, setOpen]);
    
    // Combine the refs
    useEffect(() => {
      if (ref && 'current' in ref) {
        ref.current = contentRef.current;
      } else if (typeof ref === 'function') {
        ref(contentRef.current);
      }
    }, [ref]);
    
    if (!open) return null;
    
    return (
      <div 
        ref={contentRef}
        className={cn(
          "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white shadow-md animate-in fade-in-80",
          align === "start" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          align === "end" && "right-0",
          className
        )}
      >
        <div className="py-1">{children}</div>
      </div>
    );
  }
);

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  function DropdownMenuItem({ children, className, onClick, disabled = false }, ref) {
    const { setOpen } = useDropdownMenu();
    
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      
      if (onClick) {
        onClick(event);
      }
      
      setOpen(false);
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 w-full text-left",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={handleClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  }
); 