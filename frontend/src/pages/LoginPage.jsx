import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MatrixRain } from '../components/MatrixRain';
import { Monitor, Lock, Mail, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const response = await axios.post(`${API}${endpoint}`, { email, password });
            
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--matrix-bg)] relative overflow-hidden scanlines">
            <MatrixRain />
            
            <div className="login-container">
                <div className="matrix-card p-8 w-full max-w-md mx-4" data-testid="login-form-container">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Monitor className="w-8 h-8 text-[var(--matrix-green)]" />
                            <h1 className="text-2xl font-bold tracking-wider text-glow uppercase">
                                VPS Monitor
                            </h1>
                        </div>
                        <p className="text-[var(--matrix-dark)] text-sm typing">
                            [ SYSTÈME DE SURVEILLANCE MATRIX ]
                        </p>
                        <p className="text-[var(--matrix-dark)] text-xs mt-2">
                            51.210.242.96 // OVH
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-2 p-3 border border-[var(--matrix-red)] text-[var(--matrix-red)] text-sm" data-testid="login-error">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-[var(--matrix-dark)]">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--matrix-dark)]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="matrix-input pl-10"
                                    placeholder="user@matrix.net"
                                    required
                                    data-testid="login-email-input"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-[var(--matrix-dark)]">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--matrix-dark)]" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="matrix-input pl-10"
                                    placeholder="••••••••"
                                    required
                                    data-testid="login-password-input"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="matrix-btn w-full py-3 glitch"
                            data-testid="login-submit-button"
                        >
                            {loading ? (
                                <span className="cursor-blink">CONNEXION EN COURS</span>
                            ) : (
                                isRegister ? '[ CRÉER COMPTE ]' : '[ CONNEXION ]'
                            )}
                        </button>
                    </form>

                    {/* Toggle Register/Login */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-[var(--matrix-dark)] text-xs hover:text-[var(--matrix-green)] transition-colors"
                            data-testid="toggle-auth-mode"
                        >
                            {isRegister ? '[ DÉJÀ UN COMPTE ? CONNEXION ]' : '[ NOUVEAU ? CRÉER UN COMPTE ]'}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-[var(--matrix-border)] text-center">
                        <p className="text-[var(--matrix-dark)] text-xs">
                            &gt; MATRIX VPS MONITOR v1.0
                        </p>
                        <p className="text-[var(--matrix-dark)] text-xs mt-1">
                            &gt; SURVEILLANCE TEMPS RÉEL
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
