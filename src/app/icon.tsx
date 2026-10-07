import { ImageResponse } from 'next/og';


// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
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
          textShadow: '0 2px 4px rgba(0,0,0,0.4)',
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
