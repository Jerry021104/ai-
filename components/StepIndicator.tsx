import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps, stepNames }) => {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto px-6">
        {/* Subtle Progress Line */}
        <div className="absolute left-0 top-5 transform w-full h-0.5 bg-gray-100 -z-10 mx-6" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute left-0 top-5 transform h-0.5 bg-primary -z-10 transition-all duration-700 ease-in-out mx-6"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />

        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={index} className="flex flex-col items-center group">
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2
                  ${isActive 
                    ? 'bg-primary border-primary text-white shadow-lg scale-110' 
                    : isCompleted 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-white border-gray-200 text-gray-300'}
                `}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> : <span className="font-bold text-sm">{stepNumber}</span>}
              </div>
              <span 
                className={`
                  mt-3 text-xs font-medium tracking-wide transition-colors duration-300
                  ${isActive ? 'text-primary' : 'text-gray-400'}
                `}
              >
                {stepNames[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};