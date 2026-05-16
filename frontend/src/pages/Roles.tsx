import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Shield, Users, Key } from 'lucide-react';
import rolesService from '../services/rolesService';
import permissionsService from '../services/permissionsService';
import { useToast } from '../components/ToastProvider';
import ConfirmModal from '../components/ConfirmModal';
import type { Permission } from '@/types';
import CreateRoleModal from '../components/roles/CreateRoleModal';
import EditRoleModal from '../components/roles/EditRoleModal';
import type { RoleWithDetails } from '../components/roles/EditRoleModal';
import RolePermissionsModal from '../components/roles/RolePermissionsModal';

export default function Roles() {
  const toast = useToast();
  const [roles, setRoles] = useState<RoleWithDetails[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithDetails | null>(null);

  // Permissions modal
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<RoleWithDetails | null>(null);

  // Delete confirm
  const [deletingRole, setDeletingRole] = useState<RoleWithDetails | null>(null);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesService.getAll();
      setRoles(data as unknown as RoleWithDetails[]);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const [allPerms, grouped] = await Promise.all([
        permissionsService.getAll(),
        permissionsService.getGrouped(),
      ]);
      setPermissions(allPerms);
      setGroupedPermissions(grouped as unknown as Record<string, Permission[]>);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const handleOpenEdit = (role: RoleWithDetails) => {
    setEditingRole(role);
    setShowEditModal(true);
  };

  const handleOpenPermissions = (role: RoleWithDetails) => {
    setSelectedRoleForPermissions(role);
    setShowPermissionsModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRole) return;
    try {
      await rolesService.delete(deletingRole.RoleID);
      loadRoles();
      toast.success('Đã xóa vai trò');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể xóa vai trò (có thành viên đang dùng)');
    } finally {
      setDeletingRole(null);
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blacky-950">Quản lý vai trò</h1>
          <p className="text-blacky-700 text-sm mt-1">Tạo và quản lý vai trò trong cửa hàng</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary w-fit! px-4! rounded-lg!">
          <Plus className="w-4 h-4" />
          Tạo vai trò mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-basic-white rounded-xl border-2 border-basic-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blacky-700">Tổng vai trò</p>
              <p className="text-2xl font-bold text-accent-green">{roles.length}</p>
            </div>
            <div className="p-3 rounded-lg">
              <Shield className="w-8 h-8 text-accent-green" />
            </div>
          </div>
        </div>

        <div className="bg-basic-white rounded-xl border-2 border-basic-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blacky-700">Tổng quyền hạn</p>
              <p className="text-2xl font-bold text-yellowfish-400">{permissions.length}</p>
            </div>
            <div className="p-3 rounded-lg">
              <Key className="w-8 h-8 text-yellowfish-400" />
            </div>
          </div>
        </div>

        <div className="bg-basic-white rounded-xl border-2 border-basic-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blacky-700">Thành viên có vai trò</p>
              <p className="text-2xl font-bold text-bluesh-800">{roles.reduce((sum, role) => sum + (role._count?.storeUsers ?? 0), 0)}</p>
            </div>
            <div className="p-3 rounded-lg">
              <Users className="w-8 h-8 text-bluesh-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-blacky-400">Đang tải...</div>
        ) : roles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-blacky-400">Chưa có vai trò nào</div>
        ) : (
          roles.map((role) => (
            <div key={role.RoleID} className="bg-basic-white rounded-xl border-2 border-basic-border p-6 hover:shadow-md transition-shadow">
              {/* Role Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-accent-green/10 border border-accent-green rounded-lg shrink-0">
                  <Shield className="w-5 h-5 text-accent-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-bluesh-800">{role.RoleName}</h3>
                  <p className="text-sm text-blacky-700">{role.Description || 'Không có mô tả'}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm text-bluesh-800">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{role._count?.storeUsers ?? 0} thành viên</span>
                </div>
                <div className="flex items-center gap-1">
                  <Key className="w-4 h-4" />
                  <span>{(role.rolePermissions || []).length} quyền</span>
                </div>
              </div>

              {/* Permissions Preview */}
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

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenPermissions(role)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-bluesh-800 text-basic-white rounded-lg hover:bg-bluesh-900 transition-colors font-medium"
                >
                  Phân quyền
                </button>
                <button
                  onClick={() => handleOpenEdit(role)}
                  title="Chỉnh sửa"
                  className="px-3 py-2 bg-blacky-50 text-bluesh-800 rounded-lg hover:bg-blacky-100 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingRole(role)}
                  disabled={role._count.storeUsers > 0}
                  title={
                    role._count.storeUsers > 0
                      ? 'Không thể xóa vai trò đang có thành viên'
                      : 'Xóa vai trò'
                  }
                  className="px-3 py-2 bg-accent-red/10 text-accent-red rounded-lg hover:bg-accent-red/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateRoleModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadRoles}
      />

      <EditRoleModal
        open={showEditModal}
        role={editingRole}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadRoles}
      />

      <RolePermissionsModal
        open={showPermissionsModal}
        role={selectedRoleForPermissions}
        groupedPermissions={groupedPermissions}
        onClose={() => setShowPermissionsModal(false)}
        onSuccess={loadRoles}
      />

      <ConfirmModal
        open={!!deletingRole}
        title="Xóa vai trò"
        message={`Bạn có chắc muốn xóa vai trò "${deletingRole?.RoleName}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa vai trò"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingRole(null)}
      />
    </div>
  );
}
