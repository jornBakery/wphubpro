/**
 * Admin User Manager - List, search, and edit users
 * Styled like Sites page (DataTable layout)
 */
import React, { useState, useCallback } from 'react';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Icon from '@mui/material/Icon';
import SoftButton from 'components/SoftButton';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftInput from 'components/SoftInput';
import Pagination from '@mui/material/Pagination';
import DataTableHeadCell from 'examples/Tables/DataTable/DataTableHeadCell';
import DataTableBodyCell from 'examples/Tables/DataTable/DataTableBodyCell';
import Footer from 'examples/Footer';
import { useAdminUsersList, useAdminUsersUpdate, useAdminLoginAs, type AdminUser } from '../../domains/admin/useAdminUsers';
import { useToast } from '../../contexts/ToastContext';
import { databases, DATABASE_ID, COLLECTIONS } from '../../services/appwrite';
import { Query } from 'appwrite';
import { useQuery } from '@tanstack/react-query';

function useLocalPlans() {
  return useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PLANS, [
        Query.limit(100),
      ]);
      return (res.documents ?? []) as Array<{ $id: string; label?: string; name?: string }>;
    },
  });
}

interface EditUserModalProps {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditUserModal({ user, open, onClose, onSaved }: EditUserModalProps) {
  const { toast } = useToast();
  const updateMutation = useAdminUsersUpdate();
  const { data: plans = [] } = useLocalPlans();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [localPlanId, setLocalPlanId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setStatus(user.status);
      setIsAdmin(user.isAdmin);
      setLocalPlanId('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const updates: Parameters<typeof updateMutation.mutateAsync>[0]['updates'] = {
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      status,
      isAdmin,
    };
    if (localPlanId === '__REMOVE__') {
      updates.localPlanId = null;
    } else if (localPlanId) {
      updates.localPlanId = localPlanId;
    }
    try {
      await updateMutation.mutateAsync({
        userId: user.id,
        updates,
      });
      toast({ title: 'Gebruiker bijgewerkt', variant: 'success' });
      onSaved();
      onClose();
    } catch (err) {
      toast({
        title: 'Fout',
        description: err instanceof Error ? err.message : 'Kon gebruiker niet bijwerken',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Gebruiker bewerken: {user.name}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          variant="standard"
          label="Naam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          variant="standard"
          label="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          size="small"
          type="email"
        />
        <TextField
          variant="standard"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
          select
          fullWidth
          size="small"
        >
          <MenuItem value="Active">Actief</MenuItem>
          <MenuItem value="Inactive">Inactief</MenuItem>
        </TextField>
        <TextField
          variant="standard"
          label="Plan"
          value={localPlanId}
          onChange={(e) => setLocalPlanId(e.target.value)}
          select
          fullWidth
          size="small"
          helperText="Leeg = behouden, 'Geen plan' = verwijderen"
        >
          <MenuItem value="">— Huidige plan behouden —</MenuItem>
          <MenuItem value="__REMOVE__">— Geen plan (verwijder) —</MenuItem>
          {plans.map((p) => (
            <MenuItem key={p.$id} value={p.$id}>
              {p.label ?? p.name ?? p.$id}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={<Checkbox checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />}
          label="Admin"
        />
      </DialogContent>
      <DialogActions>
        <SoftButton variant="text" color="secondary" onClick={onClose}>
          Annuleren
        </SoftButton>
        <SoftButton variant="contained" color="primary" onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

const AdminUsersPage: React.FC = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useAdminUsersList({
    limit,
    offset: page * limit,
    search,
  });

  const loginAsMutation = useAdminLoginAs();

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPage(0);
  }, [searchInput]);

  const handleEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditModalOpen(true);
  };

  const handleLoginAs = async (userId: string) => {
    try {
      const token = await loginAsMutation.mutateAsync(userId);
      if (token) {
        toast({ title: 'Login-as token gegenereerd', variant: 'success' });
        // Optionally: open in new tab with token, or copy to clipboard
        navigator.clipboard?.writeText(token);
        toast({ title: 'Token gekopieerd naar klembord', variant: 'success' });
      }
    } catch (err) {
      toast({
        title: 'Fout',
        description: err instanceof Error ? err.message : 'Kon niet inloggen als gebruiker',
        variant: 'destructive',
      });
    }
  };

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <EditUserModal
        user={editUser}
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditUser(null); }}
        onSaved={() => refetch()}
      />

      <SoftBox my={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" p={3}>
            <SoftBox lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="bold">
                Gebruikersbeheer
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Beheer gebruikers, rollen en abonnementen.
              </SoftTypography>
            </SoftBox>
          </SoftBox>

          <SoftBox display="flex" justifyContent="space-between" alignItems="center" pt={1} px={3} pb={2} flexWrap="wrap" gap={2}>
            <SoftBox display="flex" alignItems="center">
              <TextField
                variant="standard"
                select
                size="small"
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }}
                sx={{ width: 70, mr: 1 }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </TextField>
              <SoftTypography variant="caption" color="secondary">
                entries per page
              </SoftTypography>
            </SoftBox>
            <SoftBox display="flex" alignItems="center" gap={2}>
              <SoftInput
                placeholder="Search..."
                value={searchInput}
                onChange={({ currentTarget }) => setSearchInput(currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                size="small"
                sx={{ width: '12rem' }}
              />
              <SoftButton variant="contained" color="primary" size="small" onClick={handleSearch}>
                Zoeken
              </SoftButton>
            </SoftBox>
          </SoftBox>

          {isLoading && (
            <SoftBox p={6} textAlign="center">
              <SoftTypography variant="button" color="secondary">Laden...</SoftTypography>
            </SoftBox>
          )}

          {isError && (
            <SoftBox p={4}>
              <SoftTypography variant="button" color="error">
                {error?.message || 'Fout bij laden van gebruikers.'}
              </SoftTypography>
            </SoftBox>
          )}

          {!isLoading && !isError && (
            <TableContainer sx={{ boxShadow: 'none' }}>
              <Table>
                <SoftBox component="thead">
                  <TableRow>
                    <DataTableHeadCell width="18%" pl={5} color="#4F5482">Naam</DataTableHeadCell>
                    <DataTableHeadCell width="22%" pl={undefined} color="#4F5482">E-mail</DataTableHeadCell>
                    <DataTableHeadCell width="10%" pl={undefined} color="#4F5482">Rol</DataTableHeadCell>
                    <DataTableHeadCell width="12%" pl={undefined} color="#4F5482">Plan</DataTableHeadCell>
                    <DataTableHeadCell width="10%" pl={undefined} color="#4F5482">Status</DataTableHeadCell>
                    <DataTableHeadCell width="12%" pl={undefined} color="#4F5482">Lid sinds</DataTableHeadCell>
                    <DataTableHeadCell width="14%" pl={undefined} align="right" color="#4F5482">Acties</DataTableHeadCell>
                  </TableRow>
                </SoftBox>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, borderBottom: 'none' }}>
                        <Icon sx={{ fontSize: 48, color: 'grey.400', mb: 1, display: 'block', mx: 'auto' }}>people</Icon>
                        <SoftTypography color="secondary">Geen gebruikers gevonden</SoftTypography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u, rowIndex) => (
                      <TableRow key={u.id} hover>
                        <DataTableBodyCell noBorder={rowIndex === users.length - 1}>{u.name}</DataTableBodyCell>
                        <DataTableBodyCell noBorder={rowIndex === users.length - 1}>{u.email}</DataTableBodyCell>
                        <DataTableBodyCell noBorder={rowIndex === users.length - 1}>{u.role}</DataTableBodyCell>
                        <DataTableBodyCell noBorder={rowIndex === users.length - 1}>{u.planName}</DataTableBodyCell>
                        <DataTableBodyCell noBorder={rowIndex === users.length - 1}>{u.status}</DataTableBodyCell>
                        <DataTableBodyCell noBorder={rowIndex === users.length - 1}>{u.joined}</DataTableBodyCell>
                        <DataTableBodyCell align="right" noBorder={rowIndex === users.length - 1}>
                          <IconButton size="small" onClick={() => handleEdit(u)} title="Bewerken">
                            <Icon fontSize="small">edit</Icon>
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleLoginAs(u.id)}
                            title="Inloggen als"
                            disabled={loginAsMutation.isPending}
                          >
                            <Icon fontSize="small">login</Icon>
                          </IconButton>
                        </DataTableBodyCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <SoftBox
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                p={3}
              >
                <SoftBox mb={{ xs: totalPages > 1 ? 3 : 0, sm: 0 }}>
                  <SoftTypography variant="button" color="secondary" fontWeight="regular">
                    Showing {total === 0 ? 0 : page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} entries
                  </SoftTypography>
                </SoftBox>
                <SoftBox display="flex" alignItems="center" gap={2} ml="auto" mb={{ xs: 3, sm: 0 }}>
                  {totalPages > 1 && (
                    <Pagination
                      count={totalPages}
                      page={page + 1}
                      onChange={(_, p) => setPage(p - 1)}
                      color="primary"
                      size="small"
                      showFirstButton
                      showLastButton
                    />
                  )}
                </SoftBox>
              </SoftBox>
            </TableContainer>
          )}
        </Card>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default AdminUsersPage;
