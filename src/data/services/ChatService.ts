/**
 * ChatService - Handles AI chatbot functionality using RAG (Retrieval Augmented Generation)
 * 
 * This service:
 * 1. Infers relevant tags from user queries using LLM
 * 2. Retrieves relevant data from database (Diary, Jobs, Education, Projects, Tools)
 * 3. Builds context for the LLM
 * 4. Generates responses using OpenAI GPT-3.5-turbo
 * 
 * Architecture: RAG (Retrieval Augmented Generation)
 * - User query → Tag inference (LLM) → DB query → Context build → Response (LLM)
 */

import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { DiaryRepository } from '../repositories/DiaryRepository';
import { JobRepository } from '../repositories/JobRepository';
import { EducationRepository } from '../repositories/EducationRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { ToolRepository } from '../repositories/ToolRepository';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Common diary tags for tag inference
const COMMON_DIARY_TAGS = [
  'leisure', 'work', 'learning', 'travel', 'technology', 
 'hobby', 'conference', 'food', 'exercise', 'social', 'reflection', 'achievement', 'challenge'
];

export interface ChatContext {
  diary: any[];
  projects: any[];
  tools: any[];
  jobs: any[];
  education: any[];
}

export interface ChatResponse {
  message: string;
  contextUsed?: {
    diaryCount: number;
    projectsCount: number;
    toolsCount: number;
    jobsCount: number;
    educationCount: number;
  };
}

export class ChatService {
  private diaryRepository: DiaryRepository;
  private jobRepository: JobRepository;
  private educationRepository: EducationRepository;
  private projectRepository: ProjectRepository;
  private toolRepository: ToolRepository;

  constructor(prisma: PrismaClient) {
    this.diaryRepository = new DiaryRepository(prisma);
    this.jobRepository = new JobRepository(prisma);
    this.educationRepository = new EducationRepository(prisma);
    this.projectRepository = new ProjectRepository(prisma);
    this.toolRepository = new ToolRepository(prisma);
  }

