import React, { useState } from 'react';
import { ChevronDown, BarChart, Target, Lightbulb } from 'lucide-react';



const SentimentChart = ({ stats }) => (
  <div className="flex items-center justify-center space-x-4">
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 36 36" className="transform -rotate-90">
        {/* Positive */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeDasharray={`${(stats.positive/stats.total)*100}, 100`}
        />
        {/* Negative */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#EF4444"
          strokeWidth="3"
          strokeDasharray={`${(stats.negative/stats.total)*100}, 100`}
          strokeDashoffset={`${-((stats.positive/stats.total)*100)}`}
        />
        {/* Neutral */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="3"
          strokeDasharray={`${(stats.neutral/stats.total)*100}, 100`}
          strokeDashoffset={`${-((stats.positive + stats.negative)/stats.total)*100}`}
        />
      </svg>
    </div>
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
        <span className="text-slate-300">Positive ({stats.positive})</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
        <span className="text-slate-300">Negative ({stats.negative})</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
        <span className="text-slate-300">Neutral ({stats.neutral})</span>
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ title, description, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="p-4 bg-slate-800/60 rounded-lg border border-slate-700/50 hover:bg-slate-800/80
               transition-all duration-200 text-left group"
  >
    <div className="flex items-start space-x-3">
      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-medium text-slate-200 mb-1">{title}</h4>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </div>
  </button>
);

export const AnalysisResults = ({ analysis }) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['Summary']));
  const sections = analysis.split('\n\n').filter(Boolean);

  const getSentimentStats = () => {
    let positive = 0, negative = 0, neutral = 0;
    sections.forEach(section => {
      section.split('\n').forEach(line => {
        if (line.includes('[Positive]')) positive++;
        if (line.includes('[Negative]')) negative++;
        if (line.includes('[Neutral]')) neutral++;
      });
    });
    const total = positive + negative + neutral;
    return { positive, negative, neutral, total };
  };

  const stats = getSentimentStats();
  const keyFindings = sections.find(s => s.includes('Key Findings'))?.split('\n').slice(1) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Summary Card */}
      <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden backdrop-blur-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">Analysis Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-4">Sentiment Distribution</h3>
              <SentimentChart stats={stats} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-4">Key Takeaways</h3>
              <div className="space-y-3">
                {keyFindings.slice(0, 3).map((finding, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="p-1 rounded-full bg-blue-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    </div>
                    <span className="text-slate-300 text-sm">{finding.replace(/^-\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickActionCard
          title="Start Survey"
          description="Begin collecting quantitative data"
          icon={BarChart}
          onClick={() => console.log('Start Survey')}
        />
        <QuickActionCard
          title="Analyze Competition"
          description="Review market landscape"
          icon={Target}
          onClick={() => console.log('Analyze Competition')}
        />
        <QuickActionCard
          title="Generate Solutions"
          description="Brainstorm potential features"
          icon={Lightbulb}
          onClick={() => console.log('Generate Solutions')}
        />
      </div>

      {/* Detailed Sections */}
      {sections.map((section, idx) => {
        const [title, ...content] = section.split('\n');
        const sectionTitle = title.replace(/^\d+\.\s*/, '').replace(/:$/, '');
        const isExpanded = expandedSections.has(sectionTitle);

        return (
          <div key={idx} className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden">
            <button
              onClick={() => {
                const newExpanded = new Set(expandedSections);
                isExpanded ? newExpanded.delete(sectionTitle) : newExpanded.add(sectionTitle);
                setExpandedSections(newExpanded);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-800/60 transition-colors"
            >
              <h3 className="text-lg font-medium text-slate-100">{sectionTitle}</h3>
              <ChevronDown className={`w-5 h-5 text-slate-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isExpanded && (
              <div className="p-5 space-y-3 border-t border-slate-700/50">
                {content.map((line, i) => {
                  if (!line.trim()) return null;

                  if (line.includes('[Positive]')) {
                    return (
                      <div key={i} className="flex items-start space-x-3 p-2 rounded bg-green-500/5 border border-green-500/10">
                        <span className="text-green-400">●</span>
                        <span className="text-slate-300">{line.replace(/\[Positive\]/, '').trim()}</span>
                      </div>
                    );
                  }

                  if (line.includes('[Negative]')) {
                    return (
                      <div key={i} className="flex items-start space-x-3 p-2 rounded bg-red-500/5 border border-red-500/10">
                        <span className="text-red-400">●</span>
                        <span className="text-slate-300">{line.replace(/\[Negative\]/, '').trim()}</span>
                      </div>
                    );
                  }

                  if (line.includes('[Neutral]')) {
                    return (
                      <div key={i} className="flex items-start space-x-3 p-2 rounded bg-yellow-500/5 border border-yellow-500/10">
                        <span className="text-yellow-400">●</span>
                        <span className="text-slate-300">{line.replace(/\[Neutral\]/, '').trim()}</span>
                      </div>
                    );
                  }

                  if (line.startsWith('-')) {
                    return (
                      <div key={i} className="flex items-start space-x-3 p-2 rounded hover:bg-slate-800/40 transition-colors">
                        <div className="mt-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        </div>
                        <span className="text-slate-300">{line.slice(1).trim()}</span>
                      </div>
                    );
                  }

                  return (
                    <p key={i} className="text-slate-400 pl-6">{line.trim()}</p>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};



export default AnalysisResults;

