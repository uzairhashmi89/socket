import React from "react";
import { Box, Paper, useMediaQuery, useTheme } from "@mui/material";
import { Grid, SearchBar, SearchContext } from "@giphy/react-components";

export const GiphyComponent = ({ onSelectItem = () => {} }) => {
  const { fetchGifs, searchKey } = React.useContext(SearchContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.between("xs", "sm"));

  return (
    <Box
      component={Paper}
      elevation={0}
      sx={{
        p: 2,
        px: { xs: 0, sm: 2 },
        pb: 0.5,
        borderRadius: 4,
        position: "relative",
        flexDirection: "column",
        maxWidth: { xs: 390, sm: 500 },
      }}
    >
      <SearchBar className="giphy" />
      <Box sx={{ height: 10 }} />
      <Box sx={{ overflowY: "auto", height: 600 }}>
        <Grid
          key={searchKey}
          onGifClick={(data, e) => {
            e.preventDefault();
            onSelectItem({
              id: `${data.id}`,
              embed_url: data.embed_url,
              title: data.title,
              url: data.url,
              type: data.type,
            });
          }}
          fetchGifs={fetchGifs}
          width={isMobile ? 390 : 500 - 32}
          className="giphy-grid"
          hideAttribution
          columns={3}
          gutter={6}
        />
      </Box>
    </Box>
  );
};
