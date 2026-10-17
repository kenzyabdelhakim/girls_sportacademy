import React, { useEffect, useState } from 'react';
import { BookOpen, Award, Sparkles, ImagePlus } from 'lucide-react';

const TYPE_META = {
  lecture: {
    Icon: BookOpen,
    gradient: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 45%, #F9A8D4 100%)',
    iconColor: '#DB2777',
  },
  skill: {
    Icon: Award,
    gradient: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 40%, #F472B6 100%)',
    iconColor: '#BE185D',
  },
  other: {
    Icon: Sparkles,
    gradient: 'linear-gradient(135deg, #FFF1F2 0%, #FCE7F3 50%, #FDA4AF 100%)',
    iconColor: '#E11D48',
  },
};

/**
 * 16:9 material cover with object-fit cover, load-error fallback,
 * and an attractive type-based placeholder when no image is set.
 */
const MaterialCover = ({
  imageUrl,
  materialType = 'other',
  alt = '',
  showUploadHint = false,
  uploadHintLabel = 'Add image',
  onUploadClick,
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const meta = TYPE_META[materialType] || TYPE_META.other;
  const { Icon } = meta;
  const showImage = Boolean(imageUrl) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl ${className}`}
      style={{ aspectRatio: '16 / 9', background: meta.gradient }}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.65)', boxShadow: '0 4px 16px rgba(219,39,119,0.12)' }}
          >
            <Icon size={24} style={{ color: meta.iconColor }} />
          </div>
          {showUploadHint && (
            <button
              type="button"
              onClick={onUploadClick}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: 'rgba(255,255,255,0.8)',
                color: meta.iconColor,
                border: `1px solid ${meta.iconColor}33`,
              }}
            >
              <ImagePlus size={13} />
              {uploadHintLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialCover;
