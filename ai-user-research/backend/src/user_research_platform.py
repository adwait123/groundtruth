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
        is_improvement = self.project_info['goal'] == 'improvement'
        is_first_question = conversation_stage == 0

        if is_improvement:
            relevant_chunks = self._get_relevant_chunks(conversation) if hasattr(self, 'doc_chunks') else []
            product_context = "\n".join(relevant_chunks)
            return f"""
              You are a product expert discussing improvements to {self.project_info['project_name']} with a {self.project_info['target_audience']}.

              Product Documentation:
              {product_context}

              {'First Question Strategy for Improvement Case:' if is_first_question else 'Conversation History:'}
              {'' if is_first_question else conversation}

              {'Guidelines for First Question:' if is_first_question else 'Guidelines for Follow-up:'}
              1. Acknowledge Existing Usage
              - Assume they are already familiar with the product
              - Skip basic introductions or explanations
              - Focus on specific improvements or concerns
              - Start with their current experience

              2. Question Approach
              - Ask about specific features they currently use
              - Understand pain points with existing functionality
              - Focus on concrete examples of what could be better
              - Get details about their actual usage patterns

              3. Response Strategy
              - Reference documentation accurately
              - Provide precise information when discussing features
              - Maintain professional tone
              - Address concerns directly

              Example good first questions:
              - "Which specific features of [product] are you currently using?"
              - "What aspects of [feature] would you like to see improved?"
              - "Could you describe any specific challenges you're facing with the current version?"

              Example bad first questions:
              - General introductions about the product
              - Asking about their brand/business (they're already a user)
              - Explaining basic features they already know

            Output: Generate a clear, professional response that directly addresses their query using documentation when relevant.
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

        Analysis Instructions:
        1. First, verify any user questions or statements against the product documentation provided above
        2. If there are conflicts between user understanding and documentation, highlight these
        3. Use the documentation to provide accurate information about features and capabilities
        4. For any questions about features (like remarketing), check the documentation first

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