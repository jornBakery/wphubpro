/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================
*/

import colors from "assets/theme/base/colors";
import borders from "assets/theme/base/borders";
import pxToRem from "assets/theme/functions/pxToRem";

const { white, primary, dark } = colors;
const { borderRadius } = borders;

export default {
  styleOverrides: {
    root: {
      width: pxToRem(250),
      whiteSpace: "nowrap",
      border: "none",
    },

    paper: {
      width: pxToRem(250),
      backgroundColor: white.main,
      height: "100vh",
      margin: 0,
      borderRadius: 0,
      border: "none",
    },

    paperAnchorLeft: {
      borderRight: "none",
    },
  },
};