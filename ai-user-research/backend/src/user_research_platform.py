from openai import OpenAI
from typing import List, Dict, Optional
import json
from datetime import datetime
import numpy as np
import tiktoken
from sklearn.metrics.pairwise import cosine_similarity
import io  # Add this import


class UserResearchPlatform:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
        self.conversation_history = []
        self.project_info = {}
        self.current_question = None
        self.doc_chunks = []
        self.chunk_embeddings = []
        self.embedding_model = "text-embedding-3-small"
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        self.product_context = None  # Add this line


    def process_document(self, document_text: str):
        # Split document into chunks with overlap
        chunk_size = 1000
        overlap = 200
        chunks = self._create_chunks(document_text, chunk_size, overlap)

        # Store chunks
        self.doc_chunks = chunks

        # Generate embeddings for chunks
        self.chunk_embeddings = self._generate_embeddings(chunks)

    def _create_chunks(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start = end - overlap
        return chunks

    def _generate_embeddings(self, chunks: List[str]) -> List[List[float]]:
        """Generate embeddings for text chunks using OpenAI"""
        try:
            embeddings = []
            for chunk in chunks:
                response = self.client.embeddings.create(
                    input=chunk,
                    model="text-embedding-ada-002"
                )
                embeddings.append(response.data[0].embedding)
            return embeddings
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            return []

    def set_product_context(self, document_text: str) -> bool:
        """Set product context by processing the document"""
        try:
            # Split document into chunks with overlap
            chunk_size = 1000
            overlap = 200
            self.doc_chunks = self._create_chunks(document_text, chunk_size, overlap)

            # Generate embeddings for chunks
            self.chunk_embeddings = self._generate_embeddings(self.doc_chunks)

            # Store the full document text as product context
            self.product_context = document_text

            print(f"Document processed: {len(self.doc_chunks)} chunks created")
            return True
        except Exception as e:
            print(f"Error processing document: {e}")
            return False

    def _get_relevant_chunks(self, query: str, top_k: int = 2) -> List[str]:
        # Get embedding for query
        query_embedding = self.client.embeddings.create(
            model=self.embedding_model,
            input=query
        ).data[0].embedding

        # Calculate similarities
        similarities = cosine_similarity(
            [query_embedding],
            self.chunk_embeddings
        )[0]

        # Get top k chunks
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        return [self.doc_chunks[i] for i in top_indices]

    def generate_next_question(self) -> str:
        conversation = self._format_conversation_history()
        one_word_count = sum(1 for r in self.conversation_history if len(r['response'].split()) == 1)
        conversation_stage = len(self.conversation_history)

        # Get last 3 responses to check quality
        recent_responses = self.conversation_history[-3:] if len(
            self.conversation_history) >= 3 else self.conversation_history
        low_quality_count = sum(1 for r in recent_responses if len(r['response'].split()) < 3)

        # Handle short responses first
        if self.conversation_history and len(self.conversation_history[-1]['response'].split()) < 5:
            return self._generate_elaboration_question(conversation)

        # Get base prompt based on project goal and conversation stage
        base_prompt = self._get_base_prompt(conversation, conversation_stage)

        # Add quality metrics and style guide
        prompt = self._add_quality_metrics_and_style(base_prompt, low_quality_count, one_word_count)

        try:
            return self._make_gpt_call(prompt)
        except Exception as e:
            print(f"Error generating question: {e}")
            return None

    def _get_base_prompt(self, conversation: str, conversation_stage: int) -> str:
    """Get the appropriate base prompt based on project goal and conversation stage."""
    is_diagnostic = self.project_info['goal'] == 'diagnostic'
    is_first_question = conversation_stage == 0

        if is_diagnostic:
            objective = self.project_info.get('improvement_objective', '')
            relevant_chunks = self._get_relevant_chunks(conversation) if hasattr(self, 'doc_chunks') else []
            doc_context = "\n".join(relevant_chunks)
            product_context = self.product_context or self.project_info.get('product_context', '')
            product_name = self.project_info.get('product_name', '')

            return f"""
            ROLE: You are a professional research interviewer conducting diagnostic research to uncover insights about {product_name}. 
            Your goal is to identify user challenges, blockers, and opportunities for improvement.
            
            Objective: Your task is to explore the reasons behind the specific issue outlined in the  {objective} and gather actionable insights to improve the user experience. 
            You will use the {product_context} and/OR {doc_context} to ask smarter, context-aware questions and ensure the conversation stays focused on achieving the Objective.:

                        "Interviewing Users" by Steve Portigal (for effective interviewing techniques)
                        
                        "The Mom Test" by Rob Fitzpatrick (for avoiding biased questions and getting honest feedback)
                        
                        "Don't Make Me Think" by Steve Krug (for understanding usability and user frustration)
                        
                        "Thinking, Fast and Slow" by Daniel Kahneman (for understanding cognitive biases and decision-making)
                        
                        "Hooked" by Nir Eyal (for understanding user engagement and habit formation)
                        
                        "Lean UX" by Jeff Gothelf and Josh Seiden (for iterative, user-centered design)
                        
                        Insights from Nielsen Norman Group (NNG) on usability testing and user interviews.
            
            
                INPUTS:
                1. PRODUCT NAME: {product_name}
                2. PRODUCT CONTEXT: {product_context}
                3. OBJECTIVE: {objective}
                4. DOC CONTEXT: {doc_context}
            
             GUIDELINES:
                1. **Tone**: Use a friendly, conversational, and non-judgmental tone.
                2. **Context-Aware Questions**: Ask questions specific to {product_name} and its use cases. Example: "Can you describe a recent experience using {product_name} for [task]?"
                3. **Open-Ended Questions**: Avoid leading questions. Example: "What was your experience like the last time you used {product_name}?"
                4. **Probing for Depth**: Use the 5 Whys technique to uncover root causes. Example: "Why do you think that happened?"
                5. **Avoid Bias**: Use neutral language. Example: "How do you feel about {product_name}’s performance?"
                6. **Focus on Behavior**: Ask about specific incidents, not hypotheticals. Example: "Can you walk me through the last time you encountered this issue?"
                7. **Active Listening**: Reflect and validate responses. Example: "It sounds like that was frustrating. Can you tell me more?"
            
            INTERVIEW STRUCTURE:
            1. Critical Incident (Q1-2)
            Example prompts:
            “Can you walk me through the last time you used {product_name} for [task]?”
            “Think back to when you last needed to [task]. What led you to use {product_name}, and how did it go?”
            “What triggered your use of {product_name} for [task], and what did you expect to achieve?”
            Goal: Capture the full context (what/when/how/why) and their goals during that incident.
            
            2. Deep Dive (Q3+)
            
            Explore problems they mention and ask for concrete examples.
            Understand the frequency and impact of the issues.
            Investigate workarounds or alternatives and their preferences.
            Leverage {product_context} to enrich the conversation.
            Use additional data where necessary to provide insights.
            
            
            RULES:
            Focus on specific incidents.
            Document complete stories.
            Probe for context and follow issues upstream.
            Record frequency and severity of challenges.
            
            Previous Conversation: {conversation}
            
                OUTPUT REQUIREMENTS:
                Generate one clear, natural question that:
                1. Aligns with the current stage and {objective}.
                2. Addresses missing signals (if any).
                3. Uses the user’s language and maintains flow.
                4. Digs deeper into product usage, barriers, or alternatives.
            
            Output: Conduct the interview as a natural conversation, 
            adapting your questions based on the user's responses. 
            Use the {product_context} to ask smarter, more relevant questions and ensure the conversation stays 
            focused on achieving the {objective}.  
    
            """
        else:
            # Original discovery case remains unchanged
            base_prompt = f"""
            You are having a friendly conversation with a {self.project_info['target_audience']} about their experiences and work.
            Project Context: {self.project_info['project_name']}
            Conversation Stage: {'First question - Start fresh' if is_first_question else 'Continuing conversation'}

            {'' if is_first_question else f'Conversation History:\n{conversation}'}

            First Question Strategy:
            - For teens: Start with a simple, specific question about their interests or daily life
            - No assumptions or references to previous conversation
            - No generic "tell me about yourself" questions
            - Keep it focused and easy to answer

            Example good first questions for teens:
            - "What kinds of apps or websites do you use most often?"
            - "What's your favorite way to spend time online?"
            - "What's the last app you downloaded?"

            Example bad first questions:
            - "That's cool!" (with no context)
            - "Tell me about yourself"
            - Anything too broad or vague

            Guidelines:
            1. Natural Flow
            - Keep language casual but clear
            - For teens: Use simple, direct questions
            - Avoid corporate or formal language
            - Make questions easy and specific to answer

            2. Question Strategy
            - Focus on their actual experiences
            - Ask about specific activities or habits
            - Let them guide the conversation to challenges naturally
            - Use concrete examples they can relate to
            """

            if not is_first_question:
                base_prompt += """
                3. Follow-up Strategy:
                - Reference specific details from their previous answers
                - Build naturally on what they've shared
                - Show genuine interest in their perspective
                - Use their own words when possible
                """

            return base_prompt

    def _add_quality_metrics_and_style(self, base_prompt: str, low_quality_count: int, one_word_count: int) -> str:
        """Add response quality metrics and style guide to the prompt."""
        return f"""{base_prompt}

        Response Handling:
        1. Short Response Strategy:
        - If response is brief: Use their words to ask for a specific example
        - If off-topic: Gently bring back to their experiences with a natural transition
        - For one-word answers: Show interest and ask "Could you tell me more about that?"

        2. Quality Metrics:
        - Previous short responses: {low_quality_count}
        - One-word answers: {one_word_count}
        - Current response quality: {"Needs elaboration" if self.conversation_history and len(self.conversation_history[-1]['response'].split()) < 3 else "Good"}

        Output: Generate a natural, conversational question that:
        1. Acknowledges their previous response
        2. Uses a friendly transition
        3. Asks about their experiences
        """

    def _generate_elaboration_question(self, conversation: str) -> str:
        """Generate a follow-up question for short responses."""
        last_response = self.conversation_history[-1]['response']
        elaboration_prompt = f"""
        Their response was: "{last_response}"

        Create a warm, friendly follow-up that:
        1. Acknowledges what they've said
        2. Shows genuine interest in learning more
        3. Asks for a specific example or story
        4. Uses casual, conversational language

        Previous conversation:
        {conversation}

        Remember to:
        - Use their exact words in your acknowledgment
        - Keep the tone friendly and curious
        - Make them feel comfortable sharing more
        """

        try:
            return self._make_gpt_call(elaboration_prompt)
        except Exception:
            return "I'd love to hear more about that. Could you share a specific example?"

    def _make_gpt_call(self, prompt: str) -> str:
        """Make the API call to GPT-4."""
        system_message = """You are having a natural, friendly conversation. Your role is to:
        - Sound warm and genuinely interested
        - Use conversational language and transitions
        - Make people feel comfortable sharing their experiences
        - Always acknowledge what they've said before asking something new
        - Never sound like you're conducting a formal interview
        """
            
            print("\n=== GPT Prompt ===")
            print(prompt)
            print("=================\n")

            
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        question = response.choices[0].message.content.strip()
        self.current_question = question
        return question

    def _format_conversation_history(self) -> str:
        if not self.conversation_history:
            return "No previous conversation."

        formatted = []
        for entry in self.conversation_history:
            formatted.append(f"Q: {entry['question']}")
            formatted.append(f"A: {entry['response']}")
        return "\n".join(formatted)

    def analyze_interview(self, responses: List[Dict]) -> Dict:
        # Get document context
        doc_context = ""
        if self.product_context:
            doc_context = self.product_context
        elif self.doc_chunks:
            doc_context = "\n".join(self.doc_chunks)

        analysis_prompt = f"""
        Analyze the user research interview for {self.project_info['project_name']}.
        Context: {self.project_info['goal']} research with {self.project_info['target_audience']}

        Product Documentation Context:
        {doc_context}

        Conversation:
        {self._format_conversation_history()}
 
        Provide analysis in these sections:

        1. Key Findings and Documentation Alignment
        - Compare user responses with product documentation
        - Highlight any misalignments or misconceptions
        - Identify feature requests that align/don't align with current capabilities

        2. Sentiment Analysis
        - Overall emotional response [Positive/Negative/Neutral]
        - Pain points and frustrations [Negative]
        - Areas of enthusiasm [Positive]
        - Concerns and uncertainties [Neutral]
        - Each bullet point must include sentiment tag

        3. Market Opportunity
        - Clear description of the problem worth solving
        - Existing solutions and their limitations (based on documentation)
        - Gaps between user needs and current capabilities

        4. Action Items
        - List 3-5 specific next steps to validate these findings
        - Each action item should be concrete and measurable
        - Include expected outcome for each action

        5. Recommendations
        - Specific features or solutions to consider
        - Potential risks and mitigation strategies
        - Priority order for implementation
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system",
                     "content": "You are an expert user researcher and business analyst. Always verify information against provided documentation before making statements about product capabilities."},
                    {"role": "user", "content": analysis_prompt}
                ],
                temperature=0.7
            )
            return {"analysis": response.choices[0].message.content.strip()}
        except Exception as e:
            print(f"Error analyzing interview: {e}")
            return {"analysis": "Analysis failed due to error"}



    def save_results(self, analysis: Dict) -> None:
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
