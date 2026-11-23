import sharp from 'sharp';

export default async function handler(req, res) {
  try {
    const petals = Array.from({ length: 6 }, (_, i) => {
      const angle = i * 60;
      return `<path d="M0,-42 C-39,-92 -28,-154 0,-190 C28,-154 39,-92 0,-42Z" transform="rotate(${angle})" fill="#07803d"/>`;
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
      <rect width="1200" height="1200" fill="#fff"/>
      <g transform="translate(600 480) scale(.70)">${petals}</g>
      <text x="600" y="690" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="109" letter-spacing="3" fill="#050505">FLORAL-HEAD</text>
      <text x="600" y="775" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-style="italic" font-size="42" fill="#101010">Turn screenshots into professional fashion images.</text>
    </svg>`;
    const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.status(200).end(png);
  } catch (error) {
    res.status(500).send('Preview image unavailable');
  }
}
