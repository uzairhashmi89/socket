import React from "react";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import clsx from "clsx";
import { useContext, useState } from "react";
import { QRCode } from "react-qrcode-logo";

export default function FocusableConnectMobileButtonImmersive() {
  const [showQR, setShowQR] = useState(false);

  const handleClick = () => {
    setShowQR(!showQR);
    setTimeout(() => {
      setShowQR(false);
    }, 30000);
  };

  const { ref, focused } = useFocusable({
    onEnterPress: handleClick,
    onArrowPress: (direction) => {
      return !(direction === "left" || direction === "right");
    },
  });

  return (
    <div className="self-center">
      {showQR && (
        <div className="mt-[18px] mb-[34px] flex flex-col items-center space-y-[33px]">
          <p className="font-medium text-2xl leading-[30px] text-white-85 text-center">
            Scan the QR code with Bolt+ app
            <br /> to connect your mobile
          </p>
          <div className="rounded-[25px] overflow-hidden">
            <QRCode
              removeQrCodeBehindLogo
              size={250}
              quietZone={25}
              eyeRadius={15}
              logoPadding={10}
              fgColor="#4449e3"
            />
          </div>
          <button
            ref={ref}
            onClick={handleClick}
            className={clsx(
              "bg-white-12 py-[10px] pl-7 pr-5 rounded-lg flex items-center hover:bg-white-base/30",
              focused && "bg-white-85",
              focused && "text-primary-gray",
              !focused && "text-white-base"
            )}
          >
            Cancel
          </button>
        </div>
      )}
      {!showQR && (
        <button
          ref={ref}
          onClick={handleClick}
          className={clsx(
            "bg-white-12 py-[10px] pl-7 pr-5 rounded-lg flex items-center space-x-[18px] hover:bg-white-base/30",
            focused && "bg-white-base/30"
          )}
        >
          <p className="font-medium text-base leading-[28px] text-white-85">
            Scan Qr to start chatting
          </p>
        </button>
      )}
    </div>
  );
}
