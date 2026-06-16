import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Shield, Users, Key, UserPlus } from 'lucide-react';
import storesService from '../services/storesService';
import rolesService from '../services/rolesService';
import permissionsService from '../services/permissionsService';
import { useToast } from '../components/ToastProvider';
import ConfirmModal from '../components/ConfirmModal';
import ProtectedAction from '../components/ProtectedAction';
import { useCanPerform } from '../hooks/usePermission';
import AddMemberModal from '../components/members/AddMemberModal';
import EditMemberModal, { type Member } from '../components/members/EditMemberModal';
import CreateRoleModal from '../components/roles/CreateRoleModal';
import EditRoleModal from '../components/roles/EditRoleModal';
import type { RoleWithDetails } from '../components/roles/EditRoleModal';
import RolePermissionsModal from '../components/roles/RolePermissionsModal';
import type { Permission } from '@/types';

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function StorePermissions() {
  const toast = useToast();
  const { canPerform, loading: permissionsLoading } = useCanPerform();

  const canViewRoles = !permissionsLoading && canPerform('read', 'Role');
  const canViewMembers = !permissionsLoading && canPerform('read', 'User');

  const [roles, setRoles] = useState<RoleWithDetails[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithDetails | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<RoleWithDetails | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleWithDetails | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);

  const loadRoles = async () => {
    if (!canViewRoles && !canViewMembers) return;
    try {
      setRolesLoading(true);
      const data = await rolesService.getAll();
      setRoles(data as unknown as RoleWithDetails[]);
    } catch {
      if (canViewRoles) {
        toast.error('Không thể tải danh sách vai trò');
      }
    } finally {
      setRolesLoading(false);
    }
  };

  const loadPermissions = async () => {
    if (!canViewRoles) return;
    try {
      const [allPerms, grouped] = await Promise.all([
        permissionsService.getAll(),
        permissionsService.getGrouped(),
      ]);
      setPermissions(allPerms);
      setGroupedPermissions(grouped as unknown as Record<string, Permission[]>);
    } catch {
      // silently ignore
    }
  };

  const loadMembers = async () => {
    if (!canViewMembers && permissionsLoading) return;
    if (!canViewMembers) return;
    try {
      setMembersLoading(true);
      const data = await storesService.getMembers();
      setMembers(data as unknown as Member[]);
    } catch {
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setMembersLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadRoles(), loadMembers(), loadPermissions()]);
  };

  useEffect(() => {
    if (permissionsLoading) return;
    if (canViewRoles || canViewMembers) {
      loadRoles();
    }
    if (canViewRoles) {
      loadPermissions();
    }
    if (canViewMembers) {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewRoles, canViewMembers]);

  const handleOpenEditRole = (role: RoleWithDetails) => {
    setEditingRole(role);
    setShowEditRoleModal(true);
  };

  const handleOpenPermissions = (role: RoleWithDetails) => {
    setSelectedRoleForPermissions(role);
    setShowPermissionsModal(true);
  };

  const handleConfirmDeleteRole = async () => {
    if (!deletingRole) return;
    try {
      await rolesService.delete(deletingRole.RoleID);
      await refreshAll();
      toast.success('Đã xóa vai trò');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể xóa vai trò (có thành viên đang dùng)');
    } finally {
      setDeletingRole(null);
    }
  };

  const handleOpenEditMember = (member: Member) => {
    setEditingMember(member);
    setShowEditMemberModal(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!removingMember) return;
    try {
      await storesService.removeMember(removingMember.userId);
      await refreshAll();
      toast.success('Đã xóa thành viên khỏi cửa hàng');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Không thể xóa thành viên');
    } finally {
      setRemovingMember(null);
    }
  };

  const getActionColor = (action: string | undefined) => {
    const colors: Record<string, string> = {
      manage: 'bg-bluesh-50 text-bluesh-800',
      create: 'bg-accent-green/10 text-accent-green',
      read: 'bg-bluesh-50 text-bluesh-600',
      update: 'bg-yellowfish-50 text-yellowfish-600',
      delete: 'bg-accent-red/10 text-accent-red',
    };
    return colors[action || ''] || 'bg-blacky-100 text-blacky-600';
  };

  const getInitials = (member: Member) =>
    (member.user.FullName?.[0] ?? member.user.Email[0]).toUpperCase();

  const newMembersCount = members.filter((m) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(m.joinedAt) >= sevenDaysAgo;
  }).length;

  const getRoleMemberCount = (roleId: number) => {
    if (canViewMembers) {
      return members.filter((m) => m.role?.RoleID === roleId).length;
    }
    return roles.find((r) => r.RoleID === roleId)?._count?.storeUsers ?? 0;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blacky-950">Phân quyền</h1>
        <p className="text-blacky-600 text-sm mt-1">Quản lý vai trò, quyền hạn và thành viên cửa hàng</p>
      </div>

      {/* Combined stat cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        {canViewRoles && (
          <>
            <div className="bg-accent-green/10 rounded-xl border border-accent-green p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-green flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-basic-white" />
                </div>
                <div>
                  <p className="text-sm text-blacky-700">Tổng vai trò</p>
                  <p className="text-3xl font-bold text-accent-green">{roles.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellowfish-50 rounded-xl border border-yellowfish-400 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellowfish-400 flex items-center justify-center shrink-0">
                  <Key className="w-6 h-6 text-basic-white" />
                </div>
                <div>
                  <p className="text-sm text-blacky-700">Tổng quyền hạn</p>
                  <p className="text-3xl font-bold text-yellowfish-600">{permissions.length}</p>
                </div>
              </div>
            </div>
          </>
        )}
        {canViewMembers && (
          <>
            <div className="bg-bluesh-50 rounded-xl border border-bluesh-600 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-bluesh-800 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-basic-white" />
                </div>
                <div>
                  <p className="text-sm text-blacky-700">Tổng thành viên</p>
                  <p className="text-3xl font-bold text-bluesh-800">{members.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-bluesh-50 rounded-xl border border-bluesh-800 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-bluesh-800 flex items-center justify-center shrink-0">
                  <UserPlus className="w-6 h-6 text-basic-white" />
                </div>
                <div>
                  <p className="text-sm text-blacky-700">Thành viên mới</p>
                  <p className="text-3xl font-bold text-bluesh-800">{newMembersCount}</p>
                  <p className="text-xs text-blacky-600">Trong 7 ngày qua</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Roles section */}
      {canViewRoles && (
        <section className="mb-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-blacky-950">Quản lý vai trò</h2>
              <p className="text-blacky-700 text-sm mt-1">Tạo và quản lý vai trò trong cửa hàng</p>
            </div>
            <ProtectedAction action="create" subject="Role">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary w-fit! px-4! rounded-lg!"
              >
                <Plus className="w-4 h-4" />
                Tạo vai trò mới
              </button>
            </ProtectedAction>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolesLoading ? (
              <div className="col-span-full text-center py-12 text-blacky-400">Đang tải...</div>
            ) : roles.length === 0 ? (
              <div className="col-span-full text-center py-12 text-blacky-400">Chưa có vai trò nào</div>
            ) : (
              roles.map((role) => {
                const roleMemberCount = getRoleMemberCount(role.RoleID);
                return (
                <div
                  key={role.RoleID}
                  className="bg-basic-white rounded-xl border-2 border-basic-border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-accent-green/10 border border-accent-green rounded-lg shrink-0">
                      <Shield className="w-5 h-5 text-accent-green" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-bluesh-800">{role.RoleName}</h3>
                      <p className="text-sm text-blacky-700">{role.Description || 'Không có mô tả'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-bluesh-800">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{roleMemberCount} thành viên</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Key className="w-4 h-4" />
                      <span>{(role.rolePermissions || []).length} quyền</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-medium text-bluesh-800 uppercase tracking-wide mb-2">Quyền hạn:</p>
                    <div className="flex flex-wrap gap-1">
                      {(role.rolePermissions || []).length === 0 ? (
                        <span className="text-xs text-blacky-500">Chưa có quyền</span>
                      ) : (
                        (role.rolePermissions || []).slice(0, 3).map((rp) => (
                          <span
                            key={rp.permission?.PermissionID}
                            className={`px-2 py-0.5 text-xs rounded-full font-medium ${getActionColor(rp.permission?.Action)}`}
                          >
                            {rp.permission?.Action}:{rp.permission?.Subject}
                          </span>
                        ))
                      )}
                      {(role.rolePermissions || []).length > 3 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blacky-100 text-blacky-600">
                          +{(role.rolePermissions || []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <ProtectedAction action="update" subject="Role">
                      <button
                        onClick={() => handleOpenPermissions(role)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-bluesh-800 text-basic-white rounded-lg hover:bg-bluesh-900 transition-colors font-medium"
                      >
                        Phân quyền
                      </button>
                    </ProtectedAction>
                    <ProtectedAction action="update" subject="Role">
                      <button
                        onClick={() => handleOpenEditRole(role)}
                        title="Chỉnh sửa"
                        className="px-3 py-2 bg-blacky-50 text-bluesh-800 rounded-lg hover:bg-blacky-100 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </ProtectedAction>
                    <ProtectedAction action="delete" subject="Role">
                      <button
                        onClick={() => setDeletingRole(role)}
                        disabled={roleMemberCount > 0}
                        title={
                          roleMemberCount > 0
                            ? 'Không thể xóa vai trò đang có thành viên'
                            : 'Xóa vai trò'
                        }
                        className="px-3 py-2 bg-accent-red/10 text-accent-red rounded-lg hover:bg-accent-red/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </ProtectedAction>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* Members section */}
      {canViewMembers && (
        <section className="pt-10 border-t border-basic-border">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-blacky-950">Thành viên cửa hàng</h2>
              <p className="text-blacky-600 text-sm mt-1">Quản lý thành viên và gán vai trò</p>
            </div>
            <ProtectedAction action="create" subject="User">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary w-fit! px-4! rounded-lg!"
              >
                <Plus className="w-4 h-4" />
                Thêm thành viên
              </button>
            </ProtectedAction>
          </div>

          <div className="bg-basic-white rounded-xl border border-basic-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-bluesh-800">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-basic-white uppercase tracking-wide">
                      Thành viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-basic-white uppercase tracking-wide">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-basic-white uppercase tracking-wide">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-basic-white uppercase tracking-wide">
                      Ngày tham gia
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-basic-white uppercase tracking-wide">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-basic-border">
                  {membersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-blacky-400">
                        Đang tải...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-blacky-400">
                        Chưa có thành viên nào
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.userId} className="hover:bg-blacky-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-bluesh-800 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-sm font-semibold text-basic-white">
                                {getInitials(member)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-blacky-950">
                                {member.user.FullName || 'Chưa cập nhật'}
                              </div>
                              <div className="text-xs text-blacky-600">{member.user.Email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-blacky-700">{member.user.Phone || 'Chưa có'}</div>
                          <div className="text-xs text-blacky-600">{member.user.Address || 'Chưa có'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-bluesh-50 text-bluesh-800 border border-bluesh-600">
                            {member.role?.RoleName || 'N/A'}
                          </span>
                          {member.role?.Description && (
                            <div className="text-xs text-blacky-600 mt-1">{member.role.Description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-blacky-600">
                          {formatDate(member.joinedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <ProtectedAction action="update" subject="User">
                              <button
                                onClick={() => handleOpenEditMember(member)}
                                title="Đổi vai trò"
                                className="p-1.5 rounded-lg text-bluesh-600 hover:bg-bluesh-50 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </ProtectedAction>
                            <ProtectedAction action="delete" subject="User">
                              <button
                                onClick={() => setRemovingMember(member)}
                                title="Xóa khỏi cửa hàng"
                                className="p-1.5 rounded-lg text-accent-red hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </ProtectedAction>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {canViewRoles && (
        <>
          <CreateRoleModal
            open={showCreateModal}
            groupedPermissions={groupedPermissions}
            onClose={() => setShowCreateModal(false)}
            onSuccess={refreshAll}
          />
          <EditRoleModal
            open={showEditRoleModal}
            role={editingRole}
            onClose={() => setShowEditRoleModal(false)}
            onSuccess={refreshAll}
          />
          <RolePermissionsModal
            open={showPermissionsModal}
            role={selectedRoleForPermissions}
            groupedPermissions={groupedPermissions}
            onClose={() => setShowPermissionsModal(false)}
            onSuccess={refreshAll}
          />
          <ConfirmModal
            open={!!deletingRole}
            title="Xóa vai trò"
            message={`Bạn có chắc muốn xóa vai trò "${deletingRole?.RoleName}"? Hành động này không thể hoàn tác.`}
            confirmLabel="Xóa vai trò"
            variant="danger"
            onConfirm={handleConfirmDeleteRole}
            onCancel={() => setDeletingRole(null)}
          />
        </>
      )}

      {canViewMembers && (
        <>
          <AddMemberModal
            open={showAddModal}
            roles={roles}
            onClose={() => setShowAddModal(false)}
            onSuccess={refreshAll}
          />
          <EditMemberModal
            open={showEditMemberModal}
            member={editingMember}
            roles={roles}
            onClose={() => setShowEditMemberModal(false)}
            onSuccess={refreshAll}
          />
          <ConfirmModal
            open={!!removingMember}
            title="Xóa thành viên"
            message={`Bạn có chắc muốn xóa "${removingMember?.user.FullName}" khỏi cửa hàng? Hành động này không thể hoàn tác.`}
            confirmLabel="Xóa thành viên"
            variant="danger"
            onConfirm={handleConfirmRemoveMember}
            onCancel={() => setRemovingMember(null)}
          />
        </>
      )}
    </div>
  );
}
