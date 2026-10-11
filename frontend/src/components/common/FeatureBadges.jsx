import React from 'react';
import { Truck, ShieldCheck, Leaf } from 'lucide-react';

export const FeatureBadges = () => {
  const features = [
    {
      icon: <Truck size={22} className="feature-icon" />,
      title: 'Free Pickup & Delivery',
      subtitle: 'At your convenience'
    },
    {
      icon: <ShieldCheck size={22} className="feature-icon" />,
      title: 'Safe & Reliable',
      subtitle: 'Your clothes are in good hands'
    },
    {
      icon: <Leaf size={22} className="feature-icon" />,
      title: 'Eco-Friendly Cleaning',
      subtitle: 'Better for you, better for the planet'
    }
  ];

  return (
    <div className="feature-badges-section">
      <div className="container">
        <div className="feature-badges-grid">
          {features.map((f, index) => (
            <div key={index} className="feature-badge-card">
              <div className="feature-icon-wrapper">
                {f.icon}
              </div>
              <div className="feature-badge-text">
                <h4 className="feature-badge-title">{f.title}</h4>
                <p className="feature-badge-subtitle">{f.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .feature-badges-section {
          padding: 32px 0;
          background: #FAFCFC;
          border-top: 1px solid #EEF2F6;
          border-bottom: 1px solid #EEF2F6;
        }

        .feature-badges-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-badge-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 12px;
        }

        .feature-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #E6F7F5;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-badge-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1A202C;
          margin-bottom: 2px;
        }

        .feature-badge-subtitle {
          font-size: 0.8125rem;
          color: #718096;
        }

        @media (max-width: 860px) {
          .feature-badges-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};
