import { useState, type FormEvent } from 'react';
import { X, AlertCircle } from 'lucide-react';
import storesService from '../../services/storesService';
import { useToast } from '../ToastProvider';
import type { Role } from '@/types';

interface AddMemberModalProps {
  open: boolean;
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemberModal({ open, roles, onClose, onSuccess }: AddMemberModalProps) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setEmail('');
    setRoleId('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!roleId) {
      setError('Vui lòng chọn vai trò');
      return;
    }
    try {
      setSubmitting(true);
      await storesService.addMember({ email, roleId: parseInt(roleId) });
      setEmail('');
      setRoleId('');
      onClose();
      toast.success('Thêm thành viên thành công!');
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Có lỗi xảy ra khi thêm thành viên');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-basic-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellowfish-400">
          <h2 className="text-lg font-semibold text-blacky-950">Thêm thành viên mới</h2>
          <button
            onClick={handleClose}
            title="Đóng"
            className="p-1 rounded-lg text-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex gap-2.5 p-3 bg-bluesh-50 border border-bluesh-600/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-bluesh-800 shrink-0 mt-0.5" />
            <p className="text-sm text-bluesh-800">
              Nếu email chưa tồn tại, một tài khoản mới sẽ được tạo với mật khẩu mặc định:{' '}
              <strong>123456</strong>
            </p>
          </div>
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-accent-red/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-accent-red shrink-0 mt-0.5" />
              <p className="text-sm text-accent-red">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-bluesh-900 mb-1.5">
              Email <span className="text-accent-red">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
              placeholder="member@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bluesh-900 mb-1.5">
              Vai trò <span className="text-accent-red">*</span>
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
              title="Vai trò"
              className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors bg-basic-white"
            >
              <option value="">Chọn vai trò</option>
              {roles.map((role) => (
                <option key={role.RoleID} value={role.RoleID}>
                  {role.RoleName}
                  {role.Description ? ` - ${role.Description}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn btn-secondary flex-1 w-fit! px-4! rounded-lg!">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1 w-fit! px-4! rounded-lg!">
              {submitting ? 'Đang thêm...' : 'Thêm thành viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
