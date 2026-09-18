'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { offlineDb } from '@/lib/offline-sync/db';
import { SyncManager } from '@/lib/offline-sync/sync-manager';
import { RefreshCw, Database, X } from 'lucide-react';
import type { OfflineSyncItem } from '@/types/healthcare';

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [pendingItems, setPendingItems] = useState<OfflineSyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const loadPending = async () => {
    try {
      const items = await offlineDb.syncQueue.toArray();
      setPendingItems(items);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPending();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setResultMsg(null);
    try {
      const { synced, failed } = await SyncManager.processQueue();
      setResultMsg(`Sync complete: ${synced} synced, ${failed} failed.`);
      await loadPending();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">{t.syncModalTitle}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">{t.syncModalDesc}</p>

        {resultMsg && (
          <div className="p-2.5 bg-teal-50 border border-teal-200 text-teal-900 rounded-lg text-xs font-medium">
            {resultMsg}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>{t.pendingItemsCount}:</span>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              {pendingItems.length}
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
            {pendingItems.length === 0 ? (
              <div className="p-4 text-center text-slate-400">{t.noPendingItems}</div>
            ) : (
              pendingItems.map(item => (
                <div key={item.id} className="p-2.5 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <span className="font-bold uppercase text-[11px] text-teal-700">{item.entity_type}</span>
                    <p className="text-[11px] text-slate-500">{new Date(item.created_at).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {t.closeBtn}
          </button>
          <button
            onClick={handleSyncNow}
            disabled={isSyncing || pendingItems.length === 0}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : t.manualSyncBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
