from openai import OpenAI
from typing import List, Dict, Optional
import json
from datetime import datetime


class UserResearchPlatform:
    def __init__(self, api_key: str):
        """Initialize the platform with OpenAI API key."""
        self.client = OpenAI(api_key=api_key)
        self.conversation_history = []
        self.project_info = {}
        self.current_question = None

    def start_project(self) -> None:
        """Initialize a new research project by gathering basic information."""
        print("\n=== AI-Powered User Research Platform ===\n")

        self.project_info['project_name'] = input("What is your project name? ")
        print("\nProject Goals:")
        print("1. Discovery (Understanding user problems and needs)")
        print("2. Improvement (Validating existing solution)")
        goal_choice = input("Select your project goal (1/2): ")
        self.project_info['goal'] = "Discovery" if goal_choice == "1" else "Improvement"
        self.project_info['target_audience'] = input("\nDescribe your target audience: ")

    def generate_next_question(self) -> str:
        """Generate the next question based on conversation history."""
        prev_questions = [entry['question'] for entry in self.conversation_history]
        mom_test_prompt = f"""
        You are interviewing a {self.project_info['target_audience']} about {self.project_info['project_name']}.
        Goal: {self.project_info['goal']}

        Previous questions asked: {prev_questions if prev_questions else 'None'}

        Generate ONE engaging interview question following The Mom Test principles:
        1. Start with "Tell me about..." or "Walk me through..."
        2. Focus on their daily life and actual experiences
        3. Avoid any mention of solutions or hypotheticals
        4. Make it specific to their role and context

        The question should help understand their workflow, challenges, and actual behaviors.
        Do not ask about the project or potential solutions.

        Return only the question, nothing else.
        """

        print(f"Generating question with prompt:\n{mom_test_prompt}")  # Debug log

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system",
                     "content": "You are an expert user researcher following The Mom Test principles."},
                    {"role": "user", "content": mom_test_prompt}
                ],
                temperature=0.7
            )
            question = response.choices[0].message.content.strip()
            print(f"Generated question: {question}")  # Debug log
            self.current_question = question
            return question
        except Exception as e:
            print(f"Error generating question: {e}")  # Debug log
            return None

    def _get_focus_area(self, question_count: int) -> str:
        """Get the focus area based on the conversation stage."""
        if question_count == 0:
            return """
            Initial Question:
            - Understand their daily workflow
            - Get them talking about their actual experiences
            - Build rapport and set comfortable tone
            """
        elif question_count == 1:
            return """
            Second Question:
            - Dig into specific challenges mentioned
            - Focus on concrete examples
            - Understand their current process
            """
        elif question_count == 2:
            return """
            Third Question:
            - Explore workarounds they've developed
            - Understand impact of challenges
            - Get specific examples of frustrated moments
            """
        else:
            return """
            Follow-up Questions:
            - Dig deeper into interesting areas mentioned
            - Get specific examples of their experiences
            - Understand their decision-making process
            """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": mom_test_prompt}],
                temperature=0.7
            )
            question = response.choices[0].message.content.strip()
            self.current_question = question
            return question
        except Exception as e:
            print(f"Error generating question: {e}")
            return None

    def _format_conversation_history(self) -> str:
        """Format conversation history for context."""
        if not self.conversation_history:
            return "No previous conversation."

        formatted = []
        for entry in self.conversation_history:
            formatted.append(f"Q: {entry['question']}")
            formatted.append(f"A: {entry['response']}")

        return "\n".join(formatted)

    def analyze_interview(self, responses: List[Dict]) -> Dict:
        """Analyze the interview responses and conduct market research."""
        analysis_prompt = f"""
        Analyze these user research interview responses with a focus on validating real business opportunities.

        Project Context:
        - Project: {self.project_info['project_name']}
        - Goal: {self.project_info['goal']}
        - Target Audience: {self.project_info['target_audience']}

        Full Conversation:
        {self._format_conversation_history()}

        Provide a critical analysis covering:

        1. Problem Validation:
           - Specific problem identified (with examples from interview)
           - Problem severity (frequency, impact, urgency)
           - Current workarounds being used
           - Cost (time/money) of the problem

        2. Market Analysis:
           - Existing companies solving similar problems (be specific with names)
           - Their current solutions and approaches
           - Known limitations or gaps in their solutions
           - Why users aren't adopting these solutions (from interview evidence)

        3. Total Addressable Market:
           - Global market size with specific numbers
           - Regional breakdown and growth projections
           - Market segments and their sizes
           - Include reliable sources

        4. Opportunity Assessment:
           - Clear evidence for/against market opportunity
           - Potential differentiators based on user needs
           - Critical features needed to succeed
           - Barriers to adoption that must be addressed

        5. Recommendations:
           - Specific differentiators to build
           - Features to prioritize
           - Risks to mitigate
           - Next areas to investigate

        Requirements:
        - Include actual company names and solutions
        - Cite specific examples from the interview
        - Be critical and realistic about opportunities
        - Focus on evidence, not speculation
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.7
            )
            return {"analysis": response.choices[0].message.content.strip()}
        except Exception as e:
            print(f"Error analyzing interview: {e}")
            return {"analysis": "Analysis failed due to error"}

    def save_results(self, analysis: Dict) -> None:
        """Save the interview responses and analysis."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"interview_{timestamp}.json"

        results = {
            "project_info": self.project_info,
            "conversation_history": self.conversation_history,
            "analysis": analysis["analysis"]
        }

        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to {filename}")