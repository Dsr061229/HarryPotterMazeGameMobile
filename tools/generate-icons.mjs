// 生成 PWA 图标。运行：node tools/generate-icons.mjs
// 依赖 sharp（devDependency）。主题：暮篱迷宫——暗绿夜色 + 金色火龙杯 + 树篱迷宫边框。
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('icons', { recursive: true });

// emblem：金色火龙杯 + 迷宫回纹边框。inset 控制 maskable 安全区留白。
function svg(size, inset) {
  const m = Math.round(size * inset);          // 外边距
  const s = size - m * 2;                       // 内容区
  const cx = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="#1d3326"/>
      <stop offset="55%" stop-color="#101d15"/>
      <stop offset="100%" stop-color="#070d0a"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fbe7a6"/>
      <stop offset="45%" stop-color="#e6c463"/>
      <stop offset="100%" stop-color="#a9842f"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="50%">
      <stop offset="0%" stop-color="rgba(245,214,110,0.55)"/>
      <stop offset="100%" stop-color="rgba(245,214,110,0)"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${m + s * 0.42}" r="${s * 0.42}" fill="url(#glow)"/>
  <g transform="translate(${cx} ${m + s * 0.5})" fill="url(#gold)" stroke="#7a5e22" stroke-width="${s * 0.008}">
    <!-- 杯身 -->
    <path d="M ${-s*0.20} ${-s*0.20}
             C ${-s*0.20} ${s*0.06}, ${-s*0.13} ${s*0.16}, 0 ${s*0.18}
             C ${s*0.13} ${s*0.16}, ${s*0.20} ${s*0.06}, ${s*0.20} ${-s*0.20} Z"/>
    <!-- 双耳 -->
    <path d="M ${-s*0.20} ${-s*0.17} C ${-s*0.31} ${-s*0.12}, ${-s*0.31} ${s*0.02}, ${-s*0.21} ${s*0.04}
             L ${-s*0.205} ${-s*0.02} C ${-s*0.255} ${-s*0.03}, ${-s*0.255} ${-s*0.11}, ${-s*0.195} ${-s*0.135} Z"/>
    <path d="M ${s*0.20} ${-s*0.17} C ${s*0.31} ${-s*0.12}, ${s*0.31} ${s*0.02}, ${s*0.21} ${s*0.04}
             L ${s*0.205} ${-s*0.02} C ${s*0.255} ${-s*0.03}, ${s*0.255} ${-s*0.11}, ${s*0.195} ${-s*0.135} Z"/>
    <!-- 杯颈与底座 -->
    <rect x="${-s*0.045}" y="${s*0.17}" width="${s*0.09}" height="${s*0.10}"/>
    <path d="M ${-s*0.17} ${s*0.30} C ${-s*0.10} ${s*0.245}, ${s*0.10} ${s*0.245}, ${s*0.17} ${s*0.30}
             L ${s*0.17} ${s*0.32} L ${-s*0.17} ${s*0.32} Z"/>
  </g>
  <!-- 杯口蓝色魔焰 -->
  <g transform="translate(${cx} ${m + s * 0.5})">
    <path d="M ${-s*0.11} ${-s*0.21} C ${-s*0.06} ${-s*0.33}, ${-s*0.02} ${-s*0.27}, 0 ${-s*0.36}
             C ${s*0.02} ${-s*0.27}, ${s*0.06} ${-s*0.33}, ${s*0.11} ${-s*0.21}
             C ${s*0.07} ${-s*0.15}, ${-s*0.07} ${-s*0.15}, ${-s*0.11} ${-s*0.21} Z"
          fill="#8fd0ff" opacity="0.92"/>
    <path d="M ${-s*0.05} ${-s*0.21} C ${-s*0.02} ${-s*0.28}, ${-s*0.01} ${-s*0.25}, 0 ${-s*0.30}
             C ${s*0.01} ${-s*0.25}, ${s*0.02} ${-s*0.28}, ${s*0.05} ${-s*0.21}
             C ${s*0.03} ${-s*0.17}, ${-s*0.03} ${-s*0.17}, ${-s*0.05} ${-s*0.21} Z"
          fill="#eaf7ff"/>
  </g>
</svg>`;
}

async function render(name, size, inset) {
  await sharp(Buffer.from(svg(size, inset))).png().toFile(`icons/${name}`);
  console.log('wrote icons/' + name);
}

await render('icon-192.png', 192, 0.04);
await render('icon-512.png', 512, 0.04);
await render('icon-maskable-512.png', 512, 0.16); // maskable 安全区
console.log('done');
