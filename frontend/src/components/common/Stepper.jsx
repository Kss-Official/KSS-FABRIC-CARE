import React from 'react';
import { Check } from 'lucide-react';

export const Stepper = ({ currentStep, onStepClick }) => {
  const steps = [
    { number: 1, label: 'Select Services' },
    { number: 2, label: 'Pickup Details' },
    { number: 3, label: 'Choose Time' },
    { number: 4, label: 'Review & Confirm' }
  ];

  return (
    <div className="stepper-wrapper">
      <div className="stepper-container">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          const isClickable = onStepClick && isCompleted;

          return (
            <React.Fragment key={step.number}>
              {/* Step Item */}
              <div 
                className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
                onClick={() => isClickable && onStepClick(step.number)}
              >
                <div className="stepper-circle">
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <span className="stepper-label">{step.label}</span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`stepper-line ${currentStep > index + 1 ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <style>{`
        .stepper-wrapper {
          width: 100%;
          padding: 24px 0 32px;
        }

        .stepper-container {
          display: flex;
          align-items: center;
          justify-content: center;
          max-width: 780px;
          margin: 0 auto;
          position: relative;
        }

        .stepper-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 2;
        }

        .stepper-item.clickable {
          cursor: pointer;
        }

        .stepper-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 700;
          background: #E2E8F0;
          color: #64748B;
          transition: all 0.25s ease;
          border: 2px solid transparent;
        }

        .stepper-item.active .stepper-circle {
          background: #0D7A75;
          color: #ffffff;
          box-shadow: 0 0 0 4px rgba(13, 122, 117, 0.15);
        }

        .stepper-item.completed .stepper-circle {
          background: #0D7A75;
          color: #ffffff;
        }

        .stepper-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #718096;
          white-space: nowrap;
          transition: color 0.25s ease;
        }

        .stepper-item.active .stepper-label {
          color: #0D7A75;
          font-weight: 700;
        }

        .stepper-item.completed .stepper-label {
          color: #2D3748;
        }

        .stepper-line {
          flex: 1;
          height: 2px;
          background: #E2E8F0;
          margin: 0 12px;
          position: relative;
          top: -14px;
          transition: background 0.3s ease;
        }

        .stepper-line.completed {
          background: #0D7A75;
        }

        @media (max-width: 640px) {
          .stepper-label {
            font-size: 0.6875rem;
          }
          .stepper-circle {
            width: 30px;
            height: 30px;
            font-size: 0.75rem;
          }
          .stepper-line {
            margin: 0 6px;
            top: -12px;
          }
        }
      `}</style>
    </div>
  );
};
