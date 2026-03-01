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

const { info, dark } = colors;

/* Sidenav scrollbar: low opacity orange, triangles at top/bottom, more visible on hover */
const upTriangleLow = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z' fill='%23ea580c' fill-opacity='0.25'/%3E%3C/svg%3E";
const downTriangleLow = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 14l5-5 5 5z' fill='%23ea580c' fill-opacity='0.25'/%3E%3C/svg%3E";
const upTriangleFull = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z' fill='%23ea580c'/%3E%3C/svg%3E";
const downTriangleFull = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 14l5-5 5 5z' fill='%23ea580c'/%3E%3C/svg%3E";

const globals = {
  html: {
    scrollBehavior: "smooth",
  },
  "*, *::before, *::after": {
    margin: 0,
    padding: 0,
  },
  "a, a:link, a:visited": {
    textDecoration: "none !important",
  },
  "a.link, .link, a.link:link, .link:link, a.link:visited, .link:visited": {
    color: `${dark.main} !important`,
    transition: "color 150ms ease-in !important",
  },
  "a.link:hover, .link:hover, a.link:focus, .link:focus": {
    color: `${info.main} !important`,
  },
  ".sidenav-scroll::-webkit-scrollbar": {
    width: "8px",
  },
  ".sidenav-scroll::-webkit-scrollbar-track": {
    background: "transparent",
  },
  ".sidenav-scroll::-webkit-scrollbar-thumb": {
    background: "rgba(234, 88, 12, 0.12)",
    borderRadius: "4px",
    transition: "background 0.2s ease",
  },
  ".sidenav-scroll:hover::-webkit-scrollbar-thumb": {
    background: "rgba(234, 88, 12, 0.5)",
  },
  ".sidenav-scroll::-webkit-scrollbar-button:vertical:decrement": {
    height: "14px",
    background: `url("${upTriangleLow}") center/10px no-repeat`,
  },
  ".sidenav-scroll::-webkit-scrollbar-button:vertical:increment": {
    height: "14px",
    background: `url("${downTriangleLow}") center/10px no-repeat`,
  },
  ".sidenav-scroll:hover::-webkit-scrollbar-button:vertical:decrement": {
    background: `url("${upTriangleFull}") center/10px no-repeat`,
  },
  ".sidenav-scroll:hover::-webkit-scrollbar-button:vertical:increment": {
    background: `url("${downTriangleFull}") center/10px no-repeat`,
  },
  /* Icons on colored backgrounds (buttons, gradient boxes) should always be white */
  ".MuiButton-contained .material-icons-round, .MuiButton-contained .material-icons, .MuiButton-contained .MuiIcon-root, .MuiButton-contained .MuiSvgIcon-root, .MuiButton-contained svg": {
    color: "white !important",
  },
};

export default globals;
