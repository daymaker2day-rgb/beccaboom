import React from 'react';

const QRCode: React.FC = () => {
  const appUrl = 'https://beccaboom.web.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;

  return (
    <div className="fixed bottom-4 right-4 bg-white/90 p-4 rounded-lg shadow-xl border-2 border-[var(--color-accent)] backdrop-blur-sm max-w-[250px]">
      <h2 className="text-[var(--color-text-primary)] font-bold text-sm mb-2">Scan to Open on Apple Devices</h2>
      <img 
        src={qrCodeUrl} 
        alt="QR Code for BoomRebecca App"
        className="w-32 h-32 mx-auto border-2 border-[var(--color-accent)] rounded-lg p-2 bg-white"
      />
      <p className="text-[var(--color-text-secondary)] text-xs mt-2 text-center">
        Scan with iPhone/iPad camera
      </p>
    </div>
  );
};

export default QRCode;