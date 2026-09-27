'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { offlineDb } from '@/lib/offline-sync/db';
import { SyncManager, type SyncTelemetry } from '@/lib/offline-sync/sync-manager';
import { RefreshCw, Database, X, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { OfflineSyncItem } from '@/types/healthcare';

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({ isOpen, onClose }) => {
  const { t, locale } = useLanguage();
  const [pendingItems, setPendingItems] = useState<OfflineSyncItem[]>([]);
  const [telemetry, setTelemetry] = useState<SyncTelemetry | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ text: string; success: boolean } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const items = await offlineDb.syncQueue.toArray();
      setPendingItems(items);
      const tel = await SyncManager.getTelemetry();
      setTelemetry(tel);
    } catch {
      // ignore offline storage errors
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setResultMsg(null);
    try {
      const { synced, failed } = await SyncManager.processQueue();
      const success = failed === 0;
      const msg = locale === 'mr'
        ? `सिंक पूर्ण: ${synced} यशस्वी, ${failed} अयशस्वी.`
        : locale === 'hi'
        ? `सिंक पूर्ण: ${synced} सफल, ${failed} असफल.`
        : `Sync complete: ${synced} synced, ${failed} failed.`;
      setResultMsg({ text: msg, success });
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) {
      return locale === 'mr' ? 'अद्याप सिंक नाही (Never)' : locale === 'hi' ? 'अभी तक सिंक नहीं (Never)' : 'Never';
    }
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return isoString;
    }
  };

  const getOpBadgeClass = (op: string) => {
    switch (op) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getEntityBadgeClass = (entity: string) => {
    switch (entity?.toLowerCase()) {
      case 'patient':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'encounter':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'vitals':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'referral':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'follow_up':
      case 'follow_up_tasks':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const lastSyncLabel = locale === 'mr' ? 'शेवटचा यशस्वी सिंक' : locale === 'hi' ? 'अंतिम सफल सिंक' : 'Last Synced';
  const retryLabel = locale === 'mr' ? 'पुन्हा प्रयत्न' : locale === 'hi' ? 'पुनः प्रयास' : 'retries';
  const syncInProgressLabel = locale === 'mr' ? 'डेटा सिंक सुरू आहे...' : locale === 'hi' ? 'डेटा सिंक हो रहा है...' : 'Synchronizing queue...';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-50 rounded-lg text-teal-700 border border-teal-100">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t.syncModalTitle}</h3>
              <p className="text-[11px] text-slate-500">{t.syncModalDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                {lastSyncLabel}
              </span>
              <span className="font-medium text-slate-800 text-[11px] truncate block" title={telemetry?.lastSyncTime || undefined}>
                {formatLastSync(telemetry?.lastSyncTime ?? null)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
            {telemetry && telemetry.failedCount > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                {locale === 'mr' ? 'रांग स्थिती' : locale === 'hi' ? 'कतार स्थिति' : 'Queue Health'}
              </span>
              <span className="font-medium text-slate-800 text-[11px]">
                {telemetry?.failedCount ? `${telemetry.failedCount} ${retryLabel}` : (locale === 'mr' ? 'सुरळीत' : locale === 'hi' ? 'सामान्य' : 'Healthy')}
              </span>
            </div>
          </div>
        </div>

        {/* Result Message */}
        {resultMsg && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-center space-x-2 border ${
              resultMsg.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {resultMsg.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{resultMsg.text}</span>
          </div>
        )}

        {/* Queue Items */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>{t.pendingItemsCount}:</span>
            <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-teal-200">
              {pendingItems.length}
            </span>
          </div>

          <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
            {pendingItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" />
                <p className="font-medium text-slate-700 text-xs">{t.noPendingItems}</p>
                <p className="text-[11px] text-slate-400">
                  {locale === 'mr' ? 'सर्व स्थानिक नोंदी क्लाऊडवर सुरक्षित आहेत.' : locale === 'hi' ? 'सभी स्थानीय रिकॉर्ड्स सुरक्षित रूप से सिंक हैं।' : 'All offline records are synced with cloud storage.'}
                </p>
              </div>
            ) : (
              pendingItems.map(item => {
                const payloadName = item.payload?.full_name || item.payload?.patient_name;
                const retries = item.retry_count || 0;
                return (
                  <div key={item.id} className="p-2.5 flex justify-between items-center bg-slate-50/60 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getEntityBadgeClass(item.entity_type)}`}>
                          {item.entity_type}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getOpBadgeClass(item.operation)}`}>
                          {item.operation || 'CREATE'}
                        </span>
                        {retries > 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>{retries} {retryLabel}</span>
                          </span>
                        )}
                      </div>
                      {payloadName && (
                        <p className="text-[11px] font-medium text-slate-700 truncate">
                          {payloadName}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleTimeString()} • {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold uppercase tracking-wider shrink-0">
                      {item.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {t.closeBtn}
          </button>
          <button
            onClick={handleSyncNow}
            disabled={isSyncing || pendingItems.length === 0}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? syncInProgressLabel : t.manualSyncBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
