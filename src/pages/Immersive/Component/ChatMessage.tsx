import React from "react";
import { useEffect, useState } from "react";

export default function ChatMessage({ chat }) {
  const storedFontSize = localStorage?.getItem("chatFontSize");

  const [fontSize, setFontSize] = useState(() => {
    return storedFontSize ? parseInt(storedFontSize, 10) : 12;
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Set timeout
      setFontSize(storedFontSize ? parseInt(storedFontSize, 10) : 12); // Set the state
    }, 1000); // 2-second delay

    return () => clearTimeout(timeoutId); // Clear timeout if component unmounts or dependency changes
  }, [storedFontSize]);

  const stringToColor = (string: string) => {
    if (!string) return null;
    let hash = 0;
    /* eslint-disable no-bitwise */
    for (let i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
  };

  return (
    <div className="px-[18px] py-[9px] flex items-start space-x-[10px] rounded-[5px] hover:bg-white-12">
      <div className="bg-white-base/5 rounded-full h-[28px] w-[28px] flex justify-center items-center overflow-hidden min-w-[28px]">
        {chat.sender?.photoUrl ? (
          <img
            src={chat.sender?.photoUrl}
            alt={chat.sender?.fullName}
            height={28}
            width={28}
            className="self-start rounded-full object-cover h-[28px] w-[28px]"
          />
        ) : (
          <div
            className="h-[28px] w-[28px] rounded-full text-center pt-[2px]"
            style={{
              backgroundColor: stringToColor(chat.sender?.lastName)!,
            }}
          >
            {chat.sender?.firstName
              ?.charAt(0)
              .concat(
                chat.sender?.lastName ? chat.sender?.lastName?.charAt(0) : ""
              )}
          </div>
        )}
      </div>
      <div style={{ fontSize: fontSize }}>{chat.message}</div>
    </div>
  );
}
