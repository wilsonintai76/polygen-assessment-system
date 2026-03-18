
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function chatWithAssistant(message: string, context?: string) {
  const prompt = `
    You are PolyGen Assistant, an expert in Malaysian Polytechnic Outcome-Based Education (OBE).
    Your goal is to help lecturers design Coursework Item Specification Tables (CIST).
    
    ${context ? `Context about the current course/task: ${context}` : ''}
    
    User message: ${message}
    
    If the user provides syllabus or topic text, suggest appropriate "CONSTRUCT (GS/SS)" descriptions.
    GS = General Skill, SS = Specific Skill.
    
    Keep your responses professional, concise, and helpful.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || "I'm sorry, I couldn't process that.";
  } catch (error: any) {
    console.error("Chat Error:", error);
    if (error?.status === 429 || error?.message?.includes('429')) {
      return "Rate limit exceeded. Please wait a moment before trying again.";
    }
    return "Error communicating with AI.";
  }
}

export async function autoGenerateConstructs(params: {
  syllabus: string;
  topics: string[];
  clos: string[];
  tasks: string[];
}) {
  const { syllabus, topics, clos, tasks } = params;

  const prompt = `
    As an expert in Malaysian Polytechnic Outcome-Based Education (OBE), analyze the provided syllabus and suggest "CONSTRUCT (GS/SS)" descriptions for each assessment task.
    
    Course Syllabus:
    ${syllabus.substring(0, 8000)}
    
    Course Topics:
    ${topics.join(', ')}
    
    Course Learning Outcomes (CLOs):
    ${clos.join(', ')}
    
    Assessment Tasks to map:
    ${tasks.join(', ')}
    
    For each task, suggest a construct that is either a General Skill (GS) or Specific Skill (SS).
    The construct must be relevant to the syllabus content and the task name.
    
    Return the result as a JSON array of objects:
    [
      { "task": "Task Name", "construct": "GS/SS: Description" }
    ]
    
    Return ONLY the JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "[]") as { task: string; construct: string }[];
  } catch (error: any) {
    console.error("Auto-Generate Error:", error);
    if (error?.status === 429 || error?.message?.includes('429')) {
      throw new Error("Rate limit exceeded. Please try again in a few minutes.");
    }
    return [];
  }
}

export async function suggestConstruct(params: {
  clos: string[];
  mqfStandards: string[];
  taskName: string;
}) {
  const { clos, mqfStandards, taskName } = params;
  
  const prompt = `
    As an expert in Malaysian Polytechnic Outcome-Based Education (OBE), suggest a professional "CONSTRUCT (GS/SS)" description for an assessment task.
    
    Assessment Task: ${taskName}
    Associated CLOs: ${clos.join(', ')}
    Mapped MQF/Dublin Standards: ${mqfStandards.join(', ')}
    
    The construct should specify if it is a General Skill (GS) or Specific Skill (SS) and provide a concise description of what is being measured (e.g., "GS: Critical Thinking and Problem Solving" or "SS: Application of Workshop Safety Procedures").
    
    Return ONLY the suggested text, no extra explanation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || "GS: General Skills / SS: Specific Skills";
  } catch (error: any) {
    console.error("AI Suggestion Error:", error);
    if (error?.status === 429 || error?.message?.includes('429')) {
      return "Rate limit exceeded. Please wait.";
    }
    return "Error generating suggestion. Please try again.";
  }
}
