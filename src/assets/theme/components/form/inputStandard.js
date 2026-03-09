/**
 * Standard Input styles - no border, orange underline
 * Used for TextField variant="standard"
 */
import colors from "assets/theme/base/colors";
import pxToRem from "assets/theme/functions/pxToRem";

const { primary } = colors;

const inputStandard = {
  styleOverrides: {
    root: {
      border: "none",
      borderRadius: 0,
      padding: `${pxToRem(8)} ${pxToRem(12)}`,
      backgroundColor: "transparent",

      "&::before": {
        borderBottom: `2px solid rgba(255, 107, 0, 0.42)`,
      },
      "&::after": {
        borderBottom: `2px solid ${primary.main}`,
      },
      "&:hover:not(.Mui-disabled):not(.Mui-error):before": {
        borderBottom: `2px solid rgba(255, 107, 0, 0.87)`,
      },
    },
  },
};

export default inputStandard;
