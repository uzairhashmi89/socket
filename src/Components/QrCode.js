import React from 'react'
import QR from '../assets/bolt_qr.svg'
import BoltLogo from '../assets/bolt.png'
const QrCode = () => {
  return (
    <div className='qr-code-main'>
        <div style={{ width: 200, textAlign: 'center', }}>
            <h2>Want to Chat ?</h2>
            <span style={{fontSize: '11px'}}>SCAN QR CODE TO CHAT NOW</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center'}}>
                <span style={{fontSize: '11px'}}>Powered by</span>
                <img src={BoltLogo} alt="Bolt Logo" />
            </div>
        </div>
        <div>
            <img src={QR} alt="QR Code" style={{width:'75px', borderRadius: '5px'}} />
        </div>
    </div>
  )
}

export default QrCode
