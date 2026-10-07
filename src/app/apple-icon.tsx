import { ImageResponse } from 'next/og';


// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Apple touch icon generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 110,
          background: 'linear-gradient(135deg, #059669 0%, #06b6d4 40%, #8b5cf6 75%, #f59e0b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '26%',
          fontWeight: 900,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
        }}
      >
        M
      </div>
    ),
    {
      ...size,
    }
  );
}
