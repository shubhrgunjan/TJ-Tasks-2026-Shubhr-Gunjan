import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-bg flex flex-col justify-center items-center">
        {/* Bauhaus mechanical spinner/loading state */}
        <div className="flex gap-4 mb-4 items-end">
          <div className="w-4 h-4 rounded-full bg-primary-red animate-bounce" />
          <div className="w-4 h-4 bg-primary-yellow animate-bounce [animation-delay:0.2s]" />
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-primary-blue animate-bounce [animation-delay:0.4s]" />
        </div>
        <span className="font-black text-xs uppercase tracking-widest text-canvas-fg select-none">LOADING WORKSPACE...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
