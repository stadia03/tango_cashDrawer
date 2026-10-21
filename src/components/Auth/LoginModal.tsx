import { useState } from 'react';
import { Lock, AlertCircle, Delete, Shield } from 'lucide-react';
import { verifyPassword, saveSession } from '../../services/auth.service';
import { DEFAULT_STAFF_NAME } from '../../services/storage.service';
import { HashGeneratorModal } from './HashGeneratorModal';

interface LoginModalProps {
  onSuccess: () => void;
}

export function LoginModal({ onSuccess }: LoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isHashModalOpen, setIsHashModalOpen] = useState(false);

  const handleSubmit = async (passToVerify: string = password) => {
    if (!passToVerify.trim()) {
      setError('Please enter your PIN or password.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await verifyPassword(passToVerify);
      if (isValid) {
        saveSession(DEFAULT_STAFF_NAME);
        onSuccess();
      } else {
        setError('Incorrect password. Hash does not match.');
      }
    } catch {
      setError('Verification error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (num: string) => {
    setError(null);
    if (password.length < 16) {
      setPassword(password + num);
    }
  };

  const handleBackspace = () => {
    setPassword(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPassword('');
    setError(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-2xs p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-slate-800 border border-slate-200">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 text-slate-700 rounded-xl mb-2.5">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Waves Cash Drawer</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Port Blair 
            </p>
          </div>

          {/* Password Input */}
          <div className="mb-3">
            <input
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="Enter PIN / Password"
              className="w-full text-center text-lg font-bold tracking-widest px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-slate-800 text-slate-900"
              autoFocus
            />

            {error && (
              <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Touch Numpad */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(String(num))}
                className="h-11 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 text-base font-semibold rounded-lg transition border border-slate-200 flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 bg-slate-50 hover:bg-slate-100 text-slate-400 text-xs font-semibold rounded-lg transition border border-slate-200 flex items-center justify-center"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-11 bg-slate-50 hover:bg-slate-100 text-slate-800 text-base font-semibold rounded-lg transition border border-slate-200 flex items-center justify-center"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition border border-slate-200 flex items-center justify-center"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Unlock Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isVerifying}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isVerifying ? 'Verifying...' : 'Unlock Drawer'}</span>
          </button>

          {/* Quick PIN Chips */}
          {/* <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>PIN: 1234 / admin123</span>
            <button
              type="button"
              onClick={() => setIsHashModalOpen(true)}
              className="text-slate-600 hover:underline flex items-center gap-1 text-[11px]"
            >
              <KeyRound className="w-3 h-3" /> Hash Tool
            </button>
          </div> */}
        </div>
      </div>

      <HashGeneratorModal
        isOpen={isHashModalOpen}
        onClose={() => setIsHashModalOpen(false)}
      />
    </>
  );
}
