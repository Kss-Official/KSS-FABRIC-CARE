import React, { useState } from 'react';

/**
 * Universal Page Hero Banner Component
 * Delivers the premium dual white fade overlay + Playfair Display H1 & Inter H2
 * with responsive dimensions matching the FabriCare page standard (520px desktop max-height, 280px mobile).
 */
export const PageHeroBanner = ({
  bgImage,
  heading,
  subtitle,
  paragraph,
  ctaText,
  onCtaClick,
  altText,
  aspectRatio,
  maxHeight,
  containerStyle,
  imgStyle,
  hideBlur = false,
  fadeOpacity
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const showPlaceholder = !bgImage || bgImage.trim() === '' || imgError;

  return (
    <section
      aria-label={heading || 'Hero Banner'}
      className={`page-hero-banner-container ${aspectRatio ? 'custom-aspect-ratio' : ''}`}
      style={{
        ...(aspectRatio ? { aspectRatio } : {}),
        ...(maxHeight ? { maxHeight } : {}),
        ...containerStyle
      }}
    >
      {/* 1. Background Image (Fixed attachment so image remains stationary while page content scrolls) */}
      {bgImage && bgImage.trim() !== '' && !imgError && (
        <div
          className={`page-hero-bg-layer ${imgLoaded ? 'loaded' : ''}`}
          style={{
            backgroundImage: `url(${bgImage})`,
            ...imgStyle
          }}
          aria-hidden="true"
        >
          <img
            src={bgImage}
            alt={altText || heading || 'FabriCare Garment Care'}
            className="preload-hero-img"
            style={{ display: 'none' }}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        </div>
      )}

      {/* 2. Fallback Placeholder if image fails to load */}
      {showPlaceholder && (
        <div className="page-hero-placeholder">
          <div className="placeholder-dashed-box">
            <svg
              className="placeholder-icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect width="18" height="18" x="3" y="3" rx="3" ry="3" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <p className="placeholder-title">{heading || 'Hero Image'}</p>
          </div>
        </div>
      )}

      {/* 3. Dual White Fade Overlay Layers (Desktop & Mobile) */}
      <div
        className="page-hero-fade-overlay"
        aria-hidden="true"
        style={fadeOpacity !== undefined ? { opacity: fadeOpacity } : undefined}
      />
      {!hideBlur && <div className="page-hero-blur-overlay" aria-hidden="true" />}

      {/* 4. Text Block (Right-aligned container on desktop, centered column) */}
      <div className="page-hero-text-block absolute right-[6%] top-1/2 -translate-y-1/2 flex flex-col items-center text-center w-fit max-w-[46%]">
        <h1 className="page-hero-heading text-center mx-auto">
          {heading}
        </h1>

        {subtitle && (
          <h2 className="page-hero-subtitle text-center mx-auto">
            {subtitle}
          </h2>
        )}

        {paragraph && (
          <p className="page-hero-paragraph text-center mx-auto">
            {paragraph}
          </p>
        )}

        {ctaText && (
          <button
            type="button"
            className="page-hero-cta-btn text-center mx-auto"
            onClick={onCtaClick}
          >
            {ctaText}
          </button>
        )}
      </div>

      <style>{`
        /* ==========================================================================
           PAGE HERO BANNER COMPONENT STYLES
           Consistent size across all subpages: 5120x1920 ratio, 520px max, 280px mobile.
           ========================================================================== */
        .page-hero-banner-container {
          position: relative;
          width: 100%;
          max-width: 1920px;
          margin: 0 auto;
          overflow: hidden;
          aspect-ratio: 5120 / 1920;
          background-color: #FAFCFC;
          touch-action: manipulation;
        }

        /* 1. Background image (Fixed to viewport so it remains fixed while page content scrolls) */
        .page-hero-bg-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-attachment: fixed;
          background-position: center top;
          background-size: cover;
          background-repeat: no-repeat;
          opacity: 0;
          transition: opacity 0.7s ease-out;
          display: block;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: high-quality;
          z-index: 1;
        }

        .page-hero-bg-layer.loaded {
          opacity: 1;
        }

        .page-hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          opacity: 0;
          transition: opacity 0.7s ease-out;
          display: block;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: high-quality;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .page-hero-img.loaded {
          opacity: 1;
        }

        /* 2. Placeholder */
        .page-hero-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding-left: clamp(24px, 6vw, 96px);
          background: linear-gradient(135deg, #E8F5D8 0%, #F5FBF0 50%, #FFFFFF 100%);
          z-index: 1;
        }

        .placeholder-dashed-box {
          border: 2px dashed rgba(142, 190, 130, 0.7);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 24px 32px;
          max-width: 360px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .placeholder-icon {
          width: 36px;
          height: 36px;
          color: rgba(11, 90, 69, 0.75);
        }

        .placeholder-title {
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #1F4D40;
          margin: 0;
        }

        /* 3. White Fade Overlay (Softened and reduced so photo shines through) */
        .page-hero-fade-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          background:
            linear-gradient(to right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0) 52%,
              rgba(255, 255, 255, 0.35) 70%,
              rgba(255, 255, 255, 0.65) 86%,
              rgba(255, 255, 255, 0.82) 100%),
            linear-gradient(to top,
              rgba(255, 255, 255, 0.2) 0%,
              rgba(255, 255, 255, 0) 25%);
        }

        .page-hero-blur-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          backdrop-filter: blur(1.5px);
          -webkit-backdrop-filter: blur(1.5px);
          mask-image: linear-gradient(to right, transparent 68%, black 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 68%, black 100%);
        }

        /* 4. Text Block (Centered column over subtitle width, right-positioned on desktop) */
        .page-hero-text-block {
          position: absolute;
          right: 6%;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: fit-content;
          max-width: 46%;
          z-index: 3;
          transition: all 0.3s ease;
        }

        @media (min-width: 641px) {
          .page-hero-text-block {
            min-width: max-content;
          }
        }

        .page-hero-heading {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          color: #0B5A45;
          font-size: clamp(32px, 4.2vw, 64px);
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0;
          text-align: center;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
          text-shadow: 0 1px 3px rgba(255, 255, 255, 0.6);
        }

        .page-hero-subtitle {
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          color: #1F4D40;
          font-size: clamp(14px, 1.35vw, 20px);
          line-height: 1.4;
          margin: 12px 0 0;
          text-align: center;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7);
        }

        .page-hero-paragraph {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(13px, 1.1vw, 16px);
          color: #2D5A4E;
          margin: 10px auto 0;
          text-align: center;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.5;
          width: 100%;
        }

        .page-hero-cta-btn {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #FFFFFF;
          background-color: #0B5A45;
          border: none;
          border-radius: 9999px;
          padding: 10px 24px;
          margin: 16px auto 0;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          margin-left: auto;
          margin-right: auto;
        }

        /* Responsive Breakpoints */
        .page-hero-banner-container.custom-aspect-ratio {
          min-height: unset;
        }

        @media (max-width: 1023px) {
          .page-hero-text-block {
            max-width: 48%;
            min-width: unset;
          }
        }

        @media (max-width: 640px) {
          .page-hero-banner-container {
            aspect-ratio: auto;
            height: 280px;
            max-height: 280px;
            min-height: 280px;
          }

          .page-hero-banner-container.custom-aspect-ratio {
            height: auto;
            max-height: none;
            min-height: 220px;
          }

          .page-hero-img {
            object-position: center top;
          }

          .page-hero-fade-overlay {
            background: linear-gradient(to top,
              rgba(255, 255, 255, 0.88) 0%,
              rgba(255, 255, 255, 0.62) 45%,
              rgba(255, 255, 255, 0) 75%);
          }

          .page-hero-blur-overlay {
            mask-image: linear-gradient(to top, black 50%, transparent 100%);
            -webkit-mask-image: linear-gradient(to top, black 50%, transparent 100%);
          }

          .page-hero-text-block {
            right: auto;
            left: 50%;
            top: auto;
            bottom: 20px;
            transform: translateX(-50%);
            width: 92%;
            max-width: 92%;
            min-width: unset;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .page-hero-heading {
            font-size: clamp(26px, 7vw, 34px);
            text-align: center;
            margin-left: auto;
            margin-right: auto;
          }

          .page-hero-subtitle {
            font-size: 13px;
            margin: 6px 0 0;
            line-height: 1.3;
            text-align: center;
            margin-left: auto;
            margin-right: auto;
          }

          .page-hero-paragraph {
            font-size: 12px;
            margin: 6px auto 0;
            text-align: center;
          }

          .page-hero-cta-btn {
            font-size: 13px;
            padding: 8px 20px;
            margin: 12px auto 0;
          }
        }
      `}</style>
    </section>
  );
};

export default PageHeroBanner;
