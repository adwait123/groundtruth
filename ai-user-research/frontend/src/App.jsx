import React, { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import API_URL from './config'

const steps = [
  { id: 'setup', title: 'Project Setup' },
  { id: 'interview', title: 'Interview' },
  { id: 'analysis', title: 'Analysis' }
]

function App() {
  const [currentStep, setCurrentStep] = useState('setup')
  const [projectInfo, setProjectInfo] = useState({
    projectName: '',
    goal: '',
    targetAudience: ''
  })
  const [sessionId, setSessionId] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentResponse, setCurrentResponse] = useState('')
  const [responses, setResponses] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleProjectSubmit = async () => {
    if (!projectInfo.projectName || !projectInfo.goal || !projectInfo.targetAudience) {
      setError('Please fill in all fields')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log('Sending project info:', projectInfo) // Debug log
console.log('API URL:', API_URL); // Debug log

      const response = await fetch('${API_URL}/api/start-project', {
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
      setCurrentStep('interview')
    } catch (err) {
      setError(err.message)
      console.error('Error details:', err) // Debug log
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitResponse = async () => {
    if (!currentResponse.trim()) {
      setError('Please provide a response')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/api/submit-response/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: currentResponse }),
      })

      if (!response.ok) throw new Error('Failed to submit response')

      const data = await response.json()
      setResponses([...responses, { question: currentQuestion, response: currentResponse }])
      setCurrentQuestion(data.question)
      setCurrentResponse('')

      if (data.can_finish && responses.length >= 4) {
        if (window.confirm('Would you like to finish the interview and see the analysis?')) {
          handleAnalysis()
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalysis = async () => {
    try {
      setCurrentStep('analysis')
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/api/analyze/${sessionId}`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to analyze interview')

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
            <h2 className="text-lg font-medium mb-4 text-slate-100">Interview</h2>
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
            <h2 className="text-lg font-medium mb-4 text-slate-100">Analysis Results</h2>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto" />
                <p className="mt-4 text-slate-400">Analyzing responses...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                <div className="bg-slate-700 p-4 rounded border border-slate-600">
                  <pre className="whitespace-pre-wrap text-sm text-slate-300">
                    {analysis.analysis}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-red-400">No analysis available. Please try again.</div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
