import React, { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const CROP_SIZE = 200; // The fixed size of the cropped image

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const generateCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');

    const img = imgRef.current;
    if (!img) return;

    const scale = zoom;
    
    // We want the image to fit cover by default, then zoom
    const ratio = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    const scaledWidth = img.naturalWidth * ratio * scale;
    const scaledHeight = img.naturalHeight * ratio * scale;

    // Calculate position
    const cx = CROP_SIZE / 2;
    const cy = CROP_SIZE / 2;
    
    // The offset is the visual pan. We add it to the center.
    const drawX = cx - (scaledWidth / 2) + offset.x;
    const drawY = cy - (scaledHeight / 2) + offset.y;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
    
    ctx.drawImage(
      img,
      0, 0, img.naturalWidth, img.naturalHeight,
      drawX, drawY, scaledWidth, scaledHeight
    );

    canvas.toBlob((blob) => {
      const file = new File([blob], 'profile_crop.jpg', { type: 'image/jpeg' });
      onCropComplete(file, URL.createObjectURL(blob));
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="modal-overlay" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="glass-panel modal-content" style={{ padding: '2rem', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Crop Profile Picture</h3>
        
        <div 
          ref={containerRef}
          style={{ 
            width: CROP_SIZE, height: CROP_SIZE, 
            borderRadius: '50%', overflow: 'hidden', 
            position: 'relative', cursor: isDragging ? 'grabbing' : 'grab',
            border: '2px solid var(--accent-primary)',
            background: 'rgba(0,0,0,0.5)'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Overlay mask logic - the container has overflow hidden and 50% border radius so it visually crops it */}
          <img 
            ref={imgRef}
            src={imageSrc} 
            alt="Crop Preview" 
            draggable={false}
            style={{ 
              position: 'absolute',
              top: '50%', left: '50%',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
              minWidth: '100%', minHeight: '100%',
              objectFit: 'cover'
            }} 
          />
        </div>

        <div style={{ width: '100%', marginTop: '2rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Zoom</label>
          <input 
            type="range" 
            min="1" max="3" step="0.05" 
            value={zoom} 
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--accent-primary)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', width: '100%' }}>
          <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }} onClick={onCancel}>
            <X size={18} style={{ marginRight: '8px' }} /> Cancel
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={generateCrop}>
            <Check size={18} style={{ marginRight: '8px' }} /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
