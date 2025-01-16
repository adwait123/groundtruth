import React, { useState } from 'react'
import { ChevronRight } from 'lucide-react'

const steps = [
  { id: 'setup', title: 'Project Setup' },
  { id: 'interview', title: 'Interview' },
  { id: 'analysis', title: 'Analysis' }
]

const SentimentIcon = ({ type }) => {
  const getColor = () => {
    switch (type) {
      case '😤': return 'text-red-400';
      case '😊': return 'text-green-400';
      case '😕': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getColor()} bg-opacity-20 mr-2`}>
      {type}
    </span>
  );
};

const AnalysisLoading = () => (
  <div className="min-h-[400px] flex flex-col items-center justify-center space-y-8 bg-slate-800/50 rounded-lg p-8">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full animate-spin">
        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 rounded-full animate-spin"
             style={{ animationDuration: '1s', animationDirection: 'reverse' }} />
      </div>
    </div>
    <div className="space-y-6 w-full max-w-md">
      <div>
        <div className="flex items-center space-x-3">
          <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
          <p className="text-slate-300">Analyzing interview responses...</p>
        </div>
        <div className="mt-2 h-2 bg-slate-700 rounded overflow-hidden">
          <div className="h-full w-1/3 bg-blue-500 rounded animate-pulse" />
        </div>
      </div>
      <div>
        <div className="flex items-center space-x-3">
          <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"
               style={{ animationDelay: '0.2s' }} />
          <p className="text-slate-300">Identifying key insights...</p>
        </div>
        <div className="mt-2 h-2 bg-slate-700 rounded overflow-hidden">
          <div className="h-full w-1/2 bg-blue-500 rounded animate-pulse"
               style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
      <div>
        <div className="flex items-center space-x-3">
          <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"
               style={{ animationDelay: '0.4s' }} />
          <p className="text-slate-300">Generating recommendations...</p>
        </div>
        <div className="mt-2 h-2 bg-slate-700 rounded overflow-hidden">
          <div className="h-full w-2/3 bg-blue-500 rounded animate-pulse"
               style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  </div>
)

const AnalysisResults = ({ analysis }) => {
  const sections = analysis.split('\n\n').filter(Boolean);

  const getSentimentColor = (sentiment) => {
    const colors = {
      'Positive': 'bg-green-500/10 text-green-400',
      'Negative': 'bg-red-500/10 text-red-400',
      'Neutral': 'bg-yellow-500/10 text-yellow-400'
    };
    return colors[sentiment] || 'bg-blue-500/10 text-blue-400';
  };

  const getIcon = (title) => {
    switch (title.toLowerCase()) {
      case 'key findings':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />;
      case 'sentiment analysis':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'market opportunity':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
      case 'action items':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />;
      default:
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
    }
  };


  const renderContent = (line, i) => {
    if (!line.trim()) return null;

    if (line.startsWith('-')) {
      const sentimentMatch = line.match(/\[(Positive|Negative|Neutral)\]/);
      const sentiment = sentimentMatch ? sentimentMatch[1] : null;
      const text = sentiment ? line.replace(/\[.*?\]/, '').slice(1).trim() : line.slice(1).trim();

      return (
        <div key={i} className="flex items-start space-x-3 p-2 rounded hover:bg-slate-800/40 transition-colors">
          {sentiment && (
            <div className={`px-2 py-1 rounded ${getSentimentColor(sentiment)} text-xs font-medium`}>
              {sentiment}
            </div>
          )}
          <div className="mt-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          </div>
          <span className="text-slate-300 flex-1">{text}</span>
        </div>
      );
    }

    return (
      <p key={i} className="text-slate-400 pl-6">
        {line.trim()}
      </p>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {getIcon('default')}
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-100">Analysis Results</h2>
      </div>

      {sections.map((section, idx) => {
        const [title, ...content] = section.split('\n');
        const sectionTitle = title.replace(/^\d+\.\s*/, '').replace(/:$/, '');

        return (
          <div key={idx} className="bg-slate-800/40 rounded-lg border border-slate-700/50 overflow-hidden hover:bg-slate-800/60 transition-all duration-200">
            <div className="flex items-center p-4 border-b border-slate-700/50 bg-slate-800/60">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {getIcon(sectionTitle)}
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-100">{sectionTitle}</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {content.map((line, i) => renderContent(line, i))}
            </div>
          </div>
        );
      })}
    </div>
  );
};


function App() {
  const [currentStep, setCurrentStep] = useState('setup')
  const [projectInfo, setProjectInfo] = useState({
    projectName: '',
    goal: '',
    targetAudience: ''
  })
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesis = window.speechSynthesis;
  const [sessionId, setSessionId] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentResponse, setCurrentResponse] = useState('')
  const [responses, setResponses] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)


   const speakQuestion = async (text) => {
         const apiKey = localStorage.getItem('openai_api_key');
  try {
    setIsSpeaking(true);
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('openai_api_key')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
        input: text
      })
    });

    const audioBlob = await response.blob();
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.onended = () => setIsSpeaking(false);
    audio.play();
  } catch (error) {
    console.error('Speech generation failed:', error);
    setIsSpeaking(false);
  }
};

  const handleProjectSubmit = async () => {
    if (!projectInfo.projectName || !projectInfo.goal || !projectInfo.targetAudience) {
      setError('Please fill in all fields')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('http://localhost:8000/api/start-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: projectInfo.projectName,
          goal: projectInfo.goal,
          target_audience: projectInfo.targetAudience
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to start project')
      }

      const data = await response.json()
      setSessionId(data.session_id)
      setCurrentQuestion(data.question)
      localStorage.setItem('openai_api_key', data.api_key);  // Store key
      setCurrentStep('interview')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

 // App.jsx handleSubmitResponse update
const handleSubmitResponse = async () => {
  try {
    setIsLoading(true);
    const response = await fetch(`http://localhost:8000/api/submit-response/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: currentResponse })
    });

    const data = await response.json();

    if (data.status === 'reschedule') {
      setCurrentQuestion(data.question);
      setCurrentResponse('');
      return;
    }

    if (data.status === 'ended') {
      setCurrentStep('analysis');
      setIsLoading(true);
      setAnalysis(data.analysis);
      return;
    }

    setResponses([...responses, { question: currentQuestion, response: currentResponse }]);
    setCurrentQuestion(data.question);
    setCurrentResponse('');
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
}

  const handleAnalysis = async () => {
    try {
      setCurrentStep('analysis')
      setIsLoading(true)
      setError(null)

      const response = await fetch(`http://localhost:8000/api/analyze/${sessionId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to analyze interview')
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-slate-100">
              AI Research Platform
            </h1>
            <div className="flex space-x-4">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`flex items-center ${
                    currentStep === step.id ? 'text-blue-400' : 'text-slate-500'
                  }`}
                >
                  <span className="text-sm">{step.title}</span>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
            {error}
          </div>
        )}

        {currentStep === 'setup' && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
            <h2 className="text-lg font-medium mb-6 text-slate-100">
              Project Setup
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectInfo.projectName}
                  onChange={(e) => setProjectInfo({ ...projectInfo, projectName: e.target.value })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Project Goal
                </label>
                <select
                  value={projectInfo.goal}
                  onChange={(e) => setProjectInfo({ ...projectInfo, goal: e.target.value })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100"
                >
                  <option value="">Select a goal</option>
                  <option value="discovery">Discovery</option>
                  <option value="improvement">Improvement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={projectInfo.targetAudience}
                  onChange={(e) => setProjectInfo({ ...projectInfo, targetAudience: e.target.value })}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your target audience"
                />
              </div>
              <button
                onClick={handleProjectSubmit}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors disabled:bg-blue-900 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Starting...' : 'Start Interview'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'interview' && (
         <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-medium text-slate-100">Interview</h2>
             <button
               onClick={() => speakQuestion(currentQuestion)}
               disabled={isSpeaking}
               className="p-2 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
             >
               {isSpeaking ? (
                 <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1V8a1 1 0 011-1h1.586l4.707-4.707C10.923 1.663 12 2.109 12 3v16c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                 </svg>
               ) : (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18 6a8 8 0 010 12" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1V8a1 1 0 011-1h1.586l4.707-4.707C10.923 1.663 12 2.109 12 3v16c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                 </svg>
               )}
             </button>
           </div>
           <div className="space-y-4">
             <p className="text-slate-300">{currentQuestion}</p>
             <textarea
               value={currentResponse}
               onChange={(e) => setCurrentResponse(e.target.value)}
               className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100 h-32 focus:ring-2 focus:ring-blue-500"
               placeholder="Type your response here..."
               disabled={isLoading}
             />
             <div className="flex justify-between">
               <button
                 onClick={handleAnalysis}
                 disabled={isLoading || responses.length < 2}
                 className="bg-slate-700 text-slate-300 py-2 px-4 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Finish Early
               </button>
               <button
                 onClick={handleSubmitResponse}
                 disabled={isLoading}
                 className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Next Question
               </button>
             </div>
           </div>
         </div>
        )}

        {currentStep === 'analysis' && (
  <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">

    <div className="transition-all duration-500 ease-in-out">
      {isLoading ? (
        <AnalysisLoading />
      ) : analysis ? (
        <AnalysisResults analysis={analysis.analysis} />
      ) : (
        <div className="min-h-[400px] flex items-center justify-center text-red-400">
          <p className="text-center">No analysis available yet.<br/>Please complete the interview first.</p>
        </div>
      )}
    </div>
  </div>
)}
      </main>
    </div>
  )
}

export default App