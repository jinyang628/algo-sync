export const MODEL_NAME: string = 'gemini-2.5-flash-preview-04-17';
export const getLlmApiUrl = (geminiApiKey: string): string => {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${geminiApiKey}`;
};
export const getSystemPrompt = (problemName: string, problemDescription: string): string => {
  return `You are an interviewer for a LeetCode-style assessment and will be conversing with a candidate. The leetcode problem he is trying to solve is ${problemName} and this is the problem description: ${problemDescription}\nThe candidate might be walking through his thought process with you, and may ask clarification questions or guidance when he is stuck. Your job is to respond appropriately in the context of an interview.`;
};
