import React, { useEffect, useRef } from 'react';

interface BypassReactFormProps {
  onSuccess?: (data: unknown) => void;
}

/**
 * BypassReactForm - A component that bypasses React's event system by using an iframe
 * 
 * This is a nuclear option when React events aren't working properly.
 * It embeds the standalone-form.html directly in an iframe.
 */
export const BypassReactForm: React.FC<BypassReactFormProps> = ({ onSuccess }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Setup communication between iframe and parent
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our iframe
      if (iframeRef.current && event.source === iframeRef.current.contentWindow) {
        if (event.data.type === 'PRODUCT_CREATED' && onSuccess) {
          onSuccess(event.data.product);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess]);

  return (
    <div className="bypass-react-container">
      <div className="bypass-header">
        <h2>Create New Product</h2>
        <p className="bypass-note">Using direct HTML form due to React event issues</p>
      </div>
      
      <iframe 
        ref={iframeRef}
        src="/standalone-form.html" 
        style={{ 
          width: '100%',
          height: '700px',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem'
        }}
        title="Product Creation Form"
      />
    </div>
  );
};

export default BypassReactForm; 