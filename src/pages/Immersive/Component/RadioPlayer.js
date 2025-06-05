import React from 'react';
import ReactPlayer from 'react-player';


const RadioPlayer = ({ url, width }) => {
  return (
    <div style={{
      width: width,
      height: '100vh',
      backgroundColor: '#000',
      overflow: 'hidden',
      margin: 0,
      padding: 0,
    }}
      className='video-player'
    >
      <ReactPlayer
        width="100%"
        height="100%"
        style={{ objectFit: 'contain' }}
        url={url}
        playing
        autoPlay={true}
        muted={true}
        controls={false}
        config={{
          file: {
            forceHLS: true,
            attributes: {
              style: {
                width: '100%',
                height: '100%',
                aspectRatio: "16/9", // or "auto" if ReactPlayer handles it well
                objectFit: "cover", // optional: to stretch and remove black bars
              },
            },

          },
        }}
      />
    </div>
  );
};

export default RadioPlayer;
