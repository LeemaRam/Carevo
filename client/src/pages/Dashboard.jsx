import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  Briefcase, SendHorizonal, MessageSquare, PartyPopper, XCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import JobCard from '../components/JobCard';
import JobForm from '../components/JobForm';

const STATUS_COLORS = {
  Applied:   '#6366f1',
  Interview: '#f59e0b',
  Offer:     '#10b981',
  Rejected:  '#ef4444',
};

const STAT_CONFIG = [
  { key: 'total',     label: 'Total',     icon: Briefcase,       colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' },
  { key: 'applied',   label: 'Applied',   icon: SendHorizonal,   colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' },
  { key: 'interview', label: 'Interview', icon: MessageSquare,   colorClass: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400' },
  { key: 'offer',     label: 'Offer',     icon: PartyPopper,     colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' },
  { key: 'rejected',  label: 'Rejected',  icon: XCircle,         colorClass: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, applied: 0, interview: 0, offer: 0, rejected: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [editJob, setEditJob] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        axios.get('/api/jobs/stats'),
        axios.get('/api/jobs?limit=5'),
      ]);
      setStats(statsRes.data);
      setRecentJobs(jobsRes.data.jobs ?? jobsRes.data);
      setMonthly(statsRes.data.monthly ?? []);
    } catch {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const pieData = ['Applied', 'Interview', 'Offer', 'Rejected']
    .map(status => ({ name: status, value: stats[status.toLowerCase()] ?? 0 }))
    .filter(d => d.value > 0);

  const handleEditSubmit = async (formData) => {
    setFormLoading(true);
    try {
      await axios.put(`/api/jobs/${editJob._id}`, formData);
      toast.success('Job updated!');
      setEditJob(null);
      fetchData();
    } catch {
      toast.error('Failed to update job.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await axios.delete(`/api/jobs/${id}`);
      toast.success('Application deleted.');
      fetchData();
    } catch {
      toast.error('Failed to delete job.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAT_CONFIG.map(({ key, label, icon, colorClass }) => (
          <StatCard
            key={key}
            label={label}
            count={loadingStats ? '—' : stats[key] ?? 0}
            icon={icon}
            colorClass={colorClass}
          />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Status Distribution</h2>
          {pieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Applications</h2>
          {monthly.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent jobs */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Applications</h2>
        {recentJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400 dark:text-gray-500 text-sm shadow-sm">
            No applications yet. Head to Jobs to add your first one!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {recentJobs.map(job => (
              <JobCard
                key={job._id}
                job={job}
                onEdit={setEditJob}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {editJob && (
        <JobForm
          initialData={editJob}
          onSubmit={handleEditSubmit}
          onClose={() => setEditJob(null)}
          loading={formLoading}
        />
      )}
    </div>
  );
}
