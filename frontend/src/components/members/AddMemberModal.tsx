import { useState, type FormEvent } from 'react';
import { X, AlertCircle, Copy, Check } from 'lucide-react';
import storesService from '../../services/storesService';
import { useToast } from '../ToastProvider';
import CustomSelect from '../CustomSelect';
import type { Role } from '@/types';

interface AddMemberModalProps {
  open: boolean;
  roles: Pick<Role, 'RoleID' | 'RoleName' | 'Description'>[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemberModal({ open, roles, onClose, onSuccess }: AddMemberModalProps) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setEmail('');
    setRoleId('');
    setError('');
    setTempPassword(null);
    setCopied(false);
    onClose();
  };

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
      const result = await storesService.addMember({ email, roleId: parseInt(roleId) });
      setEmail('');
      setRoleId('');
      if (result.temporaryPassword) {
        setTempPassword(result.temporaryPassword);
      } else {
        onClose();
        toast.success('Thêm thành viên thành công!');
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Có lỗi xảy ra khi thêm thành viên');
    } finally {
      setSubmitting(false);
    }
  };

  // Show temp password screen after new user was created
  if (tempPassword) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-basic-white rounded-2xl max-w-md w-full shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-yellowfish-400">
            <h2 className="text-lg font-semibold text-blacky-950">Tài khoản mới đã được tạo</h2>
            <button onClick={handleClose} title="Đóng" className="p-1 rounded-lg text-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-2.5 p-3 bg-yellowfish-50 border border-yellowfish-400/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellowfish-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blacky-800">
                Email này chưa có tài khoản. Một tài khoản mới vừa được tạo với mật khẩu tạm thời bên dưới. Hãy sao chép và gửi cho thành viên ngay.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-bluesh-900 mb-1.5">Mật khẩu tạm thời</label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 border border-blacky-200 rounded-lg bg-blacky-50 font-mono text-blacky-950 select-all">
                  {tempPassword}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Sao chép mật khẩu"
                  className="px-3 py-2.5 border border-blacky-200 rounded-lg hover:bg-bluesh-50 hover:border-bluesh-800 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-bluesh-800" />}
                </button>
              </div>
            </div>
            <button type="button" onClick={handleClose} className="btn btn-primary w-fit! px-4! rounded-lg!">
              Đã lưu mật khẩu, đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              Nếu email chưa tồn tại, một tài khoản mới sẽ được tạo với mật khẩu ngẫu nhiên để bạn chia sẻ cho thành viên.
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
            <CustomSelect
              value={roleId}
              onChange={setRoleId}
              compact
              placeholder="Chọn vai trò"
              options={[
                ...roles.map((role) => ({
                  value: String(role.RoleID),
                  label: role.Description ? `${role.RoleName} - ${role.Description}` : role.RoleName,
                })),
              ]}
            />
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

