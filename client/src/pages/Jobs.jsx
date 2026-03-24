import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Search, SlidersHorizontal, ArrowUpDown, Briefcase } from 'lucide-react';
import JobCard from '../components/JobCard';
import JobForm from '../components/JobForm';

const STATUSES = ['All', 'Applied', 'Interview', 'Offer', 'Rejected'];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      params.sort = sortOrder;
      const { data } = await axios.get('/api/jobs', { params });
      setJobs(data.jobs ?? data);
    } catch {
      toast.error('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortOrder]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleAdd = async (formData) => {
    setFormLoading(true);
    try {
      await axios.post('/api/jobs', formData);
      toast.success('Application added!');
      setFormOpen(false);
      fetchJobs();
    } catch {
      toast.error('Failed to add job.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    setFormLoading(true);
    try {
      await axios.put(`/api/jobs/${editJob._id}`, formData);
      toast.success('Application updated!');
      setEditJob(null);
      fetchJobs();
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
      fetchJobs();
    } catch {
      toast.error('Failed to delete job.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search company or title..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none cursor-pointer"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Job
        </button>
      </div>

      {/* Job grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2 mb-4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4">
            <Briefcase className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-gray-700 dark:text-gray-300 font-semibold mb-1">No applications found</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-5">
            {search || statusFilter !== 'All'
              ? 'Try adjusting your filters.'
              : 'Add your first job application to get started.'}
          </p>
          {!search && statusFilter === 'All' && (
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add your first job
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map(job => (
            <JobCard
              key={job._id}
              job={job}
              onEdit={setEditJob}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add form */}
      {formOpen && (
        <JobForm
          onSubmit={handleAdd}
          onClose={() => setFormOpen(false)}
          loading={formLoading}
        />
      )}

      {/* Edit form */}
      {editJob && (
        <JobForm
          initialData={editJob}
          onSubmit={handleEdit}
          onClose={() => setEditJob(null)}
          loading={formLoading}
        />
      )}
    </div>
  );
}
