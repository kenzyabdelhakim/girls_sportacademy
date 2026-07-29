import React from 'react';
import { Waves } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Sport Academy logo (wave mark).
 *
 * variant: "mark" (wave glyph, for small square spots — icon boxes, favicon)
 *          | "full" (wave glyph + "SPORT ACADEMY" wordmark, for spots with horizontal room)
 * tone:    "auto" (dark text on light theme, white on dark) | "navy" | "white"
 *
 * Pass width/height via className or style as usual. For "full", height
 * sizes the icon and the wordmark scales to match.
 */
const Logo = ({ variant = 'mark', tone = 'auto', className = '', style, alt = 'Sport Academy' }) => {
  const { isDark } = useTheme();
  const white = tone === 'white' || (tone === 'auto' && isDark);
  const iconColor = white ? '#fff' : '#EC4899';

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`} style={style}>
        <Waves aria-label={alt} color={iconColor} strokeWidth={2.25} style={{ height: '100%', width: 'auto' }} />
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
    <Waves aria-label={alt} color={iconColor} strokeWidth={2} className={className} style={style} />
  );
};

export default Logo;
