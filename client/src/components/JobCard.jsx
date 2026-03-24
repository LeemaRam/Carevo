import { Pencil, Trash2, ExternalLink, Calendar, Building2, FileText } from 'lucide-react';

const STATUS_STYLES = {
  Applied:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Interview: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Offer:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Rejected:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function JobCard({ job, onEdit, onDelete }) {
  const statusClass = STATUS_STYLES[job.status] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

  const formattedDate = job.applicationDate
    ? new Date(job.applicationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">{job.title}</h3>
          <div className="flex items-center gap-1.5 mt-0.5 text-gray-500 dark:text-gray-400 text-sm">
            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${statusClass}`}>
          {job.status}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
        {formattedDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
        )}
        {job.jobLink && (
          <a
            href={job.jobLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Job Link</span>
          </a>
        )}
      </div>

      {/* Notes */}
      {job.notes && (
        <div className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
          <FileText className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <p className="line-clamp-2">{job.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 mt-auto border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => onEdit(job)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          onClick={() => onDelete(job._id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-auto"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
