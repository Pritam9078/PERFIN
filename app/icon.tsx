import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ccff00',
          borderRadius: '9px',
          color: '#0a0a0a',
          fontSize: '20px',
          fontWeight: 800,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}
