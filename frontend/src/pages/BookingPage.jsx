import React from 'react';
import { useBooking } from '../context/BookingContext';
import { Stepper } from '../components/common/Stepper';
import { FeatureBadges } from '../components/common/FeatureBadges';
import { Step1SelectServices } from '../components/booking/Step1SelectServices';
import { Step2PickupDetails } from '../components/booking/Step2PickupDetails';
import { Step3ChooseTime } from '../components/booking/Step3ChooseTime';
import { Step4ReviewConfirm } from '../components/booking/Step4ReviewConfirm';

export const BookingPage = () => {
  const { currentStep, setCurrentStep } = useBooking();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1SelectServices />;
      case 2:
        return <Step2PickupDetails />;
      case 3:
        return <Step3ChooseTime />;
      case 4:
        return <Step4ReviewConfirm />;
      default:
        return <Step1SelectServices />;
    }
  };

  return (
    <div className="booking-page-container">
      {/* Booking Hero Banner */}
      <section className="booking-hero-section">
        <div className="container booking-hero-container">
          <div className="booking-hero-text">
            <span className="section-tag pill">BOOK A PICKUP</span>
            <h1 className="booking-main-title">
              Fresh Clothes, <span className="highlight-text">Simplified.</span>
            </h1>
            <p className="booking-main-subtitle">
              Select your service, share your details, choose a time and we’ll take care of the rest.
            </p>
          </div>

          <div className="booking-hero-graphic">
            <img 
              src="/assets/folded-towels.jpg" 
              alt="Fresh Stack of Clean Folded Towels" 
              className="towels-graphic-img"
            />
          </div>
        </div>
      </section>

      {/* Booking Flow Wizard Card */}
      <section className="booking-wizard-section">
        <div className="container">
          <div className="wizard-main-card">
            {/* Stepper Progress Bar */}
            <Stepper 
              currentStep={currentStep} 
              onStepClick={(step) => setCurrentStep(step)} 
            />

            {/* Step Content */}
            <div className="wizard-step-content">
              {renderCurrentStep()}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Badges Assurance */}
      <FeatureBadges />

      <style>{`
        .booking-page-container {
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #FAFCFC;
        }

        .booking-hero-section {
          background: linear-gradient(180deg, #F0FBF9 0%, #FAFCFC 100%);
          padding: 40px 0 20px;
        }

        .booking-hero-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }

        .booking-main-title {
          font-size: 2.75rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.03em;
          margin-top: 8px;
          line-height: 1.15;
        }

        .highlight-text {
          color: #0D7A75;
        }

        .booking-main-subtitle {
          font-size: 1rem;
          color: #4A5568;
          max-width: 520px;
          margin-top: 10px;
          line-height: 1.6;
        }

        .booking-hero-graphic {
          width: 220px;
          height: 160px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 24px rgba(13, 122, 117, 0.12);
        }

        .towels-graphic-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .booking-wizard-section {
          padding: 20px 0 60px;
        }

        .wizard-step1-container {
          width: 100%;
          box-sizing: border-box;
        }

        .wizard-main-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 28px;
          padding: 28px 28px;
          box-shadow: 0 12px 36px rgba(13, 122, 117, 0.05);
          box-sizing: border-box;
          max-width: 100%;
        }

        .wizard-step-content {
          margin-top: 10px;
          width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .booking-hero-container {
            flex-direction: column;
            text-align: center;
          }
          .booking-hero-graphic {
            display: none;
          }
          .wizard-main-card {
            padding: 24px 18px;
            border-radius: 20px;
          }
          .booking-main-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};
