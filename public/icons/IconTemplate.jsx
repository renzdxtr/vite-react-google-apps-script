import React from 'react';

const NAME = ({ 
  className = "h-6 w-6", 
  alt = "ALT NAME",
  ...props 
}) => (
  <img 
    src="data:image/svg+xml;base64,YOUR_SCAN_QR_BASE64_STRING_HERE"
    className={className}
    alt={alt}
    {...props}
  />
);

export default NAME;