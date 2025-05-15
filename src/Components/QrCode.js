import React from 'react'
import QR from '../assets/qr.png'
import BoltLogo from '../assets/bolt.png'
const QrCode = () => {
  return (
    <div className='qr-code-main'>
        <div>
            <h2>Want to Chat ?</h2>
            <span style={{fontSize: '11px'}}>SCAN QR CODE TO CHAT NOW</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <span style={{fontSize: '11px'}}>Powered by</span>
                <img src={BoltLogo} alt="Bolt Logo" />
            </div>
        </div>
        <div>
            <img src={QR} alt="QR Code" />
        </div>
    </div>
  )
}

export default QrCode
