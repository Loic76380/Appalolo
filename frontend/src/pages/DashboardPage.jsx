import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Monitor, Cpu, HardDrive, Network, Activity, 
    Settings, LogOut, Server, Package, RefreshCw,
    MemoryStick, Clock, Layers
} from 'lucide-react';
import { Gauge } from '../components/Gauge';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(null);
    const [history, setHistory] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [services, setServices] = useState([]);
    const [apps, setApps] = useState([]);
    const [vpsInfo, setVpsInfo] = useState(null);
    const [preferences, setPreferences] = useState([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const token = localStorage.getItem('token');

    const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` }
    };

    const fetchData = useCallback(async () => {
        try {
            const [metricsRes, historyRes, processesRes, servicesRes, appsRes, vpsRes, prefsRes] = await Promise.all([
                axios.get(`${API}/metrics/current`, axiosConfig),
                axios.get(`${API}/metrics/history?hours=1`, axiosConfig),
                axios.get(`${API}/processes`, axiosConfig),
                axios.get(`${API}/services`, axiosConfig),
                axios.get(`${API}/apps`, axiosConfig),
                axios.get(`${API}/vps/info`, axiosConfig),
                axios.get(`${API}/preferences`, axiosConfig),
            ]);

            setMetrics(metricsRes.data);
            setHistory(historyRes.data);
            setProcesses(processesRes.data);
            setServices(servicesRes.data);
            setApps(appsRes.data);
            setVpsInfo(vpsRes.data);
            setPreferences(prefsRes.data);
            setLastUpdate(new Date());
            setLoading(false);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/');
            }
        }
    }, [navigate, token]);

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData, navigate, token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const togglePreference = async (metricId) => {
        const newPrefs = preferences.map(p => 
            p.id === metricId ? { ...p, enabled: !p.enabled } : p
        );
        setPreferences(newPrefs);

        try {
            await axios.put(`${API}/preferences`, {
                preferences: [{ metric_id: metricId, enabled: !preferences.find(p => p.id === metricId)?.enabled }]
            }, axiosConfig);
        } catch (err) {
            console.error('Failed to update preferences');
        }
    };

    const isEnabled = (metricId) => preferences.find(p => p.id === metricId)?.enabled ?? true;

    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}j ${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--matrix-bg)] flex items-center justify-center scanlines">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-[var(--matrix-green)] animate-spin mx-auto mb-4" />
                    <p className="text-[var(--matrix-green)] cursor-blink">CHARGEMENT DES DONNÉES</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--matrix-bg)] scanlines" data-testid="dashboard-container">
            {/* Sidebar */}
            <div className="dashboard-sidebar fixed left-0 top-0 h-full z-30" data-testid="dashboard-sidebar">
                <div className="sidebar-icon active" title="Dashboard">
                    <Monitor className="w-5 h-5" />
                </div>
                <div className="sidebar-icon" title="Processus">
                    <Activity className="w-5 h-5" />
                </div>
                <div className="sidebar-icon" title="Services">
                    <Layers className="w-5 h-5" />
                </div>
                <div className="sidebar-icon" title="Applications">
                    <Package className="w-5 h-5" />
                </div>
                <div className="flex-1" />
                <div 
                    className="sidebar-icon" 
                    title="Paramètres"
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    data-testid="settings-button"
                >
                    <Settings className="w-5 h-5" />
                </div>
                <div 
                    className="sidebar-icon" 
                    title="Déconnexion"
                    onClick={handleLogout}
                    data-testid="logout-button"
                >
                    <LogOut className="w-5 h-5" />
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-16 p-4" data-testid="dashboard-main">
                {/* Header */}
                <header className="dashboard-header" data-testid="dashboard-header">
                    <div>
                        <h1 className="text-2xl font-bold tracking-wider text-glow uppercase flex items-center gap-3">
                            <Server className="w-6 h-6" />
                            VPS MONITOR
                        </h1>
                        <p className="text-[var(--matrix-dark)] text-xs mt-1">
                            {vpsInfo?.ip} // {vpsInfo?.provider} - {vpsInfo?.datacenter}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="vps-status">
                            <div className="vps-status-indicator" />
                            <span className="text-xs uppercase">En ligne</span>
                        </div>
                        <div className="text-xs text-[var(--matrix-dark)]">
                            MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}
                        </div>
                        <button onClick={fetchData} className="sidebar-icon" data-testid="refresh-button">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* VPS Info Bar */}
                <div className="matrix-card p-3 mb-4 flex flex-wrap gap-4 text-xs" data-testid="vps-info-bar">
                    <span><strong className="text-[var(--matrix-green)]">HOSTNAME:</strong> {vpsInfo?.hostname}</span>
                    <span><strong className="text-[var(--matrix-green)]">OS:</strong> {vpsInfo?.os}</span>
                    <span><strong className="text-[var(--matrix-green)]">KERNEL:</strong> {vpsInfo?.kernel}</span>
                    <span><strong className="text-[var(--matrix-green)]">ARCH:</strong> {vpsInfo?.architecture}</span>
                </div>

                {/* Metrics Grid */}
                <div className="metrics-grid">
                    {/* CPU */}
                    {isEnabled('cpu') && (
                        <div className="matrix-card p-4" data-testid="cpu-card">
                            <div className="flex items-center gap-2 mb-4">
                                <Cpu className="w-4 h-4" />
                                <h3 className="text-sm uppercase tracking-wider">CPU</h3>
                            </div>
                            <div className="flex items-center gap-6">
                                <Gauge value={metrics?.cpu_percent || 0} label="CPU" />
                                <div className="text-xs space-y-2">
                                    <p><span className="text-[var(--matrix-dark)]">Cores:</span> {metrics?.cpu_cores}</p>
                                    <p><span className="text-[var(--matrix-dark)]">Load:</span> {metrics?.load_average?.join(' / ')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RAM */}
                    {isEnabled('ram') && (
                        <div className="matrix-card p-4" data-testid="ram-card">
                            <div className="flex items-center gap-2 mb-4">
                                <MemoryStick className="w-4 h-4" />
                                <h3 className="text-sm uppercase tracking-wider">MÉMOIRE</h3>
                            </div>
                            <div className="flex items-center gap-6">
                                <Gauge value={metrics?.ram_percent || 0} label="RAM" />
                                <div className="text-xs space-y-2">
                                    <p><span className="text-[var(--matrix-dark)]">Utilisé:</span> {metrics?.ram_used_gb?.toFixed(1)} GB</p>
                                    <p><span className="text-[var(--matrix-dark)]">Total:</span> {metrics?.ram_total_gb} GB</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Disk */}
                    {isEnabled('disk') && (
                        <div className="matrix-card p-4" data-testid="disk-card">
                            <div className="flex items-center gap-2 mb-4">
                                <HardDrive className="w-4 h-4" />
                                <h3 className="text-sm uppercase tracking-wider">DISQUE</h3>
                            </div>
                            <div className="flex items-center gap-6">
                                <Gauge value={metrics?.disk_percent || 0} label="Disk" />
                                <div className="text-xs space-y-2">
                                    <p><span className="text-[var(--matrix-dark)]">Utilisé:</span> {metrics?.disk_used_gb?.toFixed(1)} GB</p>
                                    <p><span className="text-[var(--matrix-dark)]">Total:</span> {metrics?.disk_total_gb} GB</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Network */}
                    {isEnabled('network') && (
                        <div className="matrix-card p-4" data-testid="network-card">
                            <div className="flex items-center gap-2 mb-4">
                                <Network className="w-4 h-4" />
                                <h3 className="text-sm uppercase tracking-wider">RÉSEAU</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[var(--matrix-dark)]">↓ Entrée</span>
                                        <span>{metrics?.network_in_mbps?.toFixed(2)} Mbps</span>
                                    </div>
                                    <div className="matrix-progress">
                                        <div 
                                            className="matrix-progress-bar" 
                                            style={{ width: `${Math.min(metrics?.network_in_mbps / 100 * 100, 100)}%` }} 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[var(--matrix-dark)]">↑ Sortie</span>
                                        <span>{metrics?.network_out_mbps?.toFixed(2)} Mbps</span>
                                    </div>
                                    <div className="matrix-progress">
                                        <div 
                                            className="matrix-progress-bar" 
                                            style={{ width: `${Math.min(metrics?.network_out_mbps / 100 * 100, 100)}%` }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Uptime */}
                    {isEnabled('uptime') && (
                        <div className="matrix-card p-4" data-testid="uptime-card">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4" />
                                <h3 className="text-sm uppercase tracking-wider">UPTIME</h3>
                            </div>
                            <div className="text-3xl font-bold text-glow">
                                {formatUptime(metrics?.uptime_seconds || 0)}
                            </div>
                            <div className="text-xs text-[var(--matrix-dark)] mt-2">
                                Processus actifs: {metrics?.processes_count}
                            </div>
                        </div>
                    )}
                </div>

                {/* CPU History Chart */}
                {isEnabled('cpu') && history.length > 0 && (
                    <div className="matrix-card p-4 mt-4" data-testid="cpu-history-chart">
                        <h3 className="text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            HISTORIQUE CPU (1H)
                        </h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history}>
                                    <defs>
                                        <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00FF41" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#00FF41" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis 
                                        dataKey="timestamp" 
                                        stroke="#003B00"
                                        tick={{ fill: '#008F11', fontSize: 10 }}
                                        tickFormatter={(v) => new Date(v).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    />
                                    <YAxis 
                                        stroke="#003B00" 
                                        tick={{ fill: '#008F11', fontSize: 10 }}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            background: '#000', 
                                            border: '1px solid #00FF41',
                                            color: '#00FF41'
                                        }}
                                        formatter={(v) => [`${v.toFixed(1)}%`, 'CPU']}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="cpu_percent" 
                                        stroke="#00FF41" 
                                        fill="url(#cpuGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Processes Table */}
                {isEnabled('processes') && (
                    <div className="matrix-card p-4 mt-4" data-testid="processes-table">
                        <h3 className="text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            PROCESSUS ACTIFS
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="matrix-table">
                                <thead>
                                    <tr>
                                        <th>PID</th>
                                        <th>Nom</th>
                                        <th>User</th>
                                        <th>CPU %</th>
                                        <th>MEM %</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processes.slice(0, 10).map((proc, index) => (
                                        <tr key={`${proc.pid}-${index}`}>
                                            <td>{proc.pid}</td>
                                            <td>{proc.name}</td>
                                            <td>{proc.user}</td>
                                            <td>{proc.cpu_percent.toFixed(1)}</td>
                                            <td>{proc.memory_percent.toFixed(1)}</td>
                                            <td>
                                                <span className={`status-dot ${proc.status === 'running' ? 'active' : 'inactive'}`} />
                                                <span className="ml-2">{proc.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Services */}
                {isEnabled('services') && (
                    <div className="matrix-card p-4 mt-4" data-testid="services-table">
                        <h3 className="text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            SERVICES SYSTEMD
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {services.map((svc) => (
                                <div 
                                    key={svc.name} 
                                    className="flex items-center gap-2 p-2 border border-[var(--matrix-border)]"
                                >
                                    <span className={`status-dot ${svc.active ? 'active' : 'inactive'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs truncate">{svc.name}</p>
                                        <p className="text-xs text-[var(--matrix-dark)] truncate">{svc.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Installed Apps */}
                {isEnabled('apps') && (
                    <div className="matrix-card p-4 mt-4 mb-20" data-testid="apps-table">
                        <h3 className="text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            APPLICATIONS INSTALLÉES
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="matrix-table">
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Version</th>
                                        <th>Taille</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apps.map((app) => (
                                        <tr key={app.name}>
                                            <td>{app.name}</td>
                                            <td>{app.version}</td>
                                            <td>{app.size}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Panel */}
            <div className={`settings-panel ${settingsOpen ? 'open' : ''}`} data-testid="settings-panel">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold uppercase tracking-wider">Paramètres</h2>
                    <button 
                        onClick={() => setSettingsOpen(false)}
                        className="text-[var(--matrix-dark)] hover:text-[var(--matrix-green)]"
                        data-testid="close-settings"
                    >
                        ✕
                    </button>
                </div>

                <h3 className="text-xs uppercase tracking-widest text-[var(--matrix-dark)] mb-4">
                    Métriques à afficher
                </h3>

                <div className="space-y-3">
                    {preferences.map((pref) => (
                        <label 
                            key={pref.id} 
                            className="matrix-checkbox block"
                            data-testid={`pref-${pref.id}`}
                        >
                            <input
                                type="checkbox"
                                checked={pref.enabled}
                                onChange={() => togglePreference(pref.id)}
                            />
                            <span className="toggle">
                                {pref.enabled ? '[x]' : '[ ]'}
                            </span>
                            <span className={pref.enabled ? 'text-[var(--matrix-green)]' : 'text-[var(--matrix-dark)]'}>
                                {pref.name}
                            </span>
                        </label>
                    ))}
                </div>

                <div className="mt-8 pt-4 border-t border-[var(--matrix-border)]">
                    <p className="text-xs text-[var(--matrix-dark)]">
                        &gt; MATRIX VPS MONITOR v1.0
                    </p>
                    <p className="text-xs text-[var(--matrix-dark)] mt-1">
                        &gt; Rafraîchissement: 5s
                    </p>
                </div>
            </div>
        </div>
    );
}
