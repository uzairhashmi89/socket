import React from "react";
import { Gif } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Box, Skeleton } from "@mui/material";

const gf = new GiphyFetch("AIXHdn1pkImFhwXod1c5kQvfGNviJ1NT");

export const FeedGiphyContent = ({
  data: giphyData,
  width = 400,
  height,
  ...rest
}) => {
  const boxRef = React.useRef();
  const [data, setData] = React.useState();
  React.useEffect(() => {
    if (giphyData?.id) {
      (async () => {
        const { data } = await gf.gif(giphyData.id);
        setData(data);
      })();
    }
    return () => {
      setData(undefined);
    };
  }, [giphyData?.id]);

  if (!data) {
    return <Skeleton width="100%" height={300} sx={{ transform: "none" }} />;
  }

  return (
    <Box
      {...rest}
      sx={{
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "black",
        ...rest?.sx,
      }}
      ref={boxRef}
    >
      <Gif
        gif={data}
        width={width}
        height={height}
        backgroundColor="transparent"
        className="giphy-content"
        noLink
        hideAttribution
      />
    </Box>
  );
};
