'use client';

import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

export function Navbar() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <a href="https://fiveminutes.in" target="_blank" rel="noopener noreferrer">
          <img 
            src="/images/cropped-5minlogo-final.png" 
            alt="Five Minutes Logo" 
            height="40"
          />
        </a>
      </div>
      <div className={styles.time}>
        {currentTime}
      </div>
    </nav>
  );
}
