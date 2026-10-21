import { useState, useRef } from 'react';
import {
  X,
  Settings,
  Check,
  Download,
  Upload,
} from 'lucide-react';
import type { CouchDbSettings } from '../../types';
import {
  getCouchDbSettings,
  saveCouchDbSettings,
} from '../../services/couchdb.service';
import { exportBackupData, importBackupData } from '../../services/storage.service';
import { HashGeneratorModal } from '../Auth/HashGeneratorModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export function SettingsModal({ isOpen, onClose, onSettingsSaved }: SettingsModalProps) {
  const [settings] = useState<CouchDbSettings>(() => getCouchDbSettings());
  const [isHashModalOpen, setIsHashModalOpen] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    saveCouchDbSettings(settings);
    onSettingsSaved();
    onClose();
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportBackupData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waves_cash_drawer_mongodb_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupMsg('Backup downloaded successfully from MongoDB.');
    } catch (err: any) {
      setBackupMsg(`Export failed: ${err.message}`);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      const res = await importBackupData(content);
      if (res.success) {
        setBackupMsg('Backup file verified.');
      } else {
        setBackupMsg(`Error: ${res.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 text-slate-800 border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <span>CouchDB & System Settings</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Database connection and local records</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* CouchDB Configuration */}
            {/* <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span>CouchDB Payments Database</span>
                </span>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md flex items-center gap-1 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                    testResult.ok
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.ok ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

           
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  CouchDB Server URL
                </label>
                <input
                  type="text"
                  value={settings.url}
                  onChange={e => setSettings({ ...settings, url: e.target.value })}
                  placeholder="e.g. http://localhost:5984"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={settings.dbName}
                    onChange={e => setSettings({ ...settings, dbName: e.target.value })}
                    placeholder="tango_payments"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Location Filter
                  </label>
                  <input
                    type="text"
                    value={settings.location}
                    onChange={e => setSettings({ ...settings, location: e.target.value })}
                    placeholder="Port Blair"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={settings.user}
                    onChange={e => setSettings({ ...settings, user: e.target.value })}
                    placeholder="admin"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={settings.password}
                    onChange={e => setSettings({ ...settings, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:border-slate-800"
                  />
                </div>
              </div>
            </div> */}

            {/* Password Hashes Tool */}
            {/* <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Password Hash Generator</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Create new SHA-256 hashes for login PINs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHashModalOpen(true)}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition"
              >
                Open Tool
              </button>
            </div> */}

            {/* Backup & Restore */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-800">
                Data Backup & Restore
              </div>
              <p className="text-[11px] text-slate-400">
                Export drawer records to JSON or restore a previously saved backup file.
              </p>

              {backupMsg && (
                <div className="p-2 bg-slate-100 text-slate-700 rounded text-xs">
                  {backupMsg}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Backup</span>
                </button>

                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Restore Backup</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </div>

      <HashGeneratorModal
        isOpen={isHashModalOpen}
        onClose={() => setIsHashModalOpen(false)}
      />
    </>
  );
}
