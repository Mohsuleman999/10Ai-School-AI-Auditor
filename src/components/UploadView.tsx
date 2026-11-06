import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Sparkles,
  ArrowRight,
  Database,
} from 'lucide-react';
import { RawUploadedFile } from '../types/reconciliation';
import { parseExcelSheet, parseUploadedFile } from '../utils/excelParser';
import { SAMPLE_TRAINING_FILES } from '../utils/sampleData';

interface UploadViewProps {
  uploadedFiles: RawUploadedFile[];
  onFilesChange: (files: RawUploadedFile[]) => void;
  onProceedToMapping: () => void;
  onLoadSampleData: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  uploadedFiles,
  onFilesChange,
  onProceedToMapping,
  onLoadSampleData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<RawUploadedFile | null>(
    uploadedFiles.length > 0 ? uploadedFiles[0] : null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    const newParsedFiles: RawUploadedFile[] = [];

    for (const f of files) {
      const res = await parseUploadedFile(f);
      newParsedFiles.push(res.file);
    }

    const updated = [...uploadedFiles, ...newParsedFiles];
    onFilesChange(updated);
    if (!previewFile && updated.length > 0) {
      setPreviewFile(updated[0]);
    }
    setIsProcessing(false);
  };

  const handleRemoveFile = (id: string) => {
    const updated = uploadedFiles.filter((f) => f.id !== id);
    onFilesChange(updated);
    if (previewFile?.id === id) {
      setPreviewFile(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleSheetChange = (file: RawUploadedFile, newSheet: string) => {
    // In demo / uploaded files, switch sheet
    const updated = uploadedFiles.map((f) => {
      if (f.id === file.id) {
        return {
          ...f,
          selectedSheet: newSheet,
        };
      }
      return f;
    });
    onFilesChange(updated);
    if (previewFile?.id === file.id) {
      setPreviewFile({ ...previewFile, selectedSheet: newSheet });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#405CF5]">
              Step 1 of 3: Ingestion
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Excel & CSV Discovery</span>
          </div>
          <h2 className="text-xl font-bold text-[#111735]">
            Upload Source Business Ledgers
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Upload .xlsx, .xls, or .csv files across Finance, Inventory, and HR. LedgerLens automatically
            discovers sheets, inspects column headers, preserves row indexes, and suggests canonical roles.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onLoadSampleData}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#111735] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors shadow-xs"
          >
            <Database className="w-4 h-4 text-[#405CF5]" />
            <span>Load 10AI School Sample Dataset</span>
          </button>
          {uploadedFiles.length > 0 && (
            <button
              onClick={onProceedToMapping}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#405CF5] hover:bg-[#3249d9] rounded-lg transition-colors shadow-xs"
            >
              <span>Confirm Mappings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#405CF5] bg-blue-50/50'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-[#405CF5] flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-[#111735]">
            {isProcessing ? 'Parsing files...' : 'Drag and drop your spreadsheet files here'}
          </div>
          <p className="text-xs text-slate-500">
            Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv). Row 1 headers detected.
          </p>
          <div className="pt-2">
            <span className="inline-block px-3 py-1.5 text-xs font-medium text-[#405CF5] bg-blue-50 border border-blue-200 rounded-md">
              Browse Files from Computer
            </span>
          </div>
        </div>
      </div>

      {/* Uploaded Files Table */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#405CF5]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111735]">
                Uploaded Data Sources ({uploadedFiles.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total Records:{' '}
              {uploadedFiles
                .reduce((acc, f) => acc + f.rawRows.length, 0)
                .toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Filename</th>
                  <th className="py-2.5 px-4">Worksheet</th>
                  <th className="py-2.5 px-4">Row Count</th>
                  <th className="py-2.5 px-4">Detected Columns</th>
                  <th className="py-2.5 px-4">Suggested Role</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uploadedFiles.map((file) => {
                  const isSelected = previewFile?.id === file.id;
                  return (
                    <tr
                      key={file.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-[#111735]">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                          <span>{file.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {file.sheets.length > 1 ? (
                          <select
                            value={file.selectedSheet}
                            onChange={(e) => handleSheetChange(file, e.target.value)}
                            className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 focus:border-[#405CF5] focus:outline-none"
                          >
                            {file.sheets.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-mono text-slate-600">
                            {file.selectedSheet || 'Sheet1'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {file.rawRows.length.toLocaleString()} rows
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {file.headers.slice(0, 4).map((h) => (
                            <span
                              key={h}
                              className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              {h}
                            </span>
                          ))}
                          {file.headers.length > 4 && (
                            <span className="text-[10px] text-slate-400">
                              +{file.headers.length - 4} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium text-slate-700 uppercase tracking-wide">
                          {file.suggestedRole.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className={`p-1.5 rounded transition-colors ${
                              isSelected
                                ? 'bg-[#405CF5] text-white'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                            title="Preview Source Rows"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveFile(file.id)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw Row Inspection Drawer / Table Preview */}
      {previewFile && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Raw Source Preview (Immutable Layer)
              </div>
              <div className="text-xs font-bold text-[#111735]">
                {previewFile.fileName} · Sheet: {previewFile.selectedSheet} · First 10 Records
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Preserving original row numbers & raw string values
            </div>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 sticky top-0">
                <tr>
                  <th className="py-2 px-3 text-slate-400 w-16">Row #</th>
                  {previewFile.headers.map((h) => (
                    <th key={h} className="py-2 px-3 whitespace-nowrap">
                      <div>{h}</div>
                      <div className="text-[9px] font-sans font-normal text-slate-400 lowercase">
                        {previewFile.detectedTypes[h] || 'string'}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewFile.rawRows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">
                      {idx + 2}
                    </td>
                    {previewFile.headers.map((h) => (
                      <td key={h} className="py-2 px-3 whitespace-nowrap text-slate-800">
                        {row[h] !== undefined && row[h] !== null ? String(row[h]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
