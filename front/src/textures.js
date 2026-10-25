import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

function make(size, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

// Gravier du terrain : bruit de petits points.
export const gravelTexture = () =>
  make(256, (g, s) => {
    g.fillStyle = '#cdb98c';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(120,100,70,.35)' : 'rgba(255,245,220,.35)';
      g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  }, [3, 6]);

// Combinaison à toile d'araignée : base unie + fines lignes.
export const webTexture = (base, line) =>
  make(128, (g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    g.strokeStyle = line;
    g.lineWidth = 1.5;
    for (let i = 0; i <= 8; i++) {
      g.beginPath(); g.moveTo((i * s) / 8, 0); g.lineTo((i * s) / 8, s); g.stroke();
    }
    for (let r = 1; r <= 5; r++) {
      g.beginPath(); g.arc(s / 2, s / 2, r * 12, 0, Math.PI * 2); g.stroke();
    }
  }, [1, 1]);

// Ombre portée factice : tache sombre qui s'estompe sur les bords.
export const blobTexture = () =>
  make(64, (g, s) => {
    const grad = g.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(0,0,0,.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  });
