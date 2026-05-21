import { useState, useEffect, useCallback } from 'react';
import { Truck, Phone, MapPin, Search, Package, Upload, Download, Plus, Edit2, Trash2 } from 'lucide-react';
import suppliersService from '../services/suppliersService';
import ImportSupplierModal from '../components/supplier/ImportSupplierModal';
import SupplierFormModal from '../components/supplier/SupplierFormModal';
import ConfirmModal from '../components/ConfirmModal';
import ProtectedAction from '../components/ProtectedAction';
import { useToast } from '../components/ToastProvider';
import type { Supplier } from '@/types';
import React from 'react';
interface SupplierWithCount extends Supplier {
  _count?: { receipts: number };
}

function Suppliers() {
  const [suppliers, setSuppliers] = useState<SupplierWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithCount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SupplierWithCount | null>(null);
  const toast = useToast();

  // Stats
  const stats = {
    total: suppliers.length,
    withReceipts: suppliers.filter((s) => (s._count?.receipts ?? 0) > 0).length,
    withPhone: suppliers.filter((s) => s.Phone).length,
  };

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await suppliersService.getAll(searchQuery);
      setSuppliers(res as SupplierWithCount[]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Không thể tải danh sách nhà cung cấp');
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loadSuppliers();
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (supplier: SupplierWithCount) => {
    setSelectedSupplier(supplier);
    setIsFormModalOpen(true);
  };

  const handleDelete = (supplier: SupplierWithCount) => {
    setConfirmDelete(supplier);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await suppliersService.delete(confirmDelete.SupplierID);
      toast.success(`Đã xóa nhà cung cấp "${confirmDelete.SupplierName}"`);
      setConfirmDelete(null);
      loadSuppliers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Không thể xóa nhà cung cấp');
      setConfirmDelete(null);
      console.error('Error deleting supplier:', err);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await suppliersService.exportSuppliers();
    } catch (err: unknown) {
      console.error('Lỗi export:', err);
      alert('Không thể xuất file Excel');
    } finally {
      setExporting(false);
    }
  };

  if (loading && suppliers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blacky-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blacky-950">Quản lý Nhà cung cấp</h1>
          <p className="text-blacky-500 text-sm mt-1">Quản lý thông tin nhà cung cấp hàng hóa</p>
        </div>
        <div className="flex items-center gap-3">
          <ProtectedAction action="read" subject="Supplier">
            <button onClick={handleExport} disabled={exporting} className="btn btn-secondary w-fit! px-4! rounded-lg!">
              <Download className="w-4 h-4" />{exporting ? 'Đang xuất...' : 'Export Excel'}
            </button>
          </ProtectedAction>
          <ProtectedAction action="create" subject="Supplier">
            <button onClick={() => setShowImportModal(true)} className="btn btn-secondary w-fit! px-4! rounded-lg!">
              <Upload className="w-4 h-4" />Import Excel
            </button>
            <button onClick={handleCreate} className="btn btn-primary w-fit! px-4! rounded-lg!">
              <Plus className="w-4 h-4" />Thêm nhà cung cấp
            </button>
          </ProtectedAction>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-bluesh-50 rounded-xl border border-bluesh-600 p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-bluesh-800 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-basic-white" />
            </div>
            <div>
              <p className="text-sm text-blacky-700">Tổng số nhà cung cấp</p>
              <p className="text-3xl font-bold text-bluesh-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellowfish-50 rounded-xl border border-yellowfish-400 p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellowfish-400 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-basic-white" />
            </div>
            <div>
              <p className="text-sm text-blacky-700">Có phiếu nhập</p>
              <p className="text-3xl font-bold text-yellowfish-600">{stats.withReceipts}</p>
            </div>
          </div>
        </div>

        <div className="bg-accent-green/10 rounded-xl border border-accent-green p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-green flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6 text-basic-white" />
            </div>
            <div>
              <p className="text-sm text-blacky-700">Có số điện thoại</p>
              <p className="text-3xl font-bold text-accent-green">{stats.withPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-basic-white rounded-xl border border-basic-border p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blacky-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 text-accent-red px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-basic-white rounded-xl border-2 border-basic-border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-bluesh-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">STT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">
                Tên nhà cung cấp
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase tracking-wider">
                Số điện thoại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-basic-white uppercase tracking-wider">
                Địa chỉ
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-basic-white uppercase tracking-wider">
                Số phiếu nhập
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-basic-white uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-basic-border">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-blacky-500">
                  Không có nhà cung cấp nào
                </td>
              </tr>
            ) : (
              suppliers.map((supplier, idx) => (
                <tr key={supplier.SupplierID} className="hover:bg-blacky-50 transition-colors">
                  <td className="px-6 py-4 text-left text-blacky-700">{idx + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-bluesh-800">{supplier.SupplierName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center gap-2 text-blacky-700 justify-center">
                      <Phone className="w-4 h-4 text-bluesh-800" />
                      {supplier.Phone || <span className="text-blacky-400 italic">Chưa có</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 text-blacky-700">
                      <MapPin className="w-4 h-4 text-bluesh-800 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">
                        {supplier.Address || <span className="text-blacky-700 italic">Chưa có</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <Package className="w-4 h-4 text-yellowfish-400" />
                      <span className="text-blacky-700">{supplier._count?.receipts || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <ProtectedAction action="update" subject="Supplier">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="text-bluesh-800 hover:text-bluesh-600 mr-4 inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Sửa
                      </button>
                    </ProtectedAction>
                    <ProtectedAction action="delete" subject="Supplier">
                      <button
                        onClick={() => handleDelete(supplier)}
                        className="text-accent-red hover:opacity-70 inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </ProtectedAction>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Supplier Form Modal */}
      {isFormModalOpen && (
        <SupplierFormModal
          supplier={selectedSupplier}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={loadSuppliers}
        />
      )}

      {/* Import Excel Modal */}
      {showImportModal && (
        <ImportSupplierModal
          onClose={() => setShowImportModal(false)}
          onSuccess={loadSuppliers}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!confirmDelete}
        variant="danger"
        title="Xóa nhà cung cấp"
        message={`Bạn có chắc muốn xóa "${confirmDelete?.SupplierName}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

export default Suppliers;
