import React from "react";

export interface AvatarState {
  hair?: string;
  outfit?: string;
  accessory?: string;
}

interface PlayerAvatarProps {
  name: string;
  avatar: AvatarState;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, avatar }) => {
  return (
    <div className="avatar-container">
      <h4>{name}</h4>
      <div className="avatar">
        {/* Base body/mannequin - you can add a default base image here */}
        <div className="layer base" style={{ 
          width: '180px', 
          height: '240px', 
          background: 'linear-gradient(180deg, #ffe6f2 0%, #ffc2e0 100%)',
          borderRadius: '50% 50% 40% 40% / 60% 60% 40% 40%',
          position: 'relative'
        }}>
          {/* Simple face */}
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '48px'
          }}>
            😊
          </div>
        </div>
        
        {/* Layered items */}
        {avatar.hair && <img src={avatar.hair} alt="hair" className="layer" />}
        {avatar.outfit && <img src={avatar.outfit} alt="outfit" className="layer" />}
        {avatar.accessory && <img src={avatar.accessory} alt="accessory" className="layer" />}
      </div>
    </div>
  );
};

export default PlayerAvatar;
