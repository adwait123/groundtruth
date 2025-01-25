import React, { useState, useEffect } from 'react';
import { ChevronRight, Mic, MessageSquare, Send, Loader, BarChart, Target, Lightbulb, AlertTriangle } from 'lucide-react';
import API_URL from './config'



const steps = [
  { id: 'setup', title: 'Project Setup' },
  { id: 'mode-select', title: 'Interview Mode' },
  { id: 'interview', title: 'Interview' },
  { id: 'analysis', title: 'Analysis' }
];

function App() {
  const [currentStep, setCurrentStep] = useState('setup');
  const [projectInfo, setProjectInfo] = useState({
    projectName: '',
    goal: '',
    targetAudience: '',
    discoveryType: '',
    domain: '',
    userType: '',
    specificGoal: '',
    productName: '',
    productContext: ''

  });


   // Interview states - removed duplicate interviewMode declaration
  const [interviewMode, setInterviewMode] = useState('chat')
  const [sessionId, setSessionId] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentResponse, setCurrentResponse] = useState('')
  const [responses, setResponses] = useState([])
  const [showWrapUpOptions, setShowWrapUpOptions] = useState(false)

  // Audio states
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('');
  const speechSynthesis = window.speechSynthesis

  // Analysis states
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [productDoc, setProductDoc] = useState(null);

   const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }
    setProductDoc(file);
    setError(null);
  };


