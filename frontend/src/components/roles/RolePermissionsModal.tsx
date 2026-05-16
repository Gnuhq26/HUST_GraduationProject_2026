import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import rolesService from '../../services/rolesService';
import { useToast } from '../ToastProvider';
import type { Permission } from '@/types';
import type { RoleWithDetails } from './EditRoleModal';

interface Props {
  open: boolean;
  role: RoleWithDetails | null;
  groupedPermissions: Record<string, Permission[]>;
  onClose: () => void;
  onSuccess: () => void;
}

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

  const togglePermission = (permId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
    );
  };

  const toggleSubject = (subject: string) => {
    const subjectPerms = groupedPermissions[subject] || [];
    const subjectPermIds = subjectPerms.map((p) => p.PermissionID);
    const allSelected = subjectPermIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !subjectPermIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...subjectPermIds])));
    }
  };

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
          <div className="mb-4 flex gap-2.5 p-3 bg-yellowfish-50 border border-yellowfish-400 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellowfish-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellowfish-600">
              Chọn các quyền mà vai trò này sẽ được phép thực hiện. Click vào tiêu đề để chọn/bỏ
              chọn tất cả quyền trong nhóm.
            </p>
          </div>

          <div className="space-y-3">
            {Object.keys(groupedPermissions)
              .sort()
              .map((subject) => {
                const perms = groupedPermissions[subject];
                const allSelected = perms.every((p) => selectedPermissions.includes(p.PermissionID));
                const someSelected = perms.some((p) => selectedPermissions.includes(p.PermissionID));

                return (
                  <div key={subject} className="border border-basic-border rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className="w-full px-4 py-3 bg-bluesh-800 hover:bg-bluesh-900 transition-colors flex items-center justify-between"
                    >
                      <span className="font-semibold text-basic-white">{subject}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-basic-white">
                          {perms.filter((p) => selectedPermissions.includes(p.PermissionID)).length} /{' '}
                          {perms.length}
                        </span>
                        <div
                          className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                            allSelected
                              ? 'bg-basic-white border-bluesh-800 text-bluesh-800'
                              : someSelected
                                ? 'bg-bluesh-200 border-basic'
                                : 'border-basic-white'
                          }`}
                        >
                          {allSelected && (
                            <svg
                              className="w-3 h-3 text-bluesh-800"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          {someSelected && !allSelected && (
                            <div className="w-2 h-0.5 bg-bluesh-800 rounded" />
                          )}
                        </div>
                      </div>
                    </button>
                    <div className="p-4 grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <label
                          key={perm.PermissionID}
                          className="flex items-center gap-2 p-2 hover:bg-blacky-50 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.PermissionID)}
                            onChange={() => togglePermission(perm.PermissionID)}
                            className="w-4 h-4 rounded accent-bluesh-800"
                          />
                          <span
                            className={`text-sm px-2 py-0.5 rounded-full font-medium ${getActionColor(perm.Action)}`}
                          >
                            {perm.Action}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
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
