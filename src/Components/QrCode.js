import React from 'react'
import QR from '../assets/qr-image.png'
import BoltLogo from '../assets/bolt.png'
const QrCode = () => {
  return (
    <div className='qr-code-main'>
        <div style={{ width: 200, textAlign: 'center', }}>
            <h2>هل تريد الدردشة؟</h2>
            <span style={{fontSize: '11px'}}>امسح رمز الاستجابة السريعة للدردشة الآن</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center'}}>
                <span style={{fontSize: '11px'}}>مدعوم من</span>
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
