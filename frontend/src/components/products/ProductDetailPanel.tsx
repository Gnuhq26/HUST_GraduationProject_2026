import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';
import type { Product, ProductUnit } from '@/types';
import { productsService } from '../../services/productsService';
import { useToast } from '../ToastProvider';
import ProtectedAction from '../ProtectedAction';

interface Props {
  product: Product;
  onClose: () => void;
  onUpdated: () => void;
}

interface UnitFormData {
  unitName: string;
  exchangeValue: string;
}

const emptyForm: UnitFormData = { unitName: '', exchangeValue: '' };

export default function ProductDetailPanel({ product, onClose, onUpdated }: Props) {
  const toast = useToast();
  const [addingUnit, setAddingUnit] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState<UnitFormData>(emptyForm);
  const [editForm, setEditForm] = useState<UnitFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const units = product.units ?? [];

  const handleAddUnit = async () => {
    const ev = parseFloat(addForm.exchangeValue);
    if (!addForm.unitName.trim() || isNaN(ev) || ev <= 0) {
      toast.error('Tên đơn vị và hệ số quy đổi (> 0) là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      await productsService.addUnit(product.ProductID, {
        unitName: addForm.unitName.trim(),
        exchangeValue: ev,
      });
      toast.success('Đã thêm đơn vị quy đổi');
      setAddForm(emptyForm);
      setAddingUnit(false);
      onUpdated();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Không thể thêm đơn vị');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (unit: ProductUnit) => {
    setEditingUnitId(unit.UnitID);
    setEditForm({
      unitName: unit.UnitName,
      exchangeValue: String(unit.ExchangeValue),
    });
    setAddingUnit(false);
  };

  const handleUpdateUnit = async (unitId: number) => {
    const ev = parseFloat(editForm.exchangeValue);
    if (!editForm.unitName.trim() || isNaN(ev) || ev <= 0) {
      toast.error('Tên đơn vị và hệ số quy đổi (> 0) là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      await productsService.updateUnit(product.ProductID, unitId, {
        unitName: editForm.unitName.trim(),
        exchangeValue: ev,
      });
      toast.success('Đã cập nhật đơn vị');
      setEditingUnitId(null);
      onUpdated();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    setSaving(true);
    try {
      await productsService.deleteUnit(product.ProductID, unitId);
      toast.success('Đã xóa đơn vị');
      onUpdated();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Không thể xóa đơn vị');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-basic-white border-2 border-basic-border rounded-xl overflow-hidden shadow-sm h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-yellowfish-300 flex items-start justify-between shrink-0">
        <div className="flex-1 min-w-0 pr-2">
          <h2 className="text-base font-bold text-blacky-950 leading-snug line-clamp-2">{product.ProductName}</h2>
          {product.SKU && (
            <p className="text-xs text-blacky-400 mt-0.5 font-mono">{product.SKU}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 transition-colors shrink-0"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Basic Info */}
        <div className="space-y-3">
          <InfoRow label="Danh mục" value={product.category?.CategoryName ?? '—'} />
          <InfoRow label="Đơn vị gốc" value={product.BaseUnit} />
          <InfoRow
            label="Biên lợi nhuận"
            value={product.MarginRate != null ? (parseFloat(product.MarginRate) * 100).toFixed(0) + '%' : '—'}
          />
          <InfoRow
            label="Trạng thái"
            value={product.IsActive ? 'Hoạt động' : 'Ngưng'}
            badge={product.IsActive ? 'green' : 'gray'}
          />
          {product.Description && (
            <div>
              <span className="text-xs text-blacky-600 uppercase tracking-wide">Mô tả</span>
              <p className="text-sm text-blacky-700 mt-1">{product.Description}</p>
            </div>
          )}
        </div>

        <hr className="border-basic-border" />

        {/* Product Units */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blacky-800">Đơn vị quy đổi</h3>
            <ProtectedAction action="create" subject="Product">
              <button
                onClick={() => { setAddingUnit(true); setEditingUnitId(null); }}
                className="flex items-center gap-1 text-xs font-medium text-bluesh-800 hover:text-basic-white bg-bluesh-50 hover:bg-bluesh-800 px-2.5 py-1.5 rounded-lg transition-colors border border-bluesh-800/30"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm đơn vị
              </button>
            </ProtectedAction>
          </div>

          {units.length === 0 && !addingUnit ? (
            <p className="text-sm text-blacky-400 text-center py-6">Chưa có đơn vị quy đổi</p>
          ) : (
            <div className="border border-basic-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-bluesh-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-basic-white">Tên đơn vị</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-basic-white">Hệ số</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-basic-white w-18">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-basic-border">
                  {units.map((unit) =>
                    editingUnitId === unit.UnitID ? (
                      <tr key={unit.UnitID} className="bg-yellowfish-50">
                        <td className="px-2 py-1.5">
                          <input
                            title="Tên đơn vị"
                            className="input-field text-xs py-1 w-full"
                            value={editForm.unitName}
                            onChange={(e) => setEditForm(d => ({ ...d, unitName: e.target.value }))}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateUnit(unit.UnitID)}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            title="Hệ số quy đổi"
                            min="0.001"
                            step="any"
                            className="input-field text-xs py-1 text-right w-full"
                            value={editForm.exchangeValue}
                            onChange={(e) => setEditForm(d => ({ ...d, exchangeValue: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateUnit(unit.UnitID)}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => handleUpdateUnit(unit.UnitID)}
                              disabled={saving}
                              className="text-accent-green hover:text-green-700 disabled:opacity-50"
                              title="Lưu"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUnitId(null)}
                              className="text-blacky-400 hover:text-blacky-700"
                              title="Hủy"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={unit.UnitID} className="hover:bg-blacky-50">
                        <td className="px-3 py-2 font-medium text-blacky-800">{unit.UnitName}</td>
                        <td className="px-3 py-2 text-left text-blacky-600 tabular-nums">
                          {Number(unit.ExchangeValue).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <ProtectedAction action="update" subject="Product">
                              <button
                                onClick={() => startEdit(unit)}
                                className="text-bluesh-800 hover:text-bluesh-900"
                                title="Sửa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </ProtectedAction>
                            <ProtectedAction action="delete" subject="Product">
                              <button
                                onClick={() => handleDeleteUnit(unit.UnitID)}
                                disabled={saving}
                                className="text-accent-red hover:text-red-700 disabled:opacity-50"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </ProtectedAction>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                  {/* Add new unit inline row */}
                  {addingUnit && (
                    <tr className="bg-bluesh-50">
                      <td className="px-2 py-1.5">
                        <input
                          className="input-field text-xs py-1 w-full"
                          placeholder="Tên đơn vị"
                          value={addForm.unitName}
                          onChange={(e) => setAddForm(d => ({ ...d, unitName: e.target.value }))}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          className="input-field text-xs py-1 text-right w-full"
                          placeholder="Hệ số"
                          value={addForm.exchangeValue}
                          onChange={(e) => setAddForm(d => ({ ...d, exchangeValue: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={handleAddUnit}
                            disabled={saving}
                            className="text-accent-green hover:text-green-700 disabled:opacity-50"
                            title="Lưu"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setAddingUnit(false); setAddForm(emptyForm); }}
                            className="text-blacky-400 hover:text-blacky-700"
                            title="Hủy"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-blacky-400 mt-2">
            Hệ số = số đơn vị gốc tương đương 1 đơn vị này. VD: 1 Tấn = 1000 {product.BaseUnit}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: 'green' | 'gray';
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-blacky-600 uppercase tracking-wide shrink-0">{label}</span>
      {badge ? (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            badge === 'green' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
          }`}
        >{value}</span>
      ) : (
        <span className="text-sm font-medium text-blacky-800 text-right">{value}</span>
      )}
    </div>
  );
}