const AnalysisResults = ({ analysis }) => {
  const sections = analysis.split('\n\n').filter(Boolean);

  const getIcon = (title) => {
    switch (title.toLowerCase()) {
      case 'key findings':
        return <Target className="w-5 h-5" />;
      case 'sentiment analysis':
        return <MessageSquare className="w-5 h-5" />;
      case 'market opportunity':
        return <BarChart className="w-5 h-5" />;
      case 'action items':
        return <Lightbulb className="w-5 h-5" />;
      case 'recommendations':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-green-500/10 text-green-400';
      case 'Negative':
        return 'bg-red-500/10 text-red-400';
      case 'Neutral':
        return 'bg-yellow-500/10 text-yellow-400';
      default:
        return 'bg-blue-500/10 text-blue-400';
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
      {sections.map((section, idx) => {
        const [title, ...content] = section.split('\n');
        const sectionTitle = title.replace(/^\d+\.\s*/, '').replace(/:$/, '');

        return (
          <div key={idx} className="bg-slate-800/40 rounded-lg border border-slate-700/50 overflow-hidden hover:bg-slate-800/60 transition-all duration-200">
            <div className="flex items-center p-4 border-b border-slate-700/50 bg-slate-800/60">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  {getIcon(sectionTitle)}
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
}


  
  const handleProjectSubmit = async () => {
  if (!projectInfo.projectName || !projectInfo.goal || !projectInfo.targetAudience) {
    setError('Please fill in all fields');
    return;
  }

  if (projectInfo.goal === 'improvement' && !productDoc) {
    setError('Please upload product documentation for improvement projects');
    return;
  }

  try {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('project_name', projectInfo.projectName);
    formData.append('goal', projectInfo.goal);
    formData.append('target_audience', projectInfo.targetAudience);
    
    if (projectInfo.goal === 'diagnostic') {

        formData.append('product_name', projectInfo.productName);
      formData.append('product_context', projectInfo.productContext);
      formData.append('improvement_objective', projectInfo.improvementObjective);
      if (productDoc) {
        formData.append('product_doc', productDoc);
      }
    }
    const response = await fetch(`${API_URL}/api/start-project`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to start project');
    }

    setSessionId(data.session_id);
    setCurrentQuestion(data.question);
    localStorage.setItem('openai_api_key', data.api_key);
    setCurrentStep('mode-select');
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

 const checkSession = () => {
  if (!sessionId) {
    setError('Session expired. Starting new session...');
    setTimeout(() => setCurrentStep('setup'), 2000);
    return false;
  }
  return true;
};

const handleSubmitResponse = async () => {
  console.log('handleSubmitResponse called'); // Debug logging

  if (!currentResponse.trim()) {
    setError('Please provide a response');
    return;
  }

  try {
    setIsLoading(true);
    setError(null);

    const response = await fetch(`${API_URL}/api/submit-response/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ response: currentResponse }),
    });

    const data = await response.json();
    setResponses([...responses, { question: currentQuestion, response: currentResponse }]);
    setCurrentQuestion(data.question);
    setCurrentResponse('');

  } catch (err) {
    console.error('Error submitting response:', err); // Debug logging
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
}

// Add speech recognition setup
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;

// Add speech recognition handlers
useEffect(() => {
  recognition.onresult = (event) => {
    const current = event.resultIndex;
    const transcript = event.results[current][0].transcript;
    setTranscript(transcript);
    setCurrentResponse(transcript);
  };

  recognition.onend = () => {
    setIsListening(false);
  };
}, []);

// Add toggle listening function
const toggleListening = () => {
  if (isListening) {
    recognition.stop();
    setIsListening(false);
  } else {
    recognition.start();
    setIsListening(true);
  }
};



const handleAnalysis = async () => {
  if (!checkSession()) return;
  try {
    setIsLoading(true);
    setError(null);
    setCurrentStep('analysis');

    const response = await fetch(`${API_URL}/api/analyze/${sessionId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      if (response.status === 404) {
        setError('Session expired. Please start a new interview.');
        setTimeout(() => setCurrentStep('setup'), 2000);
        return;
      }
      throw new Error('Failed to analyze interview');
    }

    const data = await response.json();
    setAnalysis(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
}

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

const speakQuestion = async (text) => {
  try {
    setIsSpeaking(true);
    const apiKey = localStorage.getItem('openai_api_key');
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'shimmer', // Using shimmer for more natural voice
        input: text
      })
    });

    if (!response.ok) throw new Error('Speech generation failed');

    const audioBlob = await response.blob();
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.onended = () => setIsSpeaking(false);
    await audio.play();
  } catch (error) {
    console.error('Speech generation failed:', error);
    setIsSpeaking(false);
  }
};

  // Render functions for different modes
  const renderModeSelection = () => (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
      <h2 className="text-lg font-medium mb-6 text-slate-100">Choose Interview Mode (User view)</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            setInterviewMode('voice');
            setCurrentStep('interview');
          }}
          className="flex flex-col items-center p-6 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
        >
          <Mic className="w-8 h-8 mb-2 text-blue-400" />
          <span className="text-slate-100">Voice Interview</span>
        </button>
        <button
          onClick={() => {
            setInterviewMode('chat');
            setCurrentStep('interview');
          }}
          className="flex flex-col items-center p-6 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
        >
          <MessageSquare className="w-8 h-8 mb-2 text-green-400" />
          <span className="text-slate-100">Chat Interview</span>
        </button>
      </div>
    </div>
  );

  const renderVoiceInterview = () => (
  <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
    <div className="flex flex-col items-center space-y-6">
      <button onClick={() => {
                void speakQuestion(currentQuestion);
              }}
              disabled={isSpeaking}
              className="p-2 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
        {isSpeaking ? (
          <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1V8a1 1 0 011-1h1.586l4.707-4.707C10.923 1.663 12 2.109 12 3v16c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18 6a8 8 0 010 12" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1V8a1 1 0 011-1h1.586l4.707-4.707C10.923 1.663 12 2.109 12 3v16c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      <p className="text-slate-300 text-center text-lg">{currentQuestion}</p>

      <textarea
        value={currentResponse}
        onChange={(e) => setCurrentResponse(e.target.value)}
        className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100 h-32 focus:ring-2 focus:ring-blue-500"
        placeholder="Type your response here..."
        disabled={isLoading}
      />
      <div className="flex justify-between w-full">
        {showWrapUpOptions ? (
          <>
            <button
              onClick={handleAnalysis}
              disabled={isLoading}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Interview
            </button>
            <button
              onClick={() => setShowWrapUpOptions(false)}
              className="bg-slate-700 text-slate-300 py-2 px-4 rounded hover:bg-slate-600"
            >
              Continue Interview
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowWrapUpOptions(true)}
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
          </>
        )}
      </div>
    </div>
  </div>
)


  const WrapUpOptions = ({ onContinue, onFinish, onSchedule }) => (
  <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
    <p className="text-slate-300 mb-3">Would you like to:</p>
    <div className="space-x-3">
      <button
        onClick={onContinue}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Continue Chatting
      </button>
      <button
        onClick={onFinish}
        className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
      >
        See Analysis
      </button>
      <button
        onClick={onSchedule}
        className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
      >
        Schedule Another Time
      </button>
    </div>
  </div>
);
const handleKeyPress = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (currentResponse.trim() && !isLoading) {
      handleSubmitResponse();
      console.log('Message sent via Enter key'); // Adding logging to debug
    }
  }
};
 const renderChatInterview = () => (
  <div className="bg-slate-800/40 p-6 rounded-lg border border-slate-700/50">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-medium text-slate-100">Interview Chat (User View)</h2>
      <button
        onClick={() => setInterviewMode('voice')}
        className="p-2 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
      >
        <Mic className="w-5 h-5" />
      </button>
    </div>

    {/* Chat Messages */}
    <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
      {responses.map((exchange, index) => (
        <div key={index} className="space-y-2">
          {/* AI Question */}
          <div className="flex items-start">
            <div className="bg-slate-700/50 rounded-lg p-3 max-w-[80%]">
              <p className="text-slate-300">{exchange.question}</p>
            </div>
          </div>
          {/* User Response */}
          <div className="flex items-start justify-end">
            <div className="bg-blue-600/30 rounded-lg p-3 max-w-[80%]">
              <p className="text-slate-200">{exchange.response}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Current Question */}
      {currentQuestion && (
        <div className="flex items-start">
          <div className="bg-slate-700/50 rounded-lg p-3 max-w-[80%]">
            <p className="text-slate-300">{currentQuestion}</p>
          </div>
        </div>
      )}
    </div>

    {/* Message Input */}
    <div className="flex items-end space-x-2">
      <textarea
  value={currentResponse}
  onChange={(e) => setCurrentResponse(e.target.value)}
  onKeyDown={handleKeyPress}
  className="flex-1 p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 h-20 focus:ring-2 focus:ring-blue-500/50"
  placeholder="Type your message and press Enter to send..."
  disabled={isLoading}
  aria-label="Chat message input"
/>
      <button
        onClick={handleSubmitResponse}
        disabled={isLoading || !currentResponse.trim()}
        className="p-3 bg-blue-600/90 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>

    {responses.length >= 2 && (
      <button
        onClick={handleAnalysis}
        className="mt-4 w-full bg-green-600/90 text-white py-2 px-4 rounded-lg hover:bg-green-700"
      >
        Finish Interview & See Analysis
      </button>
    )}
  </div>
)

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
    <h2 className="text-lg font-medium mb-6 text-slate-100">Project Setup (Business View)</h2>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Project Name
        </label>
        <input
          type="text"
          value={projectInfo.projectName}
          onChange={(e) => setProjectInfo({ ...projectInfo, projectName: e.target.value })}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100"
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
          <option value="discovery">Exploratory Research (Discover unmet needs, inefficiencies, and latent opportunities)</option>
          <option value="diagnostic">Diagnostic Research (Identify pain points, blockers, and frustrations with a specific product/feature)</option>
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
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100"
          placeholder="Describe your target audience"
        />
      </div>

{projectInfo.goal === 'diagnostic' && (
  <div className="mt-4 space-y-4">
    <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={projectInfo.productName || ''}
              onChange={(e) => setProjectInfo({ ...projectInfo, productName: e.target.value })}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100"
              placeholder="Enter product name"
            />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        Improvement Objective
      </label>
      <textarea
        value={projectInfo.improvementObjective}
        onChange={(e) => setProjectInfo({ ...projectInfo, improvementObjective: e.target.value })}
        className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100 h-32 resize-none"
        placeholder="Describe what you're trying to improve. For example:&#13;&#10;- Specific features to enhance&#13;&#10;- Performance areas to optimize&#13;&#10;- User experience goals"
      />
    </div>
    <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Product Context
            </label>
            <textarea
              value={projectInfo.productContext || ''}
              onChange={(e) => setProjectInfo({ ...projectInfo, productContext: e.target.value })}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100 h-32"
              placeholder="Describe your product, its features, and current state..."
            />
     </div>

    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        Product Documentation (Optional)
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md hover:border-blue-500 transition-colors">
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-slate-400 justify-center">
            <label className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400">
              <span>Upload a file</span>
              <input
                type="file"
                className="sr-only"
                onChange={handleFileUpload}
                accept=".txt,.md,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.pptx"
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-slate-400">
            PDF, DOCX, TXT, MD, or PPTX up to 10MB
          </p>
        </div>
      </div>
      {productDoc && (
        <div className="mt-2 flex items-center text-sm text-green-400">
          <svg
            className="flex-shrink-0 mr-1.5 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {productDoc.name}
        </div>
      )}
    </div>
  </div>
)}

<button
  onClick={handleProjectSubmit}
  disabled={isLoading || (projectInfo.goal === 'diagnostic' && (!projectInfo.productName || !projectInfo.productContext || !projectInfo.improvementObjective))}
  className={`w-full py-2 px-4 rounded transition-colors ${
    isLoading || (projectInfo.goal === 'diagnostic' && (!projectInfo.productName || !projectInfo.productContext || !projectInfo.improvementObjective))
      ? 'bg-blue-600/50 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700'
  } text-white`}
>
  {isLoading ? 'Starting...' : 'Continue'}
</button>
    </div>
  </div>
)}

        {currentStep === 'mode-select' && renderModeSelection()}


        {currentStep === 'interview' && (
          interviewMode === 'voice' ? renderVoiceInterview() : renderChatInterview()
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
  );
}

export default App;
