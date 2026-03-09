/**
 * TabNavList - Reusable horizontal tab navigation with site-detail styling
 * Same layout and styling as the tab nav on the site details page.
 */
import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SoftBox from 'components/SoftBox';
import Icon from '@mui/material/Icon';

const blueGradient = 'linear-gradient(310deg, #4F5482, #7a8ef0)';
const orangeGradient = 'linear-gradient(310deg, #ea580c, #fb923c)';

export interface TabNavItem {
  value: number;
  label: string;
  icon?: string;
}

export interface TabNavListProps {
  items: TabNavItem[];
  value: number;
  onChange: (event: React.SyntheticEvent, value: number) => void;
  /** Optional wrapper sx. Default: px: 3, pt: 0, py: 1, backgroundColor: 'background.default' */
  sx?: object;
}

const tabStyles = {
  minHeight: 52,
  '& .MuiTabs-indicator': { display: 'none' },
  '& .MuiTabs-flexContainer': { overflow: 'visible' },
  '& .MuiTab-root': {
    minHeight: 52,
    minWidth: 90,
    padding: '6px 12px 6px 12px',
    marginRight: 8,
    justifyContent: 'flex-start',
    textAlign: 'left',
    fontSize: '0.875rem',
    fontWeight: 500,
    textTransform: 'none',
    color: '#292F4D !important',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&.Mui-selected': {
      color: '#ffffff !important',
      fontWeight: 600,
      background: blueGradient,
      boxShadow: '0 20px 27px 0 rgba(0,0,0,0.05)',
    },
    '& > *:not(.MuiTab-iconWrapper)': {
      color: 'inherit',
      opacity: 1,
      visibility: 'visible',
      whiteSpace: 'nowrap',
      overflow: 'visible',
    },
  },
  '& .MuiTab-iconWrapper': {
    marginRight: 1,
    '& .material-icons-round, & .material-icons, & .MuiIcon-root': {
      fontSize: '24px !important',
      color: '#ffffff !important',
    },
    '& > *': {
      minWidth: 38,
      minHeight: 38,
      borderRadius: '8px',
      display: 'grid',
      placeItems: 'center',
      background: orangeGradient,
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.12)',
      transition: 'background 0.2s ease-in-out',
      color: '#ffffff',
      fontSize: '24px !important',
    },
  },
  '& .Mui-selected .MuiTab-iconWrapper > *': {
    background: orangeGradient,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.12)',
    color: '#ffffff',
  },
};

const TabNavList: React.FC<TabNavListProps> = ({ items, value, onChange, sx = {} }) => {
  return (
    <SoftBox
      sx={{
        flexShrink: 0,
        mb: 2,
        px: 3,
        pt: 0,
        color: '#292F4D',
        backgroundColor: 'background.default',
        py: 1,
        ...sx,
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={tabStyles}
      >
        {items.map((item) => (
          <Tab
            key={item.value}
            label={item.label}
            icon={
              item.icon ? (
                <SoftBox component="span" sx={{ display: 'inherit' }}>
                  <Icon sx={{ fontSize: '24px !important', color: '#ffffff !important' }}>{item.icon}</Icon>
                </SoftBox>
              ) : undefined
            }
            iconPosition={item.icon ? 'start' : undefined}
            value={item.value}
          />
        ))}
      </Tabs>
    </SoftBox>
  );
};

/** Simple tab panel - renders children only when value matches index */
export interface TabNavPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const TabNavPanel: React.FC<TabNavPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <SoftBox py={3}>{children}</SoftBox>}
  </div>
);

export default TabNavList;