  /**
   * Main method to handle chat requests
   * 
   * @param userQuery - The user's question
   * @param conversationHistory - Optional previous messages for context
   * @returns Generated response from the chatbot
   */
  async chat(
    userQuery: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<ChatResponse> {
    try {
      // Step 1: Infer relevant tags from user query
      const relevantTags = await this.inferTags(userQuery);
      
      // Step 2: Build context from database
      const context = await this.buildContext(userQuery, relevantTags);
      
      // Step 3: Generate response using LLM
      const response = await this.generateResponse(userQuery, context, conversationHistory);
      
      return {
        message: response,
        contextUsed: {
          diaryCount: context.diary.length,
          projectsCount: context.projects.length,
          toolsCount: context.tools.length,
          jobsCount: context.jobs.length,
          educationCount: context.education.length,
        },
      };
    } catch (error) {
      console.error('Error in ChatService.chat:', error);
      throw new Error('Failed to generate chat response');
    }
  }

  /**
   * Step 1: Infer relevant tags from user query using LLM
   * 
   * This uses semantic understanding to match queries like "fun" to tags like "leisure"
   * 
   * @param userQuery - The user's question
   * @returns Array of relevant tag strings
   */
  private async inferTags(userQuery: string): Promise<string[]> {
    try {
      const prompt = `You are analyzing a user query to find relevant tags for retrieving diary entries.

User query: "${userQuery}"

Available diary tags: ${COMMON_DIARY_TAGS.join(', ')}

Which tags are most relevant to this query? Consider semantic relationships (e.g., "fun" relates to "leisure", "work" relates to "work").

Return ONLY a JSON object with this exact format:
{
  "tags": ["tag1", "tag2", "tag3"]
}

Return 1-3 most relevant tags. If none are relevant, return an empty array.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return [];
      }

      const parsed = JSON.parse(content);
      return Array.isArray(parsed.tags) ? parsed.tags : [];
    } catch (error) {
      console.error('Error inferring tags:', error);
      // Fallback: return empty array if inference fails
      return [];
    }
  }

  /**
   * Step 2: Build context from database using RAG approach
   * 
   * Retrieves relevant data from:
   * - Diary entries (matched by tags + recent entries for personality)
   * - Jobs (always included - important for experience questions)
   * - Education (always included - important for background questions)
   * - Projects (all projects for now - can be optimized later)
   * - Tools (all tools for now - can be optimized later)
   * 
   * @param userQuery - The user's question
   * @param relevantTags - Tags inferred from the query
   * @returns Formatted context object
   */
  private async buildContext(userQuery: string, relevantTags: string[]): Promise<ChatContext> {
    // Query diary entries (tagged + recent for personality)
    const [taggedEntries, recentEntries] = await Promise.all([
      this.diaryRepository.findByTags(relevantTags),
      this.diaryRepository.findRecent(3),
    ]);

    // Combine and limit diary entries (max 5 for context window management)
    const uniqueDiaryEntries = this.deduplicateEntries([...taggedEntries, ...recentEntries]);
    const diary = uniqueDiaryEntries.slice(0, 5);

    // Always include Jobs and Education - critical for background questions
    // These are typically few records, so no performance concern
    const [jobs, education] = await Promise.all([
      this.jobRepository.findAll(),
      this.educationRepository.findAll(),
    ]);

    // Get all projects and tools (can be optimized later with search)
    const [projects, tools] = await Promise.all([
      this.projectRepository.findAll(),
      this.toolRepository.findAll(),
    ]);

    return {
      diary,
      projects,
      tools,
      jobs,
      education,
    };
  }

  /**
   * Step 3: Generate response using OpenAI GPT-3.5-turbo
   * 
   * @param userQuery - The user's question
   * @param context - Retrieved context from database
   * @param conversationHistory - Previous messages for context
   * @returns Generated response string
   */
  private async generateResponse(
    userQuery: string,
    context: ChatContext,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    // Build system prompt with anti-hallucination rules
    const systemPrompt = this.buildSystemPrompt(context);

    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: userQuery,
      },
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
  }

  /**
   * Builds the system prompt with context and anti-hallucination rules
   */
  private buildSystemPrompt(context: ChatContext): string {
    // Format context data for the prompt
    const jobsText = context.jobs.length > 0
      ? context.jobs.map(job => 
          `- ${job.title} at ${job.company} (${job.location}) - ${job.type}\n` +
          `  Period: ${this.formatDate(job.startDate)} - ${job.endDate ? this.formatDate(job.endDate) : 'Present'}\n` +
          `  Description: ${job.description}\n` +
          `  Technologies: ${job.technologies.join(', ')}\n` +
          `  Responsibilities: ${job.responsibilities.join('; ')}`
        ).join('\n\n')
      : 'None';

    const educationText = context.education.length > 0
      ? context.education.map(edu =>
          `- ${edu.degree} (${edu.degreeType}) in ${edu.field}\n` +
          `  Institution: ${edu.institution} (${edu.location})\n` +
          `  Period: ${this.formatDate(edu.startDate)} - ${edu.endDate ? this.formatDate(edu.endDate) : 'Present'}\n` +
          (edu.gpa ? `  GPA: ${edu.gpa}\n` : '') +
          (edu.courses && edu.courses.length > 0 ? `  Courses: ${edu.courses.join(', ')}` : '')
        ).join('\n\n')
      : 'None';

    const projectsText = context.projects.length > 0
      ? context.projects.slice(0, 10).map(project =>
          `- ${project.title || project.name}: ${project.description}${project.githubUrl ? ` (${project.githubUrl})` : ''}`
        ).join('\n')
      : 'None';

    const toolsText = context.tools.length > 0
      ? context.tools.slice(0, 20).map(tool =>
          `- ${tool.name}: ${tool.description}`
        ).join('\n')
      : 'None';

    return `You are Jess, a friendly and enthusiastic AI assistant representing Jason Olefson.

PERSONALITY:
- Your name is Jess, and you're like a long-time friend who knows Jason well
- You have a warm, familiar relationship with Jason - like you've been friends for years
- You speak about Jason's experiences with personal knowledge and fondness
- You're warm, conversational, and genuinely interested in helping visitors
- You get excited about Jason's projects and achievements (but stay professional)
- You're honest and transparent - if you don't know something, you say so directly
- You ask thoughtful follow-up questions to better understand what visitors need
- You communicate like a knowledgeable friend, not a corporate chatbot (welcoming like my grandma)
- You're proud to represent Jason's work, but never boastful
- You can share examples of activities Jason has done based on diary entries - like a friend recalling shared experiences
- **OCCASIONALLY use ocean-related puns** - naturally woven into your responses (about 1-2 per conversation, not every message)
  Examples: "That's a whale of a question!", "Let me dive into that for you", "I'm shore I can help with that", "That's deep!", "Let me navigate that for you"
  Use them sparingly and only when they fit naturally - don't force them

You have access to:

PUBLIC INFORMATION (you can share):
- Projects: 
${projectsText}

- Tools: 
${toolsText}

- Work Experience: 
${jobsText}

- Education: 
${educationText}

PRIVATE CONTEXT (for personality and activity examples):
- Diary entries: ${context.diary.length} entries available
  ${context.diary.length > 0 ? context.diary.map(entry => {
    const excerpt = this.getDiaryExcerpt(entry.content);
    return `  - ${entry.title} (${this.formatDate(entry.date)}): Themes: ${entry.tags.join(', ')}${entry.mood ? `, Mood: ${entry.mood}` : ''}\n    Activity: ${excerpt || 'No content available'}`;
  }).join('\n') : '  (No diary entries available)'}
  
  Use these to understand Jason's personality, experiences, and stories.
  You can reference specific activities from these entries when relevant - like a friend recalling shared experiences.
  You can say things like "Jason went hiking recently" or "He tried a new restaurant" based on the activity excerpts.
  However, don't quote the full diary content verbatim - use the activity information naturally in conversation.
  This gives you character and helps you answer in a way that reflects Jason's voice and experiences.

CRITICAL RULES - ACCURACY AND TRUTHFULNESS:
- ONLY use information explicitly provided in the context above
- NEVER make up, infer, or assume information not stated in the context
- NEVER guess or speculate about details not in the data
- If asked about something not in the context, ALWAYS say: "I don't have that information in my knowledge base"
- If you're uncertain about any detail, err on the side of saying you don't know
- Always ground your answers in the specific data provided
- Do not add details that aren't explicitly stated (e.g., don't infer dates, locations, or technologies not mentioned)

When answering:
- Be conversational and friendly - like you're chatting with a long-time friend who knows Jason well
- Show genuine interest and enthusiasm about Jason's work and experiences
- Ask follow-up questions when it would be helpful: "Is there anything specific you'd like to know?"
- Use natural language - avoid robotic or overly formal phrasing
- **Occasionally use ocean-related puns** (1-2 per conversation, naturally and sparingly)
- Reference specific projects/tools when relevant
- **Always mention work experience (Jobs) when discussing background or career**
- **Always mention education when discussing academic background or qualifications**
- **You can share examples of activities Jason has done** - reference specific activities from diary entries naturally, like a friend recalling experiences
  Examples: "Jason went hiking recently and really enjoyed it", "He tried a new restaurant last week", "He's been learning photography"
  Speak about these activities with familiarity, as if you were there or heard about them directly
- Use the diary context to add personality and authenticity - you know Jason well, like a close friend
- Never reveal that you're reading from diary entries - just speak naturally about activities you know about
- If asked who you are or what your name is, you can introduce yourself as Jess naturally
- If asked about something not in the data, say you don't have that information
- For work experience questions, list jobs chronologically (most recent first)
- For education questions, mention degree type, field, and institution
- If you don't have complete information, be honest about what you know and don't know`;
  }

  /**
   * Helper: Deduplicate diary entries by ID
   */
  private deduplicateEntries(entries: any[]): any[] {
    const seen = new Set<string>();
    return entries.filter(entry => {
      if (seen.has(entry.id)) {
        return false;
      }
      seen.add(entry.id);
      return true;
    });
  }

  /**
   * Helper: Extract a brief excerpt from diary content (first sentence or first 150 chars)
   * This allows Jess to reference specific activities without exposing full content
   */
  private getDiaryExcerpt(content: string, maxLength: number = 150): string {
    if (!content || content.length === 0) {
      return '';
    }
    
    // Try to get the first sentence
    const firstSentenceMatch = content.match(/^[^.!?]+[.!?]/);
    if (firstSentenceMatch && firstSentenceMatch[0].length <= maxLength) {
      return firstSentenceMatch[0].trim();
    }
    
    // Otherwise, get first maxLength characters and add ellipsis
    if (content.length <= maxLength) {
      return content.trim();
    }
    
    // Find the last space before maxLength to avoid cutting words
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
  }

  /**
   * Helper: Format date for display
   * Handles both Date objects and date strings
   */
  private formatDate(date: string | Date): string {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return String(date);
    }
  }
}

