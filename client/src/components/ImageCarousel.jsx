import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import styles from './ImageCarousel.module.css';

const ImageCarousel = ({ images, title, className }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`${styles.placeholder} ${className || ''}`}>
        <Home size={48} color="#94a3b8" />
      </div>
    );
  }

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className={`${styles.carousel} ${className || ''}`}>
      <img 
        src={images[currentIndex]} 
        alt={`${title} - ${currentIndex + 1}`} 
        className={styles.image} 
      />
      
      {images.length > 1 && (
        <>
          <button type="button" className={styles.btnLeft} onClick={handlePrev} aria-label="Previous image">
             <ChevronLeft size={20} />
          </button>
          <button type="button" className={styles.btnRight} onClick={handleNext} aria-label="Next image">
             <ChevronRight size={20} />
          </button>
          <div className={styles.indicators}>
            {images.map((_, idx) => (
              <span 
                key={idx} 
                className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex(idx); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;
