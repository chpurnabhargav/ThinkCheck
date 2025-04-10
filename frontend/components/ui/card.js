// components/ui/card.js
import React from 'react';

export const Card = ({ children, className }) => (
  <div className={`rounded-lg border bg-white p-4 shadow-sm ${className || ''}`}>
    {children}
  </div>
);

export const CardHeader = ({ children }) => (
  <div className="border-b pb-2 mb-2">{children}</div>
);

export const CardTitle = ({ children }) => (
  <h3 className="text-lg font-semibold">{children}</h3>
);

export const CardContent = ({ children }) => (
  <div>{children}</div>
);
