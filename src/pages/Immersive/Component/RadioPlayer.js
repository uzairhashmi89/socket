import React from 'react';
import ReactPlayer from 'react-player';


const RadioPlayer = ({ url }) => {
  return (
    <div  style={{
        // width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        width: '100%'
      }}
      className='video-player'
      >
      <ReactPlayer
        width="100%"
        height="100%"
        url={url}
        playing
        autoPlay={true}
        muted={true}
        controls={false}
        config={{
            file: {
              forceHLS: true,
            },
          }}
        />
    </div>
  );
};

export default RadioPlayer;
