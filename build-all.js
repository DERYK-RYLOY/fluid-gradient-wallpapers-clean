/* Renders every theme at 4K. Run: node build-all.js [width] [height] */
const { execFileSync } = require('child_process');
const path = require('path');

const themes = ['aurora', 'ember', 'ocean', 'neon', 'sage'];
const W = parseInt(process.argv[2] || '3840', 10);
const H = parseInt(process.argv[3] || '2160', 10);
const names = {
  aurora: '01-aurora-night.png',
  ember:  '02-ember-silk.png',
  ocean:  '03-ocean-glass.png',
  neon:   '04-neon-dusk.png',
  sage:   '05-sage-mist.png'
};

for (const theme of themes) {
  const out = path.join(__dirname, 'images', names[theme]);
  execFileSync(process.execPath, [path.join(__dirname, 'render-pro.js'), theme, String(W), String(H), out], {
    stdio: 'inherit'
  });
}
console.log('All themes rendered.');
