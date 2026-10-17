import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, PlayCircle } from 'lucide-react';

const driveFileId = (link) =>
  /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*?id=)([\w-]{10,})/.exec(String(link || ''))?.[1] || null;

/**
 * Full-size media viewer for a material: the lesson image (if any) at full
 * width, with the video playable inline right below it. Close on overlay
 * click or Escape.
 */
const MaterialViewer = ({ material, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!material) return null;
  const fileId = driveFileId(material.link);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl"
        style={{ background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 end-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
          aria-label="close"
        >
          <X size={16} />
        </button>

        <div className="p-4 pb-0">
          <h3 className="font-black text-base pe-10 mb-3" style={{ color: '#1F2937' }}>
            {material.title}
          </h3>
        </div>

        {material.imageUrl && (
          <div className="px-4">
            <img src={material.imageUrl} alt={material.title} className="w-full h-auto block rounded-xl" />
          </div>
        )}

        {fileId && (
          <div className="p-4">
            <div
              className="w-full rounded-xl overflow-hidden"
              style={{ aspectRatio: '16 / 9', background: '#000' }}
            >
              <iframe
                src={`https://drive.google.com/file/d/${fileId}/preview`}
                title={material.title}
                className="w-full h-full"
                allow="autoplay"
                allowFullScreen
              />
            </div>
            <p className="flex items-center gap-1.5 text-xs mt-2" style={{ color: '#9CA3AF' }}>
              <PlayCircle size={13} />
              {material.title}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MaterialViewer;
