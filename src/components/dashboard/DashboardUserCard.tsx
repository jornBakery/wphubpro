/**
 * Dashboard user details card - Name, email, role, member since, avatar, buttons
 */
import React from 'react';
import Card from '@mui/material/Card';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import SoftAvatar from 'components/SoftAvatar';
import Icon from '@mui/material/Icon';
import { Link } from 'react-router-dom';
import { avatars } from '../../services/appwrite';
import { User } from '../../types';

interface DashboardUserCardProps {
  user: User | null;
}

const getAvatarUrl = (user: User | null): string | undefined => {
  if (!user?.$id) return undefined;
  try {
    const url = avatars.getInitials(
      (user.name || user.email || 'U').substring(0, 2).toUpperCase(),
      200,
      200,
    );
    return url.toString();
  } catch {
    return undefined;
  }
};

const DashboardUserCard: React.FC<DashboardUserCardProps> = ({ user }) => {
  const avatarUrl = getAvatarUrl(user);
  const rawUser = user as { $createdAt?: string } | null;
  const memberSince = rawUser?.$createdAt
    ? new Date(rawUser.$createdAt).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
    : '-';
  const role = (user as { isAdmin?: boolean })?.isAdmin ? 'Admin' : 'Member';

  return (
    <Card>
      <SoftBox p={3}>
        <SoftTypography variant="h6" fontWeight="medium" mb={2}>
          Account
        </SoftTypography>
        <SoftBox display="flex" flexDirection="column" alignItems="center" mb={2}>
          <SoftAvatar
            src={avatarUrl}
            alt={user?.name || 'avatar'}
            size="xl"
            variant="rounded"
            shadow="md"
          />
          <SoftBox mt={2} textAlign="center">
            <SoftTypography variant="h6" fontWeight="medium">
              {user?.name || user?.email || 'Gebruiker'}
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block">
              {user?.email || '-'}
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block">
              {role}
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block">
              Lid sinds {memberSince}
            </SoftTypography>
          </SoftBox>
        </SoftBox>
        <SoftBox display="flex" flexDirection="column" gap={1}>
          <SoftButton
            variant="gradient"
            color="info"
            size="small"
            component={Link}
            to="/subscription"
          >
            <Icon sx={{ mr: 0.5, fontSize: 18 }}>person</Icon>
            Profiel bekijken
          </SoftButton>
          <SoftButton
            variant="outlined"
            color="info"
            size="small"
            component={Link}
            to="/subscription"
          >
            <Icon sx={{ mr: 0.5, fontSize: 18 }}>edit</Icon>
            Account bewerken
          </SoftButton>
        </SoftBox>
      </SoftBox>
    </Card>
  );
};

export default DashboardUserCard;
