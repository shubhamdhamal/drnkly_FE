import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Issue {
  id: number;
  category: string;
  description: string;
  file?: File | null;
  transactionId?: string;
  priority?: string;
  email?: string;
  phone?: string;
  updates?: boolean;
  timestamp: string;
}

interface Update {
  time: string;
  status: string;
  active: boolean;
}

const IssueTracking: React.FC = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [updatesData, setUpdatesData] = useState<Record<number, Update[]>>({});

  useEffect(() => {
    const stored = localStorage.getItem('reportedIssues');
    if (stored) {
      const parsed: Issue[] = JSON.parse(stored);
      setIssues(parsed);

      const updates: Record<number, Update[]> = {};
      parsed.forEach((issue) => {
        updates[issue.id] = [
          {
            time: 'Now',
            status: `${issue.category} submitted by user`,
            active: true,
          },
        ];
      });
      setUpdatesData(updates);
    }
  }, []);

  const handleViewUpdate = () => {
    navigate('/issue-report');
  };

  const selectedUpdates = selectedTicket ? updatesData[selectedTicket] || [] : [];

  return (
    <div className="w-full px-4 sm:px-8 py-10 bg-gray-50 min-h-screen">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 sm:p-10 font-sans">
        <h2 className="text-3xl font-bold mb-6 text-center">Issue Tracking</h2>

        <div>
          <h3 className="text-xl font-semibold mb-3">My Issues</h3>
          <div className="border rounded-lg divide-y">
            {issues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setSelectedTicket(issue.id)}
                className={`flex justify-between items-center p-4 text-sm sm:text-base w-full text-left hover:bg-gray-50 transition ${selectedTicket === issue.id ? 'bg-gray-100' : ''}`}
              >
                <div>
                  <p className="text-gray-600 font-medium">
                    Ticket ID <span className="font-bold text-black">{issue.id}</span>
                  </p>
                  <p className="text-black">{issue.category}</p>
                  <p className="text-gray-500">{new Date(issue.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <span className="px-3 py-1 text-xs sm:text-sm font-semibold rounded-full bg-gray-200 text-gray-700">
                    Pending
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedTicket && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-3">Issue Status Updates</h3>
            <ul className="space-y-4">
              {selectedUpdates.map((u, i) => (
                <li key={i} className="flex items-start gap-4 text-sm">
                  <div
                    className={`mt-1 w-3 h-3 rounded-full ${u.active ? 'bg-blue-600' : 'bg-gray-300'}`}
                  ></div>
                  <div>
                    <p className="text-gray-500 font-semibold">{u.time}</p>
                    <p className="text-gray-800">{u.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleViewUpdate}
          className="w-full mt-8 bg-gray-900 text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition"
        >
          View/Update the Issue
        </button>
      </div>
    </div>
  );
};

export default IssueTracking;
