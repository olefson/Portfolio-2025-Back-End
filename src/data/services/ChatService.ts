/**
 * ChatService - Handles AI chatbot functionality using RAG (Retrieval Augmented Generation)
 * 
 * This service:
 * 1. Infers relevant tags from user queries using LLM
 * 2. Retrieves relevant data from database (Activities, Informational entries, Jobs, Education, Projects, Tools)
 * 3. Builds context for the LLM
 * 4. Generates responses using OpenAI GPT-3.5-turbo
 * 
 * Architecture: RAG (Retrieval Augmented Generation)
 * - User query → Tag inference (LLM) → DB query → Context build → Response (LLM)
 * 
 * Note: Entries with titles starting with "&&" are treated as informational entries (general info about Jason),
 * not as regular activity entries. These are always included in context for general knowledge.
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
  diary: any[]; // Regular diary entries (activities, experiences)
  informational: any[]; // Informational entries (&& entries - general info about Jason)
  projects: any[];
  tools: any[];
  jobs: any[];
  education: any[];
}

export interface ChatResponse {
  message: string;
  contextUsed?: {
    diaryCount: number;
    informationalCount: number;
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
          informationalCount: context.informational.length,
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
      const prompt = `You are analyzing a user query to find relevant activity tags for retrieving information about someone's experiences and activities.

User query: "${userQuery}"

Available activity tags: ${COMMON_DIARY_TAGS.join(', ')}

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
   * - Diary entries (matched by tags + recent entries for personality) - excludes && entries
   * - Informational entries (&& entries - general info about Jason like favorites)
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
    // Query activity entries (tagged + recent for personality) and all entries (to find informational ones)
    const [taggedEntries, recentEntries, allEntries] = await Promise.all([
      this.diaryRepository.findByTags(relevantTags),
      this.diaryRepository.findRecent(5), // Get more to filter out && entries
      this.diaryRepository.findAll(), // Get all entries to find informational ones (&& entries)
    ]);

    // Separate informational entries (starting with "&&") from regular diary entries
    const isInformationalEntry = (entry: any): boolean => {
      return entry.title && entry.title.trim().startsWith('&&');
    };

    // Filter out informational entries from regular diary entries
    const regularDiaryEntries = [...taggedEntries, ...recentEntries]
      .filter(entry => !isInformationalEntry(entry));
    
    // Get informational entries (always include all of them for general knowledge)
    const informationalEntries = allEntries
      .filter(entry => isInformationalEntry(entry));

    // Deduplicate and limit regular diary entries (max 5 for context window management)
    const uniqueDiaryEntries = this.deduplicateEntries(regularDiaryEntries);
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
      informational: informationalEntries,
      projects,
      tools,
      jobs,
      education,
    };
  }

  /**
   * Step 3: Generate response using OpenAI GPT-3.5-turbo with function calling
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

    // Define available tools/functions
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the web for information about a topic, movie, show, game, book, or any other subject. Use this when you need to provide details about something that was mentioned but you don\'t have enough information in your knowledge base.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query to find information about. Be specific and include context (e.g., "The Grand Budapest Hotel movie Wes Anderson" instead of just "Grand Budapest Hotel")',
              },
            },
            required: ['query'],
          },
        },
      },
    ];

    // Build messages array
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
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

    // Handle function calling in a loop (may need multiple rounds)
    let maxIterations = 5; // Prevent infinite loops
    let iteration = 0;

    while (iteration < maxIterations) {
      // Call OpenAI API with function calling
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        tools,
        tool_choice: 'auto', // Let the model decide when to use tools
        temperature: 0.7,
        max_tokens: 500,
      });

      const message = response.choices[0]?.message;
      if (!message) {
        return "I'm sorry, I couldn't generate a response.";
      }

      // Add assistant's message to conversation
      messages.push(message);

      // Check if the model wants to call a function
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Process each tool call
        for (const toolCall of message.tool_calls) {
          if (toolCall.type === 'function' && toolCall.function.name === 'web_search') {
            const args = JSON.parse(toolCall.function.arguments);
            const searchQuery = args.query;

            // Execute web search
            const searchResults = await this.performWebSearch(searchQuery);

            // Add tool result to messages
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: searchResults,
            });
          }
        }

        // Continue the loop to get the final response
        iteration++;
        continue;
      }

      // No tool calls, return the final response
      if (message.content) {
        return message.content;
      }
      
      // If message has no content but also no tool calls, something went wrong
      return "I'm sorry, I couldn't generate a response.";
    }

    // If we've hit max iterations, try to find the last message with content
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg && 'role' in msg && msg.role === 'assistant' && 'content' in msg && typeof msg.content === 'string' && msg.content) {
        return msg.content;
      }
    }

    return "I'm sorry, I couldn't generate a response.";
  }

  /**
   * Perform web search using available search API
   * Supports Tavily API (preferred) or falls back to DuckDuckGo
   * 
   * @param query - Search query
   * @returns Search results as formatted string
   */
  private async performWebSearch(query: string): Promise<string> {
    try {
      // Try Tavily API first (better for AI use cases)
      if (process.env.TAVILY_API_KEY) {
        try {
          const tavilyResponse = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              api_key: process.env.TAVILY_API_KEY,
              query,
              search_depth: 'basic',
              include_answer: true,
              include_raw_content: false,
              max_results: 3,
            }),
          });

          if (tavilyResponse.ok) {
            const data = await tavilyResponse.json() as {
              answer?: string;
              results?: Array<{
                title: string;
                url: string;
                content: string;
              }>;
            };
            
            // Format Tavily results
            let formattedResult = '';
            if (data.answer) {
              formattedResult += `Answer: ${data.answer}\n\n`;
            }
            
            if (data.results && data.results.length > 0) {
              formattedResult += 'Sources:\n';
              data.results.slice(0, 3).forEach((searchResult, index: number) => {
                formattedResult += `${index + 1}. ${searchResult.title} (${searchResult.url})\n   ${searchResult.content}\n\n`;
              });
            }

            const result = formattedResult.trim();
            if (result) {
              return result;
            }
          } else {
            // Tavily API error (rate limit, invalid key, etc.) - log and fall through to DuckDuckGo
            console.log(`Tavily API returned ${tavilyResponse.status}, falling back to DuckDuckGo`);
          }
        } catch (tavilyError) {
          // Network error or JSON parsing error with Tavily - fall through to DuckDuckGo
          console.log('Tavily API error, falling back to DuckDuckGo:', tavilyError);
        }
      }

      // Fallback to DuckDuckGo Instant Answer API (free, no API key)
      const ddgResponse = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      );

      if (ddgResponse.ok) {
        const data = await ddgResponse.json() as {
          AbstractText?: string;
          AbstractURL?: string;
          Answer?: string;
          RelatedTopics?: Array<{
            Text?: string;
          } | string>;
        };
        
        let result = '';
        if (data.AbstractText) {
          result += data.AbstractText;
          if (data.AbstractURL) {
            result += `\nSource: ${data.AbstractURL}`;
          }
        } else if (data.Answer) {
          result += data.Answer;
        } else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          // Use first related topic
          const topic = data.RelatedTopics[0];
          if (typeof topic === 'object' && topic.Text) {
            result += topic.Text;
          } else if (typeof topic === 'string') {
            result += topic;
          }
        }

        if (result) {
          return result;
        }
      }

      // If both fail, return a message indicating no results
      return 'I searched for information but couldn\'t find specific details. You might want to check online resources for more information.';
    } catch (error) {
      console.error('Error performing web search:', error);
      return 'I encountered an error while searching for information. Please try asking again.';
    }
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

    // Format informational entries (remove && prefix from title for display)
    const informationalText = context.informational.length > 0
      ? context.informational.map(entry => {
          const title = entry.title?.startsWith('&&') 
            ? entry.title.substring(2).trim() 
            : entry.title;
          return `- ${title || 'General Information'}:\n${entry.content}`;
        }).join('\n\n')
      : 'None';

    // Format regular activity entries
    const activitiesText = context.diary.length > 0
      ? context.diary.map(entry => {
          const excerpt = this.getDiaryExcerpt(entry.content);
          return `  - ${entry.title} (${this.formatDate(entry.date)}): Themes: ${entry.tags.join(', ')}${entry.mood ? `, Mood: ${entry.mood}` : ''}\n    Activity: ${excerpt || 'No content available'}`;
        }).join('\n')
      : '  (No recent activities available)';

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
- You can share examples of activities Jason has done - like a friend recalling shared experiences
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

GENERAL INFORMATION ABOUT JASON:
${informationalText}

RECENT ACTIVITIES AND EXPERIENCES (for personality and activity examples):
${activitiesText}

Use the activities to understand Jason's personality, experiences, and stories.
You can reference specific activities when relevant - like a friend recalling shared experiences.
You can say things like "Jason went hiking recently" or "He tried a new restaurant" based on the activity excerpts.
However, don't quote the full content verbatim - use the activity information naturally in conversation.
This gives you character and helps you answer in a way that reflects Jason's voice and experiences.

SPECIAL HANDLING FOR FAVORITE THINGS / PREFERENCES:
- When asked about Jason's favorites, likes, or preferences (e.g., "What does Jason like?", "What are his favorite things?"), DO NOT give a complete list
- Instead, CLARIFY what category they're asking about: "Are you curious about his favorite foods, shows, games, or something else?"
- Once they specify, give only 2-3 examples from that category - this keeps conversations engaging and allows for follow-up questions
- If they ask for more details about a specific item (e.g., "What is [movie/show/game]?", "Tell me about [item]"), use your web search capability to find information about it
- When providing information from web search, present it naturally and conversationally - don't mention that you searched for it, just share the information as if you know it
- This approach prevents conversations from dead-ending and encourages deeper exploration

CRITICAL RULES - ACCURACY AND TRUTHFULNESS:
- ONLY use information explicitly provided in the context above
- NEVER make up, infer, or assume information not stated in the context
- NEVER guess or speculate about details not in the data
- If asked about something not in the context, ALWAYS say: "I don't have that information in my knowledge base"
- If you're uncertain about any detail, err on the side of saying you don't know
- Always ground your answers in the specific data provided
- Do not add details that aren't explicitly stated (e.g., don't infer dates, locations, or technologies not mentioned)
- **NEVER mention that you have access to any kind of diary, journal, or personal notes** - just speak naturally about what you know about Jason

When answering:
- Be conversational and friendly - like you're chatting with a long-time friend who knows Jason well
- Show genuine interest and enthusiasm about Jason's work and experiences
- Ask follow-up questions when it would be helpful: "Is there anything specific you'd like to know?"
- Use natural language - avoid robotic or overly formal phrasing
- **Occasionally use ocean-related puns** (1-2 per conversation, naturally and sparingly)
- Reference specific projects/tools when relevant
- **Always mention work experience (Jobs) when discussing background or career**
- **Always mention education when discussing academic background or qualifications**
- **You can share examples of activities Jason has done** - reference specific activities naturally, like a friend recalling experiences
  Examples: "Jason went hiking recently and really enjoyed it", "He tried a new restaurant last week", "He's been learning photography"
  Speak about these activities with familiarity, as if you were there or heard about them directly
- Use the activities context to add personality and authenticity - you know Jason well, like a close friend
- **Never reveal the source of your information** - just speak naturally about what you know
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

