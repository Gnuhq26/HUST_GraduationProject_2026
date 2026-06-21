import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import rolesService from '../../services/rolesService';
import { useToast } from '../ToastProvider';
import type { Permission } from '@/types';
import RolePermissionsPicker from './RolePermissionsPicker';

interface Props {
  open: boolean;
  groupedPermissions: Record<string, Permission[]>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRoleModal({ open, groupedPermissions, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedPermissions([]);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const role = await rolesService.create({ roleName: name, description });
      if (selectedPermissions.length > 0) {
        await rolesService.assignPermissions(role.RoleID, selectedPermissions);
      }
      handleClose();
      onSuccess();
      toast.success(
        selectedPermissions.length > 0
          ? 'Tạo vai trò và gán quyền thành công!'
          : 'Tạo vai trò thành công!',
      );
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-basic-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellowfish-400">
          <div>
            <h2 className="text-lg font-semibold text-blacky-950">Tạo vai trò mới</h2>
            <p className="text-sm text-blacky-500 mt-0.5">
              {selectedPermissions.length} quyền đã chọn
            </p>
          </div>
          <button
            onClick={handleClose}
            title="Đóng"
            className="p-1 rounded-lg text-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Ví dụ: Quản lý, Nhân viên, Kế toán..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blacky-700 mb-1.5">Mô tả</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
                  placeholder="Mô tả ngắn về vai trò"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-blacky-800 mb-3">Phân quyền (tuỳ chọn)</h3>
              <RolePermissionsPicker
                groupedPermissions={groupedPermissions}
                selectedPermissions={selectedPermissions}
                onSelectedPermissionsChange={setSelectedPermissions}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-basic-border flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="btn btn-secondary px-6! rounded-lg!">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary px-6! rounded-lg!">
              {submitting ? 'Đang tạo...' : 'Tạo vai trò'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
