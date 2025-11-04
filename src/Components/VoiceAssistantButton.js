// components/VoiceAssistantButton.tsx
import React from 'react';
import {
  Box,
  alpha,
  keyframes,
} from '@mui/material';
import {  PhoneInTalk } from '@mui/icons-material';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
`;

export const VoiceAssistantButton = ({
  onClick,
}) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        width: 120,
        height: 120,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover .voice-button': {
          transform: 'scale(1.05)',
        },
        '&:hover .ripple-1, &:hover .ripple-2': {
          animationPlayState: 'running',
        },
      }}
    >
      {/* Ripple effects */}
      <Box
        className="ripple-1"
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(101, 53, 233, 0.2) 0%, transparent 70%)',
          animation: `${ripple} 3s ease-out infinite`,
          animationDelay: '0s',
          animationPlayState: 'paused',
        }}
      />
      <Box
        className="ripple-2"
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(101, 53, 233, 0.15) 0%, transparent 70%)',
          animation: `${ripple} 3s ease-out infinite`,
          animationDelay: '1.5s',
          animationPlayState: 'paused',
        }}
      />
      
      {/* Main button */}
      <Box
        className="voice-button"
        sx={{
          position: 'relative',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6535E9 0%, #4E33E9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(101, 53, 233, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: `${pulse} 2s ease-in-out infinite`,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: -2,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6535E9, #4E33E9, #6535E9)',
            opacity: 0.5,
            filter: 'blur(8px)',
            animation: `${pulse} 2s ease-in-out infinite`,
          },
        }}
      >
        <PhoneInTalk
          sx={{
            fontSize: 32,
            color: '#fff',
            position: 'relative',
            zIndex: 1,
          }}
        />
      </Box>
      
      {/* Label */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: '0.875rem',
            color: alpha('#fff', 0.9),
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontFamily: "'Instrument Sans', 'Cairo', sans-serif",
          }}
        >
          {/* Or...  */}
          التحدث إلى آيريس

        </Box>
      </Box>
    </Box>
  );
};