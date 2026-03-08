import type { BoxProps } from '@mui/material/Box';
import type { TypographyProps } from '@mui/material/Typography';
import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';

declare module 'components/SoftBox' {
  export interface SoftBoxProps extends BoxProps {
    variant?: 'contained' | 'gradient';
    bgColor?: string;
    color?: string;
    opacity?: number;
    borderRadius?: string;
    shadow?: string;
    // Allow polymorphic component props (e.g. component="button", component="img")
    [key: string]: unknown;
  }
  const SoftBox: ForwardRefExoticComponent<SoftBoxProps & RefAttributes<HTMLDivElement>>;
  export default SoftBox;
}

declare module 'components/SoftTypography' {
  export interface SoftTypographyProps extends TypographyProps {
    color?: 'inherit' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'light' | 'dark' | 'text' | 'white';
    fontWeight?: false | 'light' | 'regular' | 'medium' | 'bold';
    textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
    verticalAlign?: 'unset' | 'baseline' | 'sub' | 'super' | 'text-top' | 'text-bottom' | 'middle' | 'top' | 'bottom';
    textGradient?: boolean;
    opacity?: number;
    children?: ReactNode;
  }
  const SoftTypography: ForwardRefExoticComponent<SoftTypographyProps & RefAttributes<HTMLSpanElement>>;
  export default SoftTypography;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}
