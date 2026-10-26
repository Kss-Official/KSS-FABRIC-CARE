import React from 'react';
import { Check } from 'lucide-react';

export const Stepper = ({ currentStep, onStepClick }) => {
  const steps = [
    { number: 1, line1: 'Select', line2: 'Services' },
    { number: 2, line1: 'Pickup', line2: 'Details' },
    { number: 3, line1: 'Choose', line2: 'Time' },
    { number: 4, line1: 'Review &', line2: 'Confirm' }
  ];

  return (
    <div className="stepper-wrapper">
      <div className="stepper-card-box">
        <div className="stepper-container">
          {/* Connector Line behind circles */}
          <div className="stepper-track-line" />

          {steps.map((step) => {
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;
            const isClickable = onStepClick && isCompleted;

            return (
              <div 
                key={step.number}
                className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
                onClick={() => isClickable && onStepClick(step.number)}
              >
                <div className="stepper-circle">
                  {isCompleted ? (
                    <Check size={18} strokeWidth={2.8} />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <div className="stepper-label">
                  <span className="stepper-label-line">{step.line1}</span>
                  <span className="stepper-label-line">{step.line2}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .stepper-wrapper {
          width: 100%;
        }

        .stepper-card-box {
          background: #FFFFFF;
          border: 1.5px solid #E6EEF1;
          border-radius: 24px;
          padding: 24px 20px 22px;
          box-shadow: 0 4px 20px rgba(8, 127, 140, 0.04);
          box-sizing: border-box;
          width: 100%;
        }

        .stepper-container {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          width: 100%;
          max-width: 820px;
          margin: 0 auto;
        }

        /* Continuous line running behind circles */
        .stepper-track-line {
          position: absolute;
          top: 23px;
          left: 12.5%;
          right: 12.5%;
          height: 2px;
          background: #E2EDF0;
          z-index: 1;
        }

        .stepper-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 2;
          flex: 1;
          text-align: center;
        }

        .stepper-item.clickable {
          cursor: pointer;
        }

        .stepper-circle {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Poppins', sans-serif;
          font-size: 18px;
          font-weight: 600;
          background: #FFFFFF;
          color: #64748B;
          border: 2px solid #D5E2E6;
          transition: all 0.25s ease;
          box-sizing: border-box;
        }

        .stepper-item.active .stepper-circle {
          background: #087F8C;
          color: #FFFFFF;
          border-color: #087F8C;
          font-weight: 700;
        }

        .stepper-item.completed .stepper-circle {
          background: #087F8C;
          color: #FFFFFF;
          border-color: #087F8C;
        }

        .stepper-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          line-height: 1.25;
        }

        .stepper-label-line {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #7A8B9E;
          transition: color 0.25s ease;
        }

        .stepper-item.active .stepper-label-line {
          font-family: 'Poppins', sans-serif;
          color: #087F8C;
          font-weight: 700;
        }

        .stepper-item.completed .stepper-label-line {
          color: #12263A;
          font-weight: 600;
        }

        /* Responsive Breakpoints */
        @media (min-width: 769px) {
          .stepper-card-box {
            background: transparent;
            border: none;
            box-shadow: none;
            padding: 0 0 24px 0;
            border-radius: 0;
            border-bottom: 1px solid #EEF4F6;
            margin-bottom: 8px;
          }
        }

        @media (max-width: 640px) {
          .stepper-card-box {
            padding: 22px 14px 20px;
            border-radius: 22px;
          }
          .stepper-circle {
            width: 42px;
            height: 42px;
            font-size: 17px;
          }
          .stepper-track-line {
            top: 21px;
          }
          .stepper-label-line {
            font-size: 12px;
          }
        }

        @media (max-width: 400px) {
          .stepper-card-box {
            padding: 20px 8px 18px;
            border-radius: 20px;
          }
          .stepper-circle {
            width: 38px;
            height: 38px;
            font-size: 15px;
          }
          .stepper-track-line {
            top: 19px;
          }
          .stepper-label-line {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default Stepper;

