import React from 'react';

interface BannerProps {
  showProfileLogo: boolean;
  setShowProfileLogo: (show: boolean) => void;
  customProfileImage: string | null;
  handleProfileRightClick: (e: React.MouseEvent) => void;
  setIsSettingsOpen: (open: boolean) => void;
}

const Banner: React.FC<BannerProps> = ({
  showProfileLogo,
  setShowProfileLogo,
  customProfileImage,
  handleProfileRightClick,
  setIsSettingsOpen
}) => {
  // Logo path - works on both desktop and mobile
  const logoPath = './images/120r.png';

  return (
    <div className="w-full sticky top-0 z-50 h-16 px-2 sm:px-4">
      <div className="flex items-center justify-between h-full max-w-6xl mx-auto relative">
        <button
          onClick={() => setShowProfileLogo(!showProfileLogo)}
          onContextMenu={handleProfileRightClick}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-[#800000]/60 rounded-full overflow-hidden border-2 border-[var(--color-text-primary)] hover:opacity-80 transition-opacity flex-shrink-0"
          title={customProfileImage ? "Custom Image (right-click to change)" : showProfileLogo ? "R Logo (click to switch, right-click to upload)" : "Profile (click to switch, right-click to upload)"}
        >
          {customProfileImage ? (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <img
                src={customProfileImage}
                alt="Custom Profile"
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : showProfileLogo ? (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <img
                src={logoPath}
                alt="R Logo"
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-sm object-contain"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-text-primary)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--color-text-primary)] hover:opacity-80 transition-opacity transform hover:rotate-90 duration-300 bg-[#800000]/60 rounded-full flex items-center justify-center flex-shrink-0"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.962.062 2.18-.948 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Banner;