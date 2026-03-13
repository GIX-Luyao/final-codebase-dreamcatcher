import React, { useEffect, useState } from 'react';
import './PrivacyLanding.css';
import tmobileLogo from '../assets/tmobile-logo.png';

const PrivacyLanding = ({ onContinue }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    setIsVisible(true);
  }, []);

  const handleClick = () => {
    if (isExiting) return; // Prevent multiple clicks
    
    setIsExiting(true);
    // Wait for exit animation to complete before calling onContinue
    setTimeout(() => {
      if (onContinue) {
        onContinue();
      }
    }, 600); // Match the transition duration
  };

  return (
    <div className={`privacy-landing ${isExiting ? 'exiting' : ''}`} onClick={handleClick}>
      {/* Pink-only atmospheric background */}
      <div className="privacy-background">
      </div>

      {/* Main content */}
      <div className={`privacy-content ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}>
        {/* Floating T-Mobile logo */}
        <div className="privacy-icon-wrapper">
          <img 
            src={tmobileLogo} 
            alt="T-Mobile" 
            className="privacy-icon tmobile-logo"
          />
        </div>

        {/* Main headline with gradient text */}
        <h1 className="privacy-headline">
          <span className="gradient-text">Your Privacy,</span>
          <span className="gradient-text">&nbsp;Our Priority</span>
        </h1>

        {/* Subheading */}
        <p className="privacy-subheading">
          All data is stored locally on your device.
        </p>

        {/* Continue hint */}
        <p className="privacy-continue">
          Click anywhere to continue
        </p>
      </div>
    </div>
  );
};

export default PrivacyLanding;
