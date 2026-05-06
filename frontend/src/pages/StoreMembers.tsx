import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users, Shield, UserPlus } from 'lucide-react';
import storesService from '../services/storesService';
import rolesService from '../services/rolesService';
import { useToast } from '../components/ToastProvider';
import ConfirmModal from '../components/ConfirmModal';
import AddMemberModal from '../components/members/AddMemberModal';
import EditMemberModal, { type Member } from '../components/members/EditMemberModal';
import type { Role } from '@/types';

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function StoreMembers() {
  const toast = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await storesService.getMembers();
      setMembers(data as unknown as Member[]);
    } catch {
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await rolesService.getAll();
      setRoles(data);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    loadMembers();
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!removingMember) return;
    try {
      await storesService.removeMember(removingMember.userId);
      toast.success('Đã xóa thành viên khỏi cửa hàng');
      loadMembers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Không thể xóa thành viên');
    } finally {
      setRemovingMember(null);
    }
  };

  const getInitials = (member: Member) =>
    (member.user.FullName?.[0] ?? member.user.Email[0]).toUpperCase();

  const newMembersCount = members.filter((m) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(m.joinedAt) >= sevenDaysAgo;
  }).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blacky-950">Thành viên cửa hàng</h1>
          <p className="text-blacky-600 text-sm mt-1">Quản lý thành viên và phân quyền vai trò</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary w-fit! px-4! rounded-lg!">
          <Plus className="w-4 h-4" />
          Thêm thành viên
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-basic-white rounded-xl border border-bluesh-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blacky-900 font-medium">Tổng thành viên</p>
              <p className="text-3xl font-bold text-bluesh-900">{members.length}</p>
            </div>
            <div className="p-3 bg-bluesh-800 rounded-lg">
              <Users className="w-6 h-6 text-basic-white" />
            </div>
          </div>
        </div>

        <div className="bg-basic-white rounded-xl border border-accent-green p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blacky-900 font-medium">Số vai trò</p>
              <p className="text-3xl font-bold text-accent-green">{roles.length}</p>
            </div>
            <div className="p-3 bg-accent-green/20 border border-accent-green rounded-lg">
              <Shield className="w-6 h-6 text-accent-green" />
            </div>
          </div>
        </div>

        <div className="bg-basic-white rounded-xl border border-bluesh-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blacky-900 font-medium">Thành viên mới</p>
              <p className="text-3xl font-bold text-bluesh-800">{newMembersCount}</p>
              <p className="text-xs text-blacky-600">Trong 7 ngày qua</p>
            </div>
            <div className="p-3 bg-bluesh-50 border border-bluesh-800 rounded-lg">
              <UserPlus className="w-6 h-6 text-bluesh-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Members table */}
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
              {loading ? (
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
                        <button
                          onClick={() => handleOpenEdit(member)}
                          title="Đổi vai trò"
                          className="p-1.5 rounded-lg text-bluesh-600 hover:bg-bluesh-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRemovingMember(member)}
                          title="Xóa khỏi cửa hàng"
                          className="p-1.5 rounded-lg text-accent-red hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMemberModal
        open={showAddModal}
        roles={roles}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadMembers}
      />

      <EditMemberModal
        open={showEditModal}
        member={editingMember}
        roles={roles}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadMembers}
      />

      {/* Confirm remove */}
      <ConfirmModal
        open={!!removingMember}
        title="Xóa thành viên"
        message={`Bạn có chắc muốn xóa "${removingMember?.user.FullName}" khỏi cửa hàng? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa thành viên"
        variant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemovingMember(null)}
      />
    </div>
  );
}
