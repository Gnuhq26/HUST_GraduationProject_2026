import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, Phone, MapPin, Upload, Download } from 'lucide-react';
import { customersService } from '../services/customersService';
import CustomerDetailModal from '../components/customer/CustomerDetailModal';
import CustomerFormModal from '../components/customer/CustomerFormModal';
import ImportCustomerModal from '../components/customer/ImportCustomerModal';
import ProtectedAction from '../components/ProtectedAction';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';
import type { Customer } from '@/types';
import React from 'react';

interface CustomerWithCount extends Customer {
  _count?: { orders: number };
}

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithCount | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const toast = useToast();

  // Load customers
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersService.getAll();
      setCustomers(Array.isArray(res) ? (res as CustomerWithCount[]) : ((res as { data?: CustomerWithCount[] })?.data ?? []));
    } catch (error) {
      console.error('Lỗi tải khách hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Open modal for create
  const handleCreate = () => {
    setEditingCustomer(null);
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (customer: CustomerWithCount) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  // Delete customer
  const handleDelete = (customer: CustomerWithCount) => {
    setConfirmDelete({ id: customer.CustomerID, name: customer.CustomerName });
  };

  const doDelete = async () => {
    if (confirmDelete === null) return;
    setConfirmDelete(null);
    try {
      await customersService.delete(confirmDelete.id);
      toast.success('Xóa khách hàng thành công');
      loadCustomers();
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      console.error('Lỗi xóa:', error);
      toast.error(e.response?.data?.message || 'Không thể xóa khách hàng (có thể đã có đơn hàng)');
    }
  };

  // Export Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      await customersService.exportCustomers();
    } catch (error) {
      console.error('Lỗi export:', error);
      toast.error('Không thể xuất file Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blacky-950">Khách hàng</h1>
          <p className="text-blacky-500 mt-1">Quản lý thông tin khách hàng</p>
        </div>
        <div className="flex items-center gap-3">
          <ProtectedAction action="read" subject="Customer">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn btn-secondary w-fit! px-4! rounded-lg! disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Đang xuất...' : 'Export Excel'}
            </button>
          </ProtectedAction>
          <ProtectedAction action="manage" subject="Customer">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn-secondary w-fit! px-4! rounded-lg!"
            >
              <Upload className="w-4 h-4" />
              Import Excel
            </button>
            <button
              onClick={handleCreate}
              className="btn btn-primary w-fit! px-4! rounded-lg!"
            >
              <Plus className="w-4 h-4" />
              Thêm khách hàng
            </button>
          </ProtectedAction>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-bluesh-50 rounded-xl border border-bluesh-600 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-bluesh-800 rounded-lg">
              <User className="w-6 h-6 text-basic-white" />
            </div>
            <div>
              <p className="text-sm text-blacky-700">Tổng khách hàng</p>
              <p className="text-2xl font-bold text-blacky-950">{customers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-basic-white rounded-xl border-2 border-basic-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bluesh-800 border-b border-basic-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-basic-white uppercase">STT</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-basic-white uppercase">Mã KH</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-basic-white uppercase">Tên khách hàng</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-basic-white uppercase">Số điện thoại</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-basic-white uppercase">Địa chỉ</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-basic-white uppercase">Đơn hàng</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-basic-white uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-basic-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-blacky-400 font-medium">
                    Đang tải...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-blacky-500">
                    Chưa có khách hàng nào
                  </td>
                </tr>
              ) : (
                customers.map((customer, idx) => (
                  <tr
                    key={customer.CustomerID}
                    className="hover:bg-blacky-50 cursor-pointer"
                    onClick={(e: React.MouseEvent<HTMLTableRowElement>) => {
                      // Không mở detail modal khi click vào button
                      if (!(e.target as Element).closest('button')) {
                        setSelectedCustomerId(customer.CustomerID);
                      }
                    }}
                  >
                    <td className="px-6 py-4 text-sm text-left text-blacky-700">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="text-sm font-medium text-bluesh-800 px-2 py-1 rounded">
                        {customer.CustomerCode || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-blacky-950">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-bluesh-800" />
                        {customer.CustomerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-blacky-700">
                      {customer.Phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-bluesh-800" />
                          {customer.Phone}
                        </div>
                      ) : (
                        <span className="text-blacky-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-blacky-700 max-w-xs truncate">
                      {customer.Address ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-bluesh-800 shrink-0" />
                          <span className="truncate">{customer.Address}</span>
                        </div>
                      ) : (
                        <span className="text-blacky-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                        (customer._count?.orders ?? 0) > 0
                          ? 'bg-accent-green/10 text-accent-green'
                          : 'bg-blacky-100 text-blacky-500'
                      }`}>
                        {customer._count?.orders || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <ProtectedAction action="update" subject="Customer">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(customer);
                          }}
                          className="text-bluesh-800 hover:text-bluesh-900 mr-3"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </ProtectedAction>
                      <ProtectedAction action="delete" subject="Customer">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(customer);
                          }}
                          className="text-accent-red hover:text-accent-red/80"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Customer Form Modal */}
      {showModal && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setShowModal(false)}
          onSuccess={loadCustomers}
        />
      )}

      {/* Customer Detail Modal */}
      {selectedCustomerId && (
        <CustomerDetailModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}

      {/* Import Excel Modal */}
      {showImportModal && (
        <ImportCustomerModal
          onClose={() => setShowImportModal(false)}
          onSuccess={loadCustomers}
        />
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        open={confirmDelete !== null}
        title="Xóa khách hàng"
        message={`Bạn có chắc muốn xóa khách hàng ${confirmDelete?.name || ''}? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
