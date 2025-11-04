import { useCallback, useEffect, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import {
  Box,
  IconButton,
  Typography,
  alpha,
  Fade,
  CircularProgress,
  Tooltip,
  keyframes,
} from '@mui/material';
import {
  Mic,
  MicOff,
  CallEnd,
} from '@mui/icons-material';


// Keyframes for animations
const voiceWave = keyframes`
  0%, 100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
`;

const glow = keyframes`
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(101, 53, 233, 0.7);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(101, 53, 233, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(101, 53, 233, 0);
  }
`;

const AI_API_URL = "https://api.staging-new.boltplus.tv/ai";

export const ElevenLabsConversation = ({
  agentId,
  onClose,
  embedded = false,
}) => {

  const [state, setState] = useState({
    isInitializing: false,
    error: null,
    volume: 1,
    isMuted: false,
    url: "https://live-hls-web-aja-fa.getaj.net/AJA/master.m3u8",
  });

    const [isMuted, setIsMuted] = useState(false);
    const conversation = useConversation({
    micMuted: isMuted,
    onConnect: () => {
        console.log('Connected to ElevenLabs');
        setState(prev => ({ 
        ...prev, 
        isInitializing: false,
        isMuted: conversation.micMuted || false // Sync initial mute state
        }));
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      onClose?.();
    },
    onMessage: (message) => {
      console.log('Voice conversation message:', message);
    },
    onError: (error) => {
      console.error('ElevenLabs Error:', error);
      const errorMessage = typeof error === 'string'
        ? error
        : (error)?.message || 'An unexpected error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isInitializing: false
      }));
    },
  });

  const startConversation = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isInitializing: true, error: null }));
      
      console.log('Initializing agent configuration...');

      let systemPrompt  = "";
      let firstMessage  = "";

      try {
        const initResponse = await fetch(`${AI_API_URL}/init_agent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hls_url: state.url }),
        });
        
        if (!initResponse.ok) {
            throw new Error(`Agent initialization failed: ${initResponse.status}`);
        }
        
        const data = await initResponse.json();

        agentId = data.agentId;
        systemPrompt = data.systemPrompt;
        firstMessage = data.firstMessage;

        agentId      = data.agentId;
        systemPrompt = data.systemPrompt;
        firstMessage = data.firstMessage;
        console.log('Agent initialized successfully:', { agentId, systemPrompt, firstMessage });
        
        } catch (error) {
        console.error('Failed to initialize agent:', error);
        throw new Error('Failed to initialize IRIS. Please try again.');
        }

      console.log('Starting conversation without specific agent (using default)...');
      
      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      
      console.log('Starting ElevenLabs session with default agent...');
      await conversation.startSession({
        agentId,
        overrides: {
          agent: {
            prompt:       { prompt: systemPrompt },
            firstMessage
          },
        },
      });
      console.log('Session started successfully');
      
    } catch (error) {
      console.error('Failed to start conversation - Full error:', error);
      
      let errorMessage = 'Failed to start voice conversation.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else {
          errorMessage = `Failed to start voice conversation: ${error.message}`;
        }
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isInitializing: false,
      }));
    }
  },  [conversation, state.url]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    onClose?.();
  }, [conversation, onClose]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    console.log(`Microphone ${!isMuted ? 'muted' : 'unmuted'}`);
  };

  useEffect(() => {
    startConversation();
    
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, []);

  // For embedded mode (non-dialog)
  if (embedded) {
    return (
      <Fade in>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 400,
            position: 'relative',
          }}
        >
          {state.isInitializing ? (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress
                size={80}
                thickness={2}
                sx={{
                  color: '#6535E9',
                  mb: 3,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: alpha('#fff', 0.7),
                  fontSize: '0.875rem',
                  fontFamily: "'Instrument Sans', 'Cairo', sans-serif",
                }}
              >
                إعداد آيريس لمحادثتك...
              </Typography>
            </Box>
          ) : state.error ? (
            <Box sx={{ textAlign: 'center', maxWidth: 300 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: alpha('#ef4444', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                  mx: 'auto',
                }}
              >
                <MicOff sx={{ color: '#ef4444', fontSize: 36 }} />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  mb: 3,
                }}
              >
                {state.error}
              </Typography>
              <IconButton
                onClick={startConversation}
                sx={{
                  color: '#6535E9',
                  border: '2px solid',
                  borderColor: alpha('#6535E9', 0.3),
                  '&:hover': {
                    borderColor: '#6535E9',
                    bgcolor: alpha('#6535E9', 0.1),
                  },
                }}
              >
                <Mic />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              {/* Voice visualization sphere */}
              <Box
                sx={{
                  position: 'relative',
                  width: 200,
                  height: 200,
                  mx: 'auto',
                  mb: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Outer glow */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: -20,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(101, 53, 233, 0.2) 0%, transparent 60%)',
                    animation: `${glow} 2s ease-in-out infinite`,
                  }}
                />
                
                {/* Main sphere */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6535E9 0%, #4E33E9 100%)',
                    boxShadow: '0 20px 60px rgba(101, 53, 233, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: conversation.status === 'connected' ? `${pulse} 2s infinite` : 'none',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                      transform: 'rotate(45deg)',
                      animation: conversation.isSpeaking ? 'shine 1.5s ease-in-out infinite' : 'none',
                      '@keyframes shine': {
                        '0%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' },
                        '100%': { transform: 'translateX(100%) translateY(100%) rotate(45deg)' },
                      }
                    }
                  }}
                >
                  {/* Voice wave bars */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: 60 }}>
                    {[...Array(5)].map((_, i) => (
                        <Box
                        key={i}
                        sx={{
                            width: 4,
                            height: '100%',
                            bgcolor: 'rgba(255,255,255,0.8)',
                            borderRadius: 2,
                            animation: conversation.isSpeaking  // Changed from conversation.status === 'connected'
                            ? `${voiceWave} ${0.5 + i * 0.1}s ease-in-out infinite`
                            : 'none',
                            animationDelay: `${i * 0.1}s`,
                            transform: conversation.isSpeaking ? 'scaleY(1)' : 'scaleY(0.3)', // Add default scale when not speaking
                            transition: 'transform 0.3s ease', // Smooth transition
                        }}
                        />
                    ))}
                    </Box>
                </Box>
              </Box>

              <Typography
                variant="h6"
                sx={{
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  mb: 1,
                  fontFamily: "'Instrument Sans', 'Cairo', sans-serif",
                }}
              >
                {conversation.status === 'connected'
                  ? conversation.isSpeaking
                    ? 'آيريس تتحدث...'
                    : 'استمع...'
                  : 'جاري الاتصال...'}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: alpha('#fff', 0.6),
                  fontSize: '0.875rem',
                  mb: 4,
                  fontFamily: "'Instrument Sans', 'Cairo', sans-serif",
                }}
              >
                {conversation.status === 'connected'
                  ? 'تحدث بشكل طبيعي'
                  : 'إعداد الاتصال الصوتي'}
              </Typography>

              {/* Control buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Tooltip title={state.isMuted ? 'Unmute' : 'Mute'}>
                <IconButton
                onClick={toggleMute}
                size="large"
                sx={{
                    position: 'relative',
                    bgcolor: isMuted ? alpha('#ef4444', 0.1) : alpha('#fff', 0.05),
                    color: isMuted ? '#ef4444' : '#fff',
                    border: '2px solid',
                    borderColor: isMuted ? alpha('#ef4444', 0.3) : alpha('#fff', 0.1),
                    transition: 'all 0.2s ease',
                    '&::after': {
                    content: '""',
                    display: isMuted ? 'block' : 'none',
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    },
                    '&:hover': {
                    bgcolor: isMuted ? alpha('#ef4444', 0.2) : alpha('#fff', 0.1),
                    borderColor: isMuted ? '#ef4444' : alpha('#fff', 0.3),
                    transform: 'scale(1.05)',
                    },
                    '&:disabled': { opacity: 0.5 },
                }}
                >
                {isMuted ? <MicOff /> : <Mic />}
                </IconButton>
                </Tooltip>

                <Tooltip title="End voice chat">
                  <IconButton
                    onClick={stopConversation}
                    size="large"
                    sx={{
                      bgcolor: alpha('#ef4444', 0.1),
                      color: '#ef4444',
                      border: '2px solid',
                      borderColor: alpha('#ef4444', 0.3),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha('#ef4444', 0.2),
                        borderColor: '#ef4444',
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <CallEnd />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        </Box>
      </Fade>
    );
  }

  // Original dialog mode code here (if needed for backwards compatibility)
  return null;
};