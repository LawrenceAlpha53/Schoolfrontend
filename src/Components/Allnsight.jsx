// AIInsights.jsx – Same width as SecurityCommandCenter (w-174)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import {
  Brain, TrendingUp, AlertTriangle, Loader2,
  ArrowRight, Sparkles, Users, DollarSign, Target,
  CheckCircle, AlertCircle
} from 'lucide-react';

const AIInsights = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [studentsRes, feesRes, marksRes] = await Promise.all([
        axios.get("/students", config).catch(() => ({ data: [] })),
        axios.get("/fees", config).catch(() => ({ data: [] })),
        axios.get("/marks", config).catch(() => ({ data: [] }))
      ]);

      const students = studentsRes.data?.data || studentsRes.data || [];
      const fees = feesRes.data?.data || feesRes.data || [];
      const marks = marksRes.data?.data || marksRes.data || [];

      const totalFeesDemanded = fees.reduce((sum, f) => sum + Number(f.totalFee || 0), 0);
      const totalFeesCollected = fees.reduce((sum, f) => sum + Number(f.amountPaid || 0), 0);
      const feeCollectionRate = totalFeesDemanded > 0 ? (totalFeesCollected / totalFeesDemanded) * 100 : 0;

      const allScores = marks.filter(m => m.score != null).map(m => Number(m.score));
      const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
      const passRate = allScores.length > 0 ? (allScores.filter(s => s >= 50).length / allScores.length) * 100 : 0;

      const isHealthy = feeCollectionRate > 80 && avgScore > 60 && passRate > 70;

      setSummary({
        totalStudents: students.length,
        feeCollectionRate,
        avgScore,
        passRate,
        isHealthy,
        insights: [
          isHealthy ? 'School is performing well across all metrics' : 'Some areas need attention',
          feeCollectionRate > 80 ? `Fee collection at ${feeCollectionRate.toFixed(0)}% — on track` : `Fee collection at ${feeCollectionRate.toFixed(0)}% — needs improvement`,
          avgScore > 60 ? `Academic average at ${avgScore.toFixed(0)}% — solid performance` : `Academic average at ${avgScore.toFixed(0)}% — room for growth`
        ]
      });
    } catch (error) {
      setSummary({
        totalStudents: 0, feeCollectionRate: 0, avgScore: 0, passRate: 0, isHealthy: false,
        insights: ['Unable to load data. Please refresh.']
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state (same w-174)
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm w-174">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <h2 className="font-semibold text-gray-800">AI Insights</h2>
          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin ml-auto" />
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-10 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate('/admin/ai-report')}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group w-174"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Brain className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">AI Intelligence</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${summary?.isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className={`text-xs font-medium ${summary?.isHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
                {summary?.isHealthy ? 'Healthy' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
      </div>

      {/* Landscape content (fits inside 696px) */}
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Left: Metrics */}
        <div className="sm:w-1/3 flex flex-col gap-2">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-gray-500 font-medium uppercase">Students</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{summary?.totalStudents || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-500 font-medium uppercase">Collected</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{summary?.feeCollectionRate?.toFixed(0) || 0}%</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500 font-medium uppercase">Pass Rate</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{summary?.passRate?.toFixed(0) || 0}%</p>
          </div>
        </div>

        {/* Right: Insights List */}
        <div className="sm:w-2/3 space-y-2">
          {summary?.insights?.slice(0, 3).map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              {insight.includes('well') || insight.includes('strong') || insight.includes('solid') || insight.includes('on track') ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : insight.includes('Unable') ? (
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm text-gray-600">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">Real-time analysis</span>
        <span className="text-xs text-indigo-500 group-hover:text-indigo-700 font-medium flex items-center gap-1">
          Full Report <Sparkles className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};

export default AIInsights;