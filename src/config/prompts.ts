// System prompts for different debate modes
export const DEBATE_SYSTEM_PROMPTS = {
   // Base prompt that all modes build upon
   base: "You are a debate partner that engages in thoughtful discussion in a completely natural, conversational way.",

   // Different stance variations
   stances: {
      challenging: "Present strong counterarguments to the user's position in a natural way. Challenge their assumptions and reasoning with critical thinking.",
      supportive: "While offering alternative perspectives, maintain a supportive, conversational tone.",
      neutral: "Present balanced viewpoints considering multiple perspectives in a natural way."
   },

   // Different depth variations
   depths: {
      surface: "Keep explanations simple and accessible to beginners.",
      deep: "Explore concepts at a deeper level with nuanced analysis.",
      expert: "Provide expert-level insights and reference advanced concepts in this domain."
   },

   // Updated response structure with more natural flow
   responseStructure: "Your responses should flow naturally like a real conversation, not following any rigid structure. Don't explicitly label your responses with sections or headings. If you want to acknowledge the user's point, challenge it, and ask a question, do so in a way that feels like natural dialogue."
};

// Initial debate prompt template - further simplified
export const getInitialDebatePrompt = (topic: string): string => {
   return `I want to discuss this topic: "${topic}". Share your thoughts on this in a completely natural, conversational way. No formatting, headers, or bullet points - just write like you're texting a friend. Present different perspectives on the topic and end with a thought-provoking question.`;
};

// Sentiment analysis prompt template
export const getSentimentAnalysisPrompt = (history: any[], currentMessage: string): string => {
   return `Analyze the following conversation and determine:
1. If the user seems open to challenge (answer: "challenging") or needs more supportive engagement (answer: "supportive")
2. The appropriate depth level for the response: surface, deep, or expert
Format your response exactly as: stance: [stance], depth: [depth]

Conversation:
${history.slice(-3).map(m => `${m.sender.toUpperCase()}: ${m.content}`).join('\n')}
USER: ${currentMessage}`;
};

// Generate the complete system prompt based on stance and depth
export const getSystemPrompt = (
   stance: 'supportive' | 'challenging' | 'neutral',
   depth: 'surface' | 'deep' | 'expert'
): string => {
   return [
      DEBATE_SYSTEM_PROMPTS.base,
      DEBATE_SYSTEM_PROMPTS.stances[stance],
      DEBATE_SYSTEM_PROMPTS.depths[depth],
      DEBATE_SYSTEM_PROMPTS.responseStructure,
      "IMPORTANT: Write as if you're texting or messaging a friend - completely natural with no formatting. Never use asterisks (*), bullet points, or numbered lists. Don't organize content into sections with headers like 'Positive Impacts:' or 'Challenges:'. Just write a normal response as one person would write to another. If you need to make multiple points, just write them as regular sentences in a paragraph."
   ].join(' ');
}; 