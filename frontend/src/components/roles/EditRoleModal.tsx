import { useState, useEffect, type FormEvent } from 'react';
import { X } from 'lucide-react';
import rolesService from '../../services/rolesService';
import { useToast } from '../ToastProvider';

export interface RolePermissionEntry {
  permission?: {
    PermissionID: number;
    Action: string;
    Subject: string;
  };
}

export interface RoleWithDetails {
  RoleID: number;
  RoleName: string;
  Description: string | null;
  rolePermissions?: RolePermissionEntry[];
  _count: { storeUsers: number };
}

interface Props {
  open: boolean;
  role: RoleWithDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRoleModal({ open, role, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role) {
      setName(role.RoleName);
      setDescription(role.Description || '');
    }
  }, [role]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!role) return;
    try {
      setSubmitting(true);
      await rolesService.update(role.RoleID, { roleName: name, description });
      onClose();
      onSuccess();
      toast.success('Cập nhật vai trò thành công!');
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
      <div className="bg-basic-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellowfish-400">
          <h2 className="text-lg font-semibold text-blacky-950">Chỉnh sửa vai trò</h2>
          <button
            onClick={onClose}
            title="Đóng"
            className="p-1 rounded-lg text-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1.5">
              Tên vai trò <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
              placeholder="Kế toán kho"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1.5">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors resize-none"
              placeholder="Quản lý kho hàng và báo cáo tài chính"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 w-fit! px-4! rounded-lg!">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1 w-fit! px-6! rounded-lg!">
              {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
