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
            <span className="booking-hero-eyebrow">BOOK A PICKUP</span>
            <h1 className="booking-main-title">
              Fresh Clothes,<br />
              <span className="highlight-text">Simplified.</span>
            </h1>
            <p className="booking-main-subtitle">
              Select your service, share your details, choose a time and we’ll take care of the rest.
            </p>
          </div>

          <div className="booking-hero-graphic">
            <img 
              src="/assets/booking-hero-towels.png" 
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
          background: #F0FAFB;
          padding: 42px 0 28px;
        }

        .booking-hero-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }

        .booking-hero-text {
          flex: 1;
          text-align: left;
        }

        .booking-hero-eyebrow {
          display: inline-block;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #087F8C;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .booking-main-title {
          font-family: 'Poppins', sans-serif;
          font-size: 2.75rem;
          font-weight: 800;
          color: #102A36;
          letter-spacing: -0.03em;
          margin: 0 0 12px;
          line-height: 1.15;
          text-align: left;
        }

        .highlight-text {
          color: #087F8C;
        }

        .booking-main-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          color: #64748B;
          max-width: 520px;
          margin: 0;
          line-height: 1.55;
          text-align: left;
        }

        .booking-hero-graphic {
          width: 320px;
          max-width: 42%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .towels-graphic-img {
          width: 100%;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 14px 28px rgba(8, 127, 140, 0.14));
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
          .booking-hero-section {
            background: #F0FAFB !important;
            padding: 24px 16px 20px !important;
          }

          .booking-hero-container {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 12px !important;
            padding: 0 2px !important;
            width: 100% !important;
          }

          .booking-hero-text {
            flex: 1 1 58% !important;
            min-width: 0 !important;
            text-align: left !important;
          }

          .booking-hero-eyebrow {
            font-size: 11px !important;
            font-weight: 800 !important;
            letter-spacing: 1.8px !important;
            color: #087F8C !important;
            margin-bottom: 6px !important;
            display: inline-block !important;
          }

          .booking-main-title {
            font-size: 24px !important;
            font-weight: 800 !important;
            color: #102A36 !important;
            line-height: 1.15 !important;
            margin-bottom: 8px !important;
            letter-spacing: -0.02em !important;
            text-align: left !important;
          }

          .booking-main-title .highlight-text {
            color: #087F8C !important;
          }

          .booking-main-subtitle {
            font-size: 12px !important;
            line-height: 1.45 !important;
            max-width: 100% !important;
            text-align: left !important;
            color: #556D7A !important;
          }

          .booking-hero-graphic {
            display: flex !important;
            flex: 0 0 40% !important;
            max-width: 155px !important;
            align-items: center !important;
            justify-content: flex-end !important;
            margin: 0 !important;
          }

          .towels-graphic-img {
            display: block !important;
            width: 100% !important;
            max-width: 145px !important;
            height: auto !important;
            object-fit: contain !important;
            filter: drop-shadow(0 6px 16px rgba(8, 127, 140, 0.14)) !important;
          }

          .booking-wizard-section {
            padding: 14px 0 44px;
          }

          .wizard-main-card {
            background: transparent;
            border: none;
            box-shadow: none;
            padding: 0;
          }

          .wizard-step-content {
            margin-top: 16px;
            background: #FFFFFF;
            border: 1.5px solid #E6EEF1;
            border-radius: 24px;
            padding: 22px 18px;
            box-shadow: 0 4px 20px rgba(8, 127, 140, 0.04);
            box-sizing: border-box;
          }
        }

        @media (max-width: 420px) {
          .booking-hero-section {
            padding: 20px 12px 16px !important;
          }
          .booking-hero-text {
            flex: 1 1 57% !important;
          }
          .booking-hero-eyebrow {
            font-size: 10px !important;
            letter-spacing: 1.5px !important;
            margin-bottom: 4px !important;
          }
          .booking-main-title {
            font-size: 21px !important;
            line-height: 1.15 !important;
            margin-bottom: 6px !important;
          }
          .booking-main-subtitle {
            font-size: 11px !important;
            line-height: 1.4 !important;
          }
          .booking-hero-graphic {
            flex: 0 0 41% !important;
            max-width: 125px !important;
          }
          .towels-graphic-img {
            max-width: 120px !important;
          }
        }

        @media (max-width: 360px) {
          .booking-main-title {
            font-size: 18px !important;
          }
          .booking-main-subtitle {
            font-size: 10px !important;
          }
          .booking-hero-graphic {
            max-width: 105px !important;
          }
        }
      `}</style>
    </div>
  );
};
