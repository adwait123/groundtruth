from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from user_research_platform import UserResearchPlatform
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class ProjectInfo(BaseModel):
    project_name: str
    goal: str
    target_audience: str


class ResponseModel(BaseModel):
    response: str


# Store active research sessions
research_sessions = {}


@app.post("/api/start-project")
async def start_project(project_info: ProjectInfo):
    try:
        # Get API key from environment
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not found")

        # Initialize platform
        platform = UserResearchPlatform(api_key)

        # Set project info
        platform.project_info = {
            "project_name": project_info.project_name,
            "goal": project_info.goal,
            "target_audience": project_info.target_audience
        }

        # Generate first question
        question = platform.generate_next_question()
        if not question:
            raise HTTPException(status_code=500, detail="Failed to generate question")

        # Create session ID
        session_id = f"{project_info.project_name.lower().replace(' ', '_')}_{len(research_sessions)}"
        research_sessions[session_id] = platform

        return {
            "session_id": session_id,
            "question": question
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/submit-response/{session_id}")
async def submit_response(session_id: str, response: ResponseModel):
    try:
        platform = research_sessions.get(session_id)
        if not platform:
            raise HTTPException(status_code=404, detail="Session not found")

        # Save response
        platform.conversation_history.append({
            "question": platform.current_question,
            "response": response.response
        })

        # Generate next question
        next_question = platform.generate_next_question()
        if not next_question:
            raise HTTPException(status_code=500, detail="Failed to generate question")

        return {
            "question": next_question,
            "can_finish": len(platform.conversation_history) >= 2
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/{session_id}")
async def analyze_interview(session_id: str):
    try:
        platform = research_sessions.get(session_id)
        if not platform:
            raise HTTPException(status_code=404, detail="Session not found")

        # Analyze responses
        analysis = platform.analyze_interview(platform.conversation_history)

        # Save results
        platform.save_results(analysis)

        # Clean up session
        del research_sessions[session_id]

        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    print("Starting server...")
    print("Make sure your .env file contains OPENAI_API_KEY")
    uvicorn.run(app, host="0.0.0.0", port=8000)