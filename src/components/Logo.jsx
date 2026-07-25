import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import mark from '../assets/logo-mark.png';
import markWhite from '../assets/logo-mark-white.png';
import strip from '../assets/logo-strip.png';
import stripWhite from '../assets/logo-strip-white.png';

/**
 * Sport Academy logo (ballet mark).
 *
 * variant: "mark" (single dancer, for small square spots — icon boxes, favicon)
 *          | "full" (5-dancer strip + "SPORT ACADEMY" wordmark, for spots with horizontal room)
 * tone:    "auto" (dark text on light theme, white on dark) | "navy" | "white"
 *
 * Pass width/height via className or style as usual. For "full", height
 * sizes the icon and the wordmark scales to match.
 */
const Logo = ({ variant = 'mark', tone = 'auto', className = '', style, alt = 'Sport Academy' }) => {
  const { isDark } = useTheme();
  const white = tone === 'white' || (tone === 'auto' && isDark);

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`} style={style}>
        <img src={white ? stripWhite : strip} alt={alt} draggable={false} style={{ objectFit: 'contain', height: '100%', width: 'auto' }} />
        <div className="flex flex-col leading-none">
          <span className="font-black tracking-tight text-xl" style={{ color: white ? '#fff' : 'var(--text-primary)' }}>
            SPORT
          </span>
          <span className="font-black tracking-tight text-xl mt-0.5" style={{ color: white ? 'rgba(255,255,255,0.85)' : '#EC4899' }}>
            ACADEMY
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={white ? markWhite : mark}
      alt={alt}
      className={className}
      style={{ objectFit: 'contain', ...style }}
      draggable={false}
    />
  );
};

export default Logo;
