/**
 * Wraps a table in a scrollable container with scrollbar hidden and up/down scroll icons.
 */
import React, { useRef } from 'react';
import TableContainer from '@mui/material/TableContainer';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';

const SCROLL_STEP = 80;

interface ScrollableTableWrapperProps {
  children: React.ReactNode;
  maxHeight?: string;
  sx?: object;
}

const ScrollableTableWrapper: React.FC<ScrollableTableWrapperProps> = ({
  children,
  maxHeight = '55vh',
  sx = {},
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Box sx={{ display: 'flex', alignItems: 'stretch', marginBottom: 3, ...sx }}>
      <TableContainer
        ref={scrollRef}
        sx={{
          flex: 1,
          maxHeight,
          overflow: 'auto',
          boxShadow: 'none',
          marginLeft: 2,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          '& table': { borderLeft: 'none', borderRight: 'none' },
          '& thead th:first-of-type': { borderLeft: 'none' },
          '& thead th:last-of-type': { borderRight: 'none' },
          '& tbody td:first-of-type': { borderLeft: 'none' },
          '& tbody td:last-of-type': { borderRight: 'none' },
        }}
      >
        {children}
      </TableContainer>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 0.5,
          py: 1,
          backgroundColor: 'background.paper',
        }}
      >
        <IconButton
          size="small"
          onClick={() => scrollRef.current?.scrollBy({ top: -SCROLL_STEP, behavior: 'smooth' })}
          sx={{ color: 'success.main' }}
          aria-label="Scroll up"
        >
          <Icon fontSize="small">keyboard_arrow_up</Icon>
        </IconButton>
        <IconButton
          size="small"
          onClick={() => scrollRef.current?.scrollBy({ top: SCROLL_STEP, behavior: 'smooth' })}
          sx={{ color: 'success.main' }}
          aria-label="Scroll down"
        >
          <Icon fontSize="small">keyboard_arrow_down</Icon>
        </IconButton>
      </Box>
    </Box>
  );
};

export default ScrollableTableWrapper;
