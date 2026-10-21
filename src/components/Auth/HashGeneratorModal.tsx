import { useState, useEffect } from 'react';
import { KeyRound, Copy, Check, Terminal, ShieldCheck, X } from 'lucide-react';
import { computeSha256, getAllowedHashes } from '../../services/auth.service';

interface HashGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HashGeneratorModal({ isOpen, onClose }: HashGeneratorModalProps) {
  const [inputPass, setInputPass] = useState('');
  const [generatedHash, setGeneratedHash] = useState('');
  const [copied, setCopied] = useState(false);
  const allowedHashes = getAllowedHashes();

  useEffect(() => {
    let active = true;
    if (!inputPass) {
      return;
    }
    computeSha256(inputPass).then(h => {
      if (active) setGeneratedHash(h);
    });
    return () => {
      active = false;
    };
  }, [inputPass]);

  const handleCopy = () => {
    if (!generatedHash) return;
    navigator.clipboard.writeText(generatedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInputChange = (val: string) => {
    setInputPass(val);
    if (!val) {
      setGeneratedHash('');
    }
  };

  if (!isOpen) return null;

  const isMatched = allowedHashes.includes(generatedHash.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Password Hash Generator</h3>
              <p className="text-xs text-slate-500">SHA-256 static auth hasher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Enter Password / PIN to Hash
            </label>
            <input
              type="text"
              value={inputPass}
              onChange={e => handleInputChange(e.target.value)}
              placeholder="e.g. 1234 or yourSecretPass"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
              autoFocus
            />
          </div>

          {generatedHash && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Generated SHA-256 Hash:</span>
                {isMatched ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5" /> Already in Allowed Hashes
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    Not currently in allowed hashes
                  </span>
                )}
              </div>
              <div className="relative">
                <textarea
                  readOnly
                  rows={2}
                  value={generatedHash}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 select-all resize-none focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute right-2.5 top-2.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-900 rounded-xl p-3.5 text-slate-100 text-xs font-mono space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Generate anytime via Terminal:</span>
            </div>
            <p className="bg-slate-800 px-3 py-2 rounded-lg text-emerald-300 select-all">
              npm run hash-pass &quot;your-password&quot;
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Then paste the hash into your <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded">.env</code> under{' '}
              <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded">VITE_AUTH_HASHES</code>. Multiple hashes can be separated by commas.
            </p>
          </div>

          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-700 mb-2">Default Quick Passwords:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-slate-800">PIN: 1234</span>
                <span className="text-[11px] text-slate-500 font-mono">03ac67...</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-slate-800">PIN: admin123</span>
                <span className="text-[11px] text-slate-500 font-mono">240be5...</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-slate-800">PIN: waves2026</span>
                <span className="text-[11px] text-slate-500 font-mono">d6c234...</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-slate-800">PIN: cashier</span>
                <span className="text-[11px] text-slate-500 font-mono">6a79b5...</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
