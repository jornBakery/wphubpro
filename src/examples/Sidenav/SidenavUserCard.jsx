/**
 * User details card for Sidenav - blue gradient, avatar, name, email, role, action buttons
 */
import { Link, useNavigate } from "react-router-dom";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftAvatar from "components/SoftAvatar";
import Icon from "@mui/material/Icon";
import { useSoftUIController } from "context";
import { useAuth } from "contexts/AuthContext";
import { avatars } from "services/appwrite";
import colors from "assets/theme/base/colors";

const infoGradient = "linear-gradient(310deg, #4F5482, #7a8ef0)";
const orangeMain = colors.gradients.success.main;

function getAvatarUrl(user) {
  if (!user?.$id) return undefined;
  try {
    const name = (user.name || user.email || "U").substring(0, 2).toUpperCase();
    return avatars.getInitials(name, 80, 80).toString();
  } catch {
    return undefined;
  }
}

function ActionButton({ icon, title, to, onClick }) {
  const btn = (
    <SoftBox
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        p: 0.5,
        borderRadius: "50%",
        background: "white",
        color: `${orangeMain} !important`,
        cursor: "pointer",
        "&:hover": { opacity: 0.9 },
      }}
      title={title}
    >
      <Icon sx={{ fontSize: 12 }}>{icon}</Icon>
    </SoftBox>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: "none" }}>
        {btn}
      </Link>
    );
  }
  return (
    <SoftBox component="button" onClick={onClick} sx={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}>
      {btn}
    </SoftBox>
  );
}

function SidenavUserCard() {
  const [controller] = useSoftUIController();
  const { miniSidenav } = controller;
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <SoftBox pt={2} px={2} pb={2}>
        <SoftBox
          component={Link}
          to="/login"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 1.5,
            px: 2,
            background: infoGradient,
            borderRadius: 2,
            color: "white !important",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Inloggen
        </SoftBox>
      </SoftBox>
    );
  }

  const avatarUrl = getAvatarUrl(user);

  return (
    <SoftBox pt={2} my={1} mx={2} mr={4} sx={{ flexShrink: 0 }}>
      <SoftBox
        sx={{
          background: infoGradient,
          borderRadius: 2,
          p: 2,
          pr: 3,
          color: "white",
        }}
      >
        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <SoftTypography
            variant="caption"
            sx={{
              display: "inline-block",
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: orangeMain,
              color: "white !important",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {isAdmin ? "Admin" : "Platform Member"}
          </SoftTypography>
          <SoftBox display="flex" gap={0.5}>
            <ActionButton icon="person" title="View profile" to="/subscription" />
            <ActionButton icon="settings" title="Settings" to={isAdmin ? "/admin/settings" : "/subscription"} />
            <ActionButton icon="logout" title="Logout" onClick={handleLogout} />
          </SoftBox>
        </SoftBox>
        <SoftBox display="flex" flexDirection={miniSidenav ? "column" : "row"} alignItems="center" gap={1.5}>
          <SoftAvatar
            src={avatarUrl}
            alt={user.name || user.email}
            size="sm"
            sx={{
              width: miniSidenav ? 40 : 48,
              height: miniSidenav ? 40 : 48,
              flexShrink: 0,
              bgcolor: "rgba(255,255,255,0.3)",
            }}
          />
          {!miniSidenav && (
            <SoftBox flex={1} minWidth={0}>
              <SoftTypography variant="button" fontWeight="bold" color="white" noWrap>
                {user.name || "Gebruiker"}
              </SoftTypography>
              <SoftTypography
                variant="caption"
                color="white"
                sx={{ opacity: 0.9, fontSize: 10 }}
                display="block"
              >
                {user.email || ""}
              </SoftTypography>
            </SoftBox>
          )}
        </SoftBox>
      </SoftBox>
    </SoftBox>
  );
}

export default SidenavUserCard;
