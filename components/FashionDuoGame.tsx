import React, { useState } from "react";
import PlayerAvatar, { AvatarState } from "./PlayerAvatar";
import "../styles/game.css";

const fashionThemes = {
  couture: {
    hair: ["/beccaboom/assets/hair/avant1.png", "/beccaboom/assets/hair/crazy1.png"],
    outfit: ["/beccaboom/assets/outfits/couture1.png", "/beccaboom/assets/outfits/avant1.png"],
    accessory: ["/beccaboom/assets/accessories/hat1.png"],
  },
  casual: {
    hair: ["/beccaboom/assets/hair/casual1.png"],
    outfit: ["/beccaboom/assets/outfits/casual1.png"],
    accessory: ["/beccaboom/assets/accessories/shades1.png"],
  },
  avant: {
    hair: ["/beccaboom/assets/hair/avant1.png"],
    outfit: ["/beccaboom/assets/outfits/avant1.png"],
    accessory: ["/beccaboom/assets/accessories/wings.png"],
  },
  crazy: {
    hair: ["/beccaboom/assets/hair/crazy1.png"],
    outfit: ["/beccaboom/assets/outfits/crazy1.png"],
    accessory: ["/beccaboom/assets/accessories/wings.png"],
  },
};

const FashionDuoGame: React.FC = () => {
  const [theme, setTheme] = useState<keyof typeof fashionThemes>("casual");
  const [player1, setPlayer1] = useState<AvatarState>({});
  const [player2, setPlayer2] = useState<AvatarState>({});
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (
    player: 1 | 2,
    type: keyof AvatarState,
    image: string
  ) => {
    const setFunc = player === 1 ? setPlayer1 : setPlayer2;
    setFunc((prev) => ({ ...prev, [type]: image }));
  };

  const handleReveal = () => setRevealed(true);
  const handleReset = () => {
    setPlayer1({});
    setPlayer2({});
    setRevealed(false);
  };

  const items = fashionThemes[theme];

  return (
    <div className="game-wrapper">
      <h2>💅 Fashion Duo — {theme.toUpperCase()} Edition 💅</h2>

      <div className="theme-selector">
        {Object.keys(fashionThemes).map((t) => (
          <button
            key={t}
            className={theme === t ? "active" : ""}
            onClick={() => {
              setTheme(t as keyof typeof fashionThemes);
              handleReset();
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="players">
        <PlayerAvatar name="Player 1" avatar={player1} />
        <PlayerAvatar name="Player 2" avatar={player2} />
      </div>

      <div className="controls">
        <h3>Choose Hair</h3>
        <div className="item-row">
          {items.hair.map((img) => (
            <button
              key={img}
              onClick={() => handleSelect(1, "hair", img)}
              title="P1 Hair"
            >
              👧
            </button>
          ))}
          {items.hair.map((img) => (
            <button
              key={img + "p2"}
              onClick={() => handleSelect(2, "hair", img)}
              title="P2 Hair"
            >
              🧒
            </button>
          ))}
        </div>

        <h3>Choose Outfit</h3>
        <div className="item-row">
          {items.outfit.map((img) => (
            <button key={img} onClick={() => handleSelect(1, "outfit", img)}>
              👗
            </button>
          ))}
          {items.outfit.map((img) => (
            <button
              key={img + "p2"}
              onClick={() => handleSelect(2, "outfit", img)}
            >
              🧥
            </button>
          ))}
        </div>

        <h3>Accessory</h3>
        <div className="item-row">
          {items.accessory.map((img) => (
            <button key={img} onClick={() => handleSelect(1, "accessory", img)}>
              💍
            </button>
          ))}
          {items.accessory.map((img) => (
            <button
              key={img + "p2"}
              onClick={() => handleSelect(2, "accessory", img)}
            >
              🎩
            </button>
          ))}
        </div>

        <div className="action-buttons">
          <button onClick={handleReveal} disabled={revealed}>
            Reveal Looks ✨
          </button>
          <button onClick={handleReset}>Reset</button>
        </div>
      </div>

      {revealed && (
        <div className="reveal">
          <h3>🌟 Fashion Show! 🌟</h3>
          <p>Vote whose style rocks this round!</p>
        </div>
      )}
    </div>
  );
};

export default FashionDuoGame;
