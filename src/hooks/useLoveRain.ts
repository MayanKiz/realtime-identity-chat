import { useCallback } from 'react';

const LOVE_KEYWORDS = ['love', 'Sample Message', 'Sample Message', 'heart', 'Sample Message', 'Sample Text', 'Sample Message', '❤️', '💕', '💗', '😘'];

export const useLoveRain = () => {
  const triggerLoveRain = useCallback(() => {
    const hearts = ['❤️', '💕', '💗', '💖', '💘', '💝', '💓', '💞'];
    const container = document.createElement('div');
    container.className = 'love-rain';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    container.style.overflow = 'hidden';
    
    document.body.appendChild(container);

    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.className = 'falling-heart';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = `${Math.random() * 100}vw`;
        heart.style.fontSize = `${Math.random() * 1.5 + 1}rem`;
        heart.style.animationDuration = `${Math.random() * 2 + 2}s`;
        heart.style.opacity = `${Math.random() * 0.5 + 0.5}`;
        container.appendChild(heart);

        setTimeout(() => heart.remove(), 4000);
      }, i * 100);
    }

    setTimeout(() => container.remove(), 5000);
  }, []);

  const checkForLoveKeywords = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    return LOVE_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }, []);

  return { triggerLoveRain, checkForLoveKeywords };
};
