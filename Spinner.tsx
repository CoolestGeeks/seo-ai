
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="w-12 h-12 border-4 border-base-300 border-t-brand-secondary rounded-full animate-spin"></div>
    </div>
  );
};

export default Spinner;
