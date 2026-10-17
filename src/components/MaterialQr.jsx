import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const cache = new Map();

/**
 * Small scannable QR for a material's video link — lets students scan the
 * code from a projected or shared screen to open the video on their phone.
 */
const MaterialQr = ({ link, size = 84, title = 'QR' }) => {
  const [src, setSrc] = useState(cache.get(link) || '');

  useEffect(() => {
    if (!link || src) return undefined;
    let alive = true;
    QRCode.toDataURL(link, {
      width: size * 2,
      margin: 1,
      color: { dark: '#9D174D', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        cache.set(link, url);
        if (alive) setSrc(url);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [link, size, src]);

  if (!src) return null;
  return (
    <img
      src={src}
      alt={title}
      width={size}
      height={size}
      className="rounded-lg flex-shrink-0"
      style={{ border: '1px solid var(--border)', background: '#fff', padding: 2 }}
    />
  );
};

export default MaterialQr;
