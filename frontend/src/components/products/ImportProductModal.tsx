import { useState, useRef } from 'react';
import { X, Download, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { productsService } from '../../services/productsService';
import type { ImportPreviewRow, ImportPreviewResponse, ImportCommitResponse } from '@/types';
import React from 'react';
type Step = 'template' | 'preview' | 'result';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

type PreviewData = ImportPreviewResponse & { rows: ImportPreviewRow[] };

const STEPS: Step[] = ['template', 'preview', 'result'];

export default function ImportProductModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('template');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResponse | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      await productsService.downloadTemplate();
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
      const data = await productsService.previewImport(file);
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
      const result = await productsService.commitImport(file);
      setCommitResult(result);
      setStep('result');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Lỗi import sản phẩm');
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
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4">
      <div className="bg-basic-white rounded-2xl border border-basic-border max-w-4xl w-full max-h-[90vh] flex flex-col shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-yellowfish-400 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-blacky-950">Import sản phẩm từ Excel</h2>
            <p className="text-sm text-blacky-500 mt-0.5">
              {step === 'template' && 'Bước 1: Tải template và chuẩn bị file'}
              {step === 'preview' && 'Bước 2: Xem trước và xác nhận'}
              {step === 'result' && 'Bước 3: Kết quả import'}
            </p>
          </div>
          <button
            onClick={onClose}
            title="Đóng"
            className="p-1.5 rounded-lg bg-bluesh-100 text-bluesh-800 hover:text-basic-white hover:bg-bluesh-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  STEPS.indexOf(step) >= i
                    ? 'bg-bluesh-800 text-basic-white'
                    : 'bg-blacky-100 text-blacky-400'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${STEPS.indexOf(step) >= i ? 'text-blacky-950 font-medium' : 'text-blacky-400'}`}>
                  {['Tải template', 'Xem trước', 'Kết quả'][i]}
                </span>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-blacky-200 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-accent-red/10 border border-accent-red/30 rounded-lg text-sm text-accent-red flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* STEP: Template & Upload */}
          {step === 'template' && (
            <div className="space-y-5">
              {/* Download template */}
              <div className="bg-bluesh-50 border border-bluesh-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-bluesh-800 mb-1.5">1. Tải file mẫu</h3>
                <p className="text-sm text-blacky-500 mb-3">
                  Tải file Excel mẫu, điền thông tin sản phẩm theo đúng cấu trúc, sau đó upload lại.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn btn-primary w-fit! px-4! rounded-lg! gap-2"
                >
                  <Download className="w-4 h-4" />
                  Tải template Excel
                </button>
              </div>

              {/* Upload file */}
              <div className="bg-blacky-50 border border-basic-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-blacky-700 mb-2">2. Upload file đã điền</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  title="Chọn file Excel"
                  onChange={handleFileSelect}
                  className="block text-sm text-blacky-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-bluesh-50 file:text-bluesh-800 hover:file:bg-bluesh-800 hover:file:text-basic-white file:transition-colors file:cursor-pointer"
                />
                {file && (
                  <p className="mt-2 text-sm text-yellowfish-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Đã chọn: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP: Preview */}
          {step === 'preview' && previewData && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-bluesh-50 rounded-xl p-3 text-center border border-bluesh-800/50">
                  <p className="text-2xl font-bold text-bluesh-800">{previewData.totalRows}</p>
                  <p className="text-xs text-blacky-500 mt-0.5">Tổng dòng</p>
                </div>
                <div className="bg-accent-green/10 rounded-xl p-3 text-center border border-accent-green">
                  <p className="text-2xl font-bold text-accent-green">{previewData.validCount}</p>
                  <p className="text-xs text-blacky-500 mt-0.5">Hợp lệ</p>
                </div>
                <div className="bg-accent-red/10 rounded-xl p-3 text-center border border-accent-red">
                  <p className="text-2xl font-bold text-accent-red">{previewData.invalidCount}</p>
                  <p className="text-xs text-blacky-500 mt-0.5">Lỗi</p>
                </div>
              </div>

              {/* Detail table */}
              <div className="border border-basic-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-bluesh-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-basic-white">Dòng</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-basic-white">SKU</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-basic-white">Tên SP</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-basic-white">Danh mục</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-basic-white">ĐV gốc</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-basic-white">ĐV quy đổi</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-basic-white">Giá</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-basic-white">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-basic-border">
                      {previewData.rows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.errors?.length > 0 ? 'bg-accent-red/5' : 'bg-accent-green/5'}
                        >
                          <td className="px-3 py-2 text-blacky-600">{row.rowNumber}</td>
                          <td className="px-3 py-2 font-medium text-blacky-700">{row.sku}</td>
                          <td className="px-3 py-2 text-blacky-800">{row.productName}</td>
                          <td className="px-3 py-2 text-blacky-800">{row.categoryName}</td>
                          <td className="px-3 py-2 text-blacky-800">{row.baseUnit}</td>
                          <td className="px-3 py-2 text-blacky-800">{row.unitName || '—'}</td>
                          <td className="px-3 py-2 text-blacky-800">{row.unitPrice != null ? Number(row.unitPrice).toLocaleString() : '—'}</td>
                          <td className="px-3 py-2 text-center">
                            {row.errors?.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-accent-red" title={row.errors.join('; ')}>
                                <AlertCircle className="w-3.5 h-3.5" />
                                {row.errors.length} lỗi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-accent-green">
                                <CheckCircle className="w-3.5 h-3.5" />
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
                <div className="p-3 bg-yellowfish-50 border border-yellowfish-400/30 rounded-lg text-sm text-yellowfish-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Không có dòng nào hợp lệ để import. Vui lòng sửa file và thử lại.
                </div>
              )}
            </div>
          )}

          {/* STEP: Result */}
          {step === 'result' && commitResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-accent-green" />
                </div>
                <h3 className="text-lg font-semibold text-blacky-950">Import thành công!</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-accent-green/10 rounded-xl p-3 text-center border border-accent-green/20">
                  <p className="text-2xl font-bold text-accent-green">{commitResult.created}</p>
                  <p className="text-xs text-blacky-500 mt-0.5">Tạo mới</p>
                </div>
                <div className="bg-bluesh-50 rounded-xl p-3 text-center border border-bluesh-800/15">
                  <p className="text-2xl font-bold text-bluesh-800">{commitResult.updated}</p>
                  <p className="text-xs text-blacky-500 mt-0.5">Cập nhật</p>
                </div>
                <div className="bg-accent-red/10 rounded-xl p-3 text-center border border-accent-red/20">
                  <p className="text-2xl font-bold text-accent-red">{commitResult.skipped}</p>
                  <p className="text-xs text-blacky-500 mt-0.5">Bỏ qua (lỗi)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-basic-border flex justify-between shrink-0">
          {step === 'template' && (
            <>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Hủy
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={!file || loading}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Đang xử lý...</>
                ) : (
                  <><Upload className="w-4 h-4" />Xem trước</>
                )}
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button type="button" onClick={handleReset} className="btn btn-secondary">
                Chọn file khác
              </button>
              <button
                type="button"
                onClick={handleCommit}
                disabled={loading || previewData?.validCount === 0}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Đang import...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" />Xác nhận import ({previewData?.validCount} dòng)</>
                )}
              </button>
            </>
          )}

          {step === 'result' && (
            <div className="w-full flex justify-end">
              <button type="button" onClick={handleDone} className="btn btn-primary">
                Hoàn tất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
