/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================
*/

import colors from "assets/theme/base/colors";
import typography from "assets/theme/base/typography";
import pxToRem from "assets/theme/functions/pxToRem";

const { white, text, primary, dark } = colors;
const { size } = typography;

export default {
  base: {
    backgroundColor: white.main,
    minHeight: pxToRem(40),
    color: text.main,
    padding: `${pxToRem(10)} ${pxToRem(24)}`,

    "&:hover": {
      backgroundColor: white.main,
    },

    "& .material-icons, .material-icons-round": {
      fontSize: `${pxToRem(16)} !important`,
    },
  },

  primary: {
    backgroundColor: primary.main, // Oranje uit colors.js
    color: white.main, // Witte tekst

    "&:hover": {
      backgroundColor: primary.focus,
    },

    "&:focus:not(:hover)": {
      backgroundColor: primary.focus,
    },
    
    "& .MuiIcon-root, & .material-icons, & .material-icons-round": {
      color: `${white.main} !important`, // Icons altijd wit
    },
  },

  dark: {
    backgroundColor: dark.main, // Donkergrijs uit colors.js
    color: white.main,

    "&:hover": {
      backgroundColor: dark.main,
    },

    "&:focus:not(:hover)": {
      backgroundColor: dark.main,
    },
    
    "& .MuiIcon-root, & .material-icons, & .material-icons-round": {
      color: `${white.main} !important`, // Icons altijd wit
    },
  },
};