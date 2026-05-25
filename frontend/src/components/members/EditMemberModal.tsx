import { useState, useEffect, type FormEvent } from 'react';
import { X } from 'lucide-react';
import storesService from '../../services/storesService';
import { useToast } from '../ToastProvider';
import CustomSelect from '../CustomSelect';
import type { Role } from '@/types';

export interface MemberUser {
  FullName: string | null;
  Email: string;
  Phone?: string | null;
  Address?: string | null;
}

export interface MemberRole {
  RoleID: number;
  RoleName: string;
  Description?: string | null;
}

export interface Member {
  userId: number;
  joinedAt: string;
  user: MemberUser;
  role: MemberRole;
}

interface EditMemberModalProps {
  open: boolean;
  member: Member | null;
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditMemberModal({
  open,
  member,
  roles,
  onClose,
  onSuccess,
}: EditMemberModalProps) {
  const toast = useToast();
  const [editRoleId, setEditRoleId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setEditRoleId(String(member.role?.RoleID));
    }
  }, [member]);

  if (!open || !member) return null;

  const getInitials = () => (member.user.FullName?.[0] ?? member.user.Email[0]).toUpperCase();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await storesService.updateMemberRole(member.userId, parseInt(editRoleId));
      onClose();
      toast.success('Cập nhật vai trò thành công!');
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Có lỗi xảy ra khi cập nhật vai trò');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-basic-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellowfish-400">
          <h2 className="text-lg font-semibold text-blacky-950">Đổi vai trò thành viên</h2>
          <button
            onClick={onClose}
            title="Đóng"
            className="p-1 rounded-lg text-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-bluesh-50 border border-bluesh-600 rounded-lg">
            <div className="w-10 h-10 bg-bluesh-800 rounded-full flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-basic-white">{getInitials()}</span>
            </div>
            <div>
              <div className="text-sm font-medium text-blacky-950">
                {member.user.FullName || 'Chưa cập nhật'}
              </div>
              <div className="text-xs text-blacky-500">{member.user.Email}</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-bluesh-900 mb-1.5">
              Vai trò hiện tại
            </label>
            <div className="px-3 py-2.5 bg-blacky-50 border border-blacky-200 rounded-lg text-blacky-700">
              {member.role.RoleName}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-bluesh-900 mb-1.5">
              Vai trò mới <span className="text-accent-red">*</span>
            </label>
            <CustomSelect
              value={editRoleId}
              onChange={setEditRoleId}
              compact
              options={roles.map((role) => ({
                value: String(role.RoleID),
                label: role.Description ? `${role.RoleName} - ${role.Description}` : role.RoleName,
              }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 w-fit! px-4! rounded-lg!">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1 w-fit! px-4! rounded-lg!">
              {submitting ? 'Đang cập nhật...' : 'Cập nhật vai trò'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
