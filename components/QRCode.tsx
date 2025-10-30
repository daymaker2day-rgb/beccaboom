import React from 'react';

const QRCode: React.FC = () => {
  const appUrl = 'https://daymaker2day-rgb.github.io/beccaboom';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Scan to Open on Apple Devices</h2>
      <img 
        src={qrCodeUrl} 
        alt="QR Code for BoomRebecca App"
        style={{ 
          maxWidth: '200px', 
          margin: '20px auto',
          border: '2px solid #333',
          borderRadius: '10px',
          padding: '10px',
          backgroundColor: 'white'
        }}
      />
      <p>Scan this code with your iPhone or iPad camera to open the app</p>
    </div>
  );
};

export default QRCode;