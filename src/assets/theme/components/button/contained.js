/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// Soft UI Dashboard PRO React Base Styles
import colors from "assets/theme/base/colors";
import typography from "assets/theme/base/typography";
import boxShadows from "assets/theme/base/boxShadows";

// Soft UI Dashboard PRO React Helper Functions
import pxToRem from "assets/theme/functions/pxToRem";
import linearGradient from "assets/theme/functions/linearGradient";

const { white, text, info, secondary, gradients } = colors;
const { size } = typography;
const { buttonBoxShadow } = boxShadows;

const contained = {
  base: {
    backgroundColor: white.main,
    minHeight: pxToRem(40),
    color: text.main,
    boxShadow: buttonBoxShadow.main,
    padding: `${pxToRem(12)} ${pxToRem(24)}`,

    "&:hover": {
      backgroundColor: white.main,
      boxShadow: buttonBoxShadow.stateOf,
    },

    "&:focus": {
      boxShadow: buttonBoxShadow.stateOf,
    },

    "&:active, &:active:focus, &:active:hover": {
      opacity: 0.85,
      boxShadow: buttonBoxShadow.stateOf,
    },

    "&:disabled": {
      boxShadow: buttonBoxShadow.main,
    },

    "& .material-icon, .material-icons-round, svg": {
      fontSize: `${pxToRem(16)} !important`,
    },
  },

  small: {
    minHeight: pxToRem(32),
    padding: `${pxToRem(8)} ${pxToRem(32)}`,
    fontSize: size.xs,

    "& .material-icon, .material-icons-round, svg": {
      fontSize: `${pxToRem(12)} !important`,
    },
  },

  large: {
    minHeight: pxToRem(47),
    padding: `${pxToRem(14)} ${pxToRem(64)}`,
    fontSize: size.sm,

    "& .material-icon, .material-icons-round, svg": {
      fontSize: `${pxToRem(22)} !important`,
    },
  },

  primary: {
    background: linearGradient(gradients.info.main, gradients.info.state),
    color: white.main,

    "&:hover": {
      background: linearGradient(gradients.info.main, gradients.info.state),
      opacity: 0.9,
    },

    "&:focus:not(:hover)": {
      background: linearGradient(gradients.info.main, gradients.info.state),
      boxShadow: buttonBoxShadow.stateOfNotHover,
    },
  },

  secondary: {
    background: linearGradient(gradients.secondary.main, gradients.secondary.state),
    color: white.main,

    "&:hover": {
      background: linearGradient(gradients.secondary.main, gradients.secondary.state),
      opacity: 0.9,
    },

    "&:focus:not(:hover)": {
      background: linearGradient(gradients.secondary.main, gradients.secondary.state),
      boxShadow: buttonBoxShadow.stateOfNotHover,
    },
  },
};

export default contained;
