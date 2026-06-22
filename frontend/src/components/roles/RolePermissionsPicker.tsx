import { AlertCircle } from 'lucide-react';
import type { Permission } from '@/types';

export const getActionColor = (action: string | undefined) => {
  const colors: Record<string, string> = {
    manage: 'bg-bluesh-50 text-bluesh-800',
    create: 'bg-accent-green/10 text-accent-green',
    read: 'bg-bluesh-50 text-bluesh-600',
    update: 'bg-yellowfish-50 text-yellowfish-600',
    delete: 'bg-accent-red/10 text-accent-red',
  };
  return colors[action || ''] || 'bg-blacky-100 text-blacky-600';
};

export const getActionLabel = (action: string | undefined) => {
  const labels: Record<string, string> = {
    create: 'Thêm',
    read: 'Đọc',
    update: 'Sửa',
    delete: 'Xóa',
    manage: 'Quản lý',
  };
  return labels[action || ''] || action || '';
};

interface RolePermissionsPickerProps {
  groupedPermissions: Record<string, Permission[]>;
  selectedPermissions: number[];
  onSelectedPermissionsChange: (ids: number[]) => void;
  showHint?: boolean;
}

export default function RolePermissionsPicker({
  groupedPermissions,
  selectedPermissions,
  onSelectedPermissionsChange,
  showHint = true,
}: RolePermissionsPickerProps) {
  const togglePermission = (permId: number) => {
    onSelectedPermissionsChange(
      selectedPermissions.includes(permId)
        ? selectedPermissions.filter((id) => id !== permId)
        : [...selectedPermissions, permId],
    );
  };

  const toggleSubject = (subject: string) => {
    const subjectPerms = groupedPermissions[subject] || [];
    const subjectPermIds = subjectPerms.map((p) => p.PermissionID);
    const allSelected = subjectPermIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      onSelectedPermissionsChange(selectedPermissions.filter((id) => !subjectPermIds.includes(id)));
    } else {
      onSelectedPermissionsChange(Array.from(new Set([...selectedPermissions, ...subjectPermIds])));
    }
  };

  return (
    <div>
      {showHint && (
        <div className="mb-4 flex gap-2.5 p-3 bg-yellowfish-50 border border-yellowfish-400 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellowfish-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellowfish-600">
            Chọn các quyền mà vai trò này sẽ được phép thực hiện. Click vào tiêu đề để chọn/bỏ chọn
            tất cả quyền trong nhóm.
          </p>
        </div>
      )}

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
                        {getActionLabel(perm.Action)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
