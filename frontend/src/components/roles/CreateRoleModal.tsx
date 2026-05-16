import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import rolesService from '../../services/rolesService';
import { useToast } from '../ToastProvider';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRoleModal({ open, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await rolesService.create({ roleName: name, description });
      handleClose();
      onSuccess();
      toast.success('Tạo vai trò thành công!');
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
      <div className="bg-basic-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellowfish-400">
          <h2 className="text-lg font-semibold text-blacky-950">Tạo vai trò mới</h2>
          <button
            onClick={handleClose}
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
              placeholder="Ví dụ: Quản lý, Nhân viên, Kế toán..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1.5">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors resize-none"
              placeholder="Mô tả về vai trò trên"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn btn-secondary flex-1 w-fit! px-4! rounded-lg!">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1 w-fit! px-6! rounded-lg!">
              {submitting ? 'Đang tạo...' : 'Tạo vai trò'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
