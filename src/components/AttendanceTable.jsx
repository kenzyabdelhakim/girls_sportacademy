import React from 'react';
import { CheckCircle, Clock, Calendar } from 'lucide-react';

const AttendanceTable = ({ attendance, loading }) => {
  if (loading) {
    return (
      <div className="glass-card">
        <div className="flex items-center justify-center py-12">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (attendance.length === 0) {
    return (
      <div className="glass-card text-center py-12">
        <CheckCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
        <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>No attendance records found</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Try adjusting your filters or scan some QR codes to mark attendance
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <h2 className="text-lg font-bold px-6 pt-6 mb-4" style={{ color: 'var(--text-primary)' }}>
        Attendance List ({attendance.length} records)
      </h2>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Student ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Student Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Group
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {attendance.map((record, index) => (
              <tr
                key={record.id || index}
                className="transition-all duration-300"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm" style={{ color: 'var(--text-primary)' }}>
                    <Calendar size={14} className="mr-2" style={{ color: 'var(--text-muted)' }} />
                    {record.date}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Clock size={14} className="mr-2" style={{ color: 'var(--text-muted)' }} />
                    {record.time}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {record.studentId}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {record.studentName}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="badge-purple">
                    {record.group}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="badge-green">
                    <CheckCircle size={12} className="mr-1" />
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 p-4">
        {attendance.map((record, index) => (
          <div key={record.id || index} className="p-4 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{record.studentName}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ID: {record.studentId}</p>
              </div>
              <span className="badge-green">
                <CheckCircle size={12} className="mr-1" />
                {record.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Calendar size={14} className="mr-2" />
                <span>{record.date}</span>
              </div>
              <div className="flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Clock size={14} className="mr-2" />
                <span>{record.time}</span>
              </div>
              <div>
                <span className="badge-purple">
                  {record.group}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceTable;
