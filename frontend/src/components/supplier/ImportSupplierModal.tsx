import { useState, useRef } from 'react';
import { FiX, FiDownload, FiUpload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import suppliersService from '../../services/suppliersService';
import type { ImportPreviewRow, ImportPreviewResponse, ImportCommitResponse } from '@/types';

type Step = 'template' | 'preview' | 'result';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

type PreviewData = ImportPreviewResponse & { rows: ImportPreviewRow[] };

const STEPS: Step[] = ['template', 'preview', 'result'];

export default function ImportSupplierModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('template');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResponse | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      await suppliersService.downloadTemplate();
    } catch (err) {
      setError('Không thể tải file mẫu');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.match(/\.(xlsx|xls)$/i)) {
      setError('Chỉ chấp nhận file Excel (.xlsx, .xls)');
      return;
    }
    setFile(selected);
    setError('');
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await suppliersService.previewImport(file);
      const rows: ImportPreviewRow[] = [
        ...(data.validRows || []).map((r) => ({ ...r, errors: [] as string[] })),
        ...(data.invalidRows || []).map((r) => ({ ...r, errors: r.errors || [] })),
      ].sort((a, b) => a.rowNumber - b.rowNumber);
      setPreviewData({ ...data, rows });
      setStep('preview');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Lỗi phân tích file');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const result = await suppliersService.commitImport(file);
      setCommitResult(result);
      setStep('result');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Lỗi import nhà cung cấp');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    onSuccess?.();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setCommitResult(null);
    setError('');
    setStep('template');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import nhà cung cấp từ Excel</h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'template' && 'Bước 1: Tải template và chuẩn bị file'}
              {step === 'preview' && 'Bước 2: Xem trước và xác nhận'}
              {step === 'result' && 'Bước 3: Kết quả import'}
            </p>
          </div>
          <button onClick={onClose} title="Đóng" className="text-gray-400 hover:text-gray-600">
            <FiX size={24} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  STEPS.indexOf(step) >= i
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${STEPS.indexOf(step) >= i ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {['Tải template', 'Xem trước', 'Kết quả'][i]}
                </span>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-300 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <FiAlertCircle className="shrink-0" />
              {error}
            </div>
          )}

          {step === 'template' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">1. Tải file mẫu</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Tải file Excel mẫu, điền thông tin nhà cung cấp theo đúng cấu trúc, sau đó upload lại.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FiDownload />
                  Tải template Excel
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">2. Upload file đã điền</h3>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    title="Chọn file Excel"
                    onChange={handleFileSelect}
                    className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
                {file && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <FiCheckCircle />
                    Đã chọn: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{previewData.totalRows}</p>
                  <p className="text-xs text-blue-600">Tổng dòng</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{previewData.validCount}</p>
                  <p className="text-xs text-green-600">Hợp lệ</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{previewData.invalidCount}</p>
                  <p className="text-xs text-red-600">Lỗi</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Dòng</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tên NCC</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SĐT</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Địa chỉ</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Hành động</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.rows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.errors?.length > 0 ? 'bg-red-50' : 'bg-green-50'}
                        >
                          <td className="px-3 py-2 text-gray-500">{row.rowNumber}</td>
                          <td className="px-3 py-2 font-medium">{row.supplierName}</td>
                          <td className="px-3 py-2">{row.phone || '—'}</td>
                          <td className="px-3 py-2">{row.address || '—'}</td>
                          <td className="px-3 py-2 text-center">
                            {row.errors?.length === 0 && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                row.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {row.action === 'UPDATE' ? 'Cập nhật' : 'Tạo mới'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {row.errors?.length > 0 ? (
                              <span className="text-xs text-red-600" title={row.errors.join('; ')}>
                                <FiAlertCircle className="inline mr-1" />
                                {row.errors.length} lỗi
                              </span>
                            ) : (
                              <span className="text-xs text-green-600">
                                <FiCheckCircle className="inline mr-1" />
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {previewData.validCount === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  Không có dòng nào hợp lệ để import. Vui lòng sửa file và thử lại.
                </div>
              )}
            </div>
          )}

          {step === 'result' && commitResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6">
                <FiCheckCircle className="text-green-500 mb-3" size={48} />
                <h3 className="text-lg font-semibold text-gray-900">Import thành công!</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{commitResult.created}</p>
                  <p className="text-xs text-green-600">Tạo mới</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{commitResult.updated}</p>
                  <p className="text-xs text-blue-600">Cập nhật</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{commitResult.skipped}</p>
                  <p className="text-xs text-red-600">Bỏ qua (lỗi)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between shrink-0">
          {step === 'template' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handlePreview}
                disabled={!file || loading}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FiUpload />
                    Xem trước
                  </>
                )}
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Chọn file khác
              </button>
              <button
                onClick={handleCommit}
                disabled={loading || previewData?.validCount === 0}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang import...
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    Xác nhận import ({previewData?.validCount} dòng)
                  </>
                )}
              </button>
            </>
          )}

          {step === 'result' && (
            <div className="w-full flex justify-end">
              <button
                onClick={handleDone}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Hoàn tất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
