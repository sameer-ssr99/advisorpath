import React, { useState, useEffect } from 'react';
import { Lightbulb, Calendar, History, Plus, Loader } from 'lucide-react';
import axios from '../api/axios';

export default function AntigravitySessionAdvisor({ activeTab, onScheduleClick }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdvice(activeTab);
  }, [activeTab]);

  const fetchAdvice = async (queryType) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/ai/session-advice', {
        queryType: queryType === 'upcoming' ? 'upcoming' : 'history'
      });

      if (response.data.success) {
        setAdvice(response.data.advice);
      }
    } catch (err) {
      setError('Failed to get AI advice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-3">
        <Loader size={20} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
        <span className="text-indigo-700 dark:text-indigo-300 font-medium">Getting AI insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  if (!advice) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800 space-y-4">
      <div className="flex items-start gap-4">
        <div className="bg-indigo-600 rounded-full p-2 flex-shrink-0">
          <Lightbulb size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
            Antigravity AI Advisor
          </h3>
          <p className="text-indigo-800 dark:text-indigo-200 text-sm leading-relaxed">
            {advice.advice}
          </p>
        </div>
      </div>

      {/* Sessions List */}
      {activeTab === 'upcoming' && advice.sessions && advice.sessions.length > 0 && (
        <div className="mt-4 space-y-2">
          {advice.sessions.map((session, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800/50 rounded-lg p-3 text-sm border border-indigo-100 dark:border-indigo-700">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium text-gray-800 dark:text-gray-200">{session.topic}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400 ml-6">
                <p>{session.datetime}</p>
                <p className="text-xs">with {session.advisor} • {session.mode}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History List */}
      {activeTab === 'past' && advice.history && advice.history.length > 0 && (
        <div className="mt-4 space-y-2">
          {advice.history.slice(0, 3).map((session, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800/50 rounded-lg p-3 text-sm border border-indigo-100 dark:border-indigo-700">
              <div className="flex items-center gap-2 mb-1">
                <History size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium text-gray-800 dark:text-gray-200">{session.topic}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400 ml-6 text-xs">
                <p>{session.datetime}</p>
                <p>with {session.advisor}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      {advice.recommendation && (
        <button
          onClick={onScheduleClick}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={16} />
          {advice.recommendation === 'Schedule new session' ? 'Schedule New Session' : advice.recommendation}
        </button>
      )}

      {/* Tips */}
      {advice.tips && (
        <p className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 rounded px-3 py-2">
          {advice.tips}
        </p>
      )}
    </div>
  );
}
