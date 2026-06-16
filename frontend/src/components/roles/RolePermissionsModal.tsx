import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import rolesService from '../../services/rolesService';
import { useToast } from '../ToastProvider';
import type { Permission } from '@/types';
import type { RoleWithDetails } from './EditRoleModal';
import RolePermissionsPicker from './RolePermissionsPicker';

interface Props {
  open: boolean;
  role: RoleWithDetails | null;
  groupedPermissions: Record<string, Permission[]>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RolePermissionsModal({ open, role, groupedPermissions, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role) {
      const currentPermIds = (role.rolePermissions || [])
        .map((rp) => rp.permission?.PermissionID)
        .filter((id): id is number => id !== undefined);
      setSelectedPermissions(currentPermIds);
    }
  }, [role]);

  const handleSave = async () => {
    if (!role) return;
    try {
      setSubmitting(true);
      await rolesService.assignPermissions(role.RoleID, selectedPermissions);
      onClose();
      onSuccess();
      toast.success('Cập nhật quyền thành công!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !role) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-basic-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellowfish-400">
          <div>
            <h2 className="text-lg font-semibold text-blacky-950">Phân quyền cho vai trò</h2>
            <p className="text-sm text-blacky-500 mt-0.5">
              {role.RoleName} — {selectedPermissions.length} quyền đã chọn
            </p>
          </div>
          <button
            onClick={onClose}
            title="Đóng"
            className="p-1 rounded-lg text-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <RolePermissionsPicker
            groupedPermissions={groupedPermissions}
            selectedPermissions={selectedPermissions}
            onSelectedPermissionsChange={setSelectedPermissions}
          />
        </div>

        <div className="px-6 py-4 border-t border-basic-border flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-secondary px-6! rounded-lg!">
            Hủy
          </button>
          <button type="button" onClick={handleSave} disabled={submitting} className="btn btn-primary px-6! rounded-lg!">
            {submitting ? 'Đang lưu...' : 'Lưu quyền hạn'}
          </button>
        </div>
      </div>
    </div>
  );
}
