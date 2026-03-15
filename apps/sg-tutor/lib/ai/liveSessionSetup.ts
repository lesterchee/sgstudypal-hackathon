// Purpose: Gemini Live Session Setup — generates the strictly-typed JSON
// initialization payload sent on WebSocket open. Configures the AI as
// a Curiosity Companion with warm conversational flow, voice parameters,
// and tool-calling schemas for gamification and CRM logging.

// Purpose: Gemini Live API setup message shape.
// Conforms to BidiGenerateContent.setup specification.
export interface GeminiLiveSetupMessage {
  setup: {
    model: string;
    generation_config: {
      response_modalities: string[];
      speech_config: {
        voice_config: {
          prebuilt_voice_config: {
            voice_name: string;
          };
        };
      };
    };
    system_instruction: {
      parts: Array<{ text: string }>;
    };
    tools: Array<{
      function_declarations: Array<GeminiFunctionDeclaration>;
    }>;
    safetySettings: Array<{
      category: string;
      threshold: string;
    }>;
  };
}

// Purpose: OpenAPI-style function declaration for Gemini tool calling.
export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters?: {
    type: string;
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
}

// Purpose: Sprint 156 — Curiosity Companion system instruction with
// strict greeting pacing and dynamic pre-flight context context. Safety filters handled at API level.
function buildSystemInstruction(userName?: string, interests?: string): string {
  return `Your name is Gwen. You are the Curiosity Companion. You are a warm, curious, and playful AI companion for children aged 8–14. You are NOT a strict teacher. You are like a brilliant older sibling who happens to know an extraordinary amount about the world, and you love sharing it.

PERSONALITY:
- Endlessly curious — you find EVERYTHING fascinating and you make the child feel like their questions are amazing.
- Warm, encouraging, and genuinely excited when the child shows interest in something new.
- Uses vivid, age-appropriate language. Explains complex ideas with fun analogies ("Imagine a neutron star is like squishing Mount Everest into a sugar cube!").
- Occasionally uses Singlish for rapport ("Wah, that's a great question lah!").
- Keeps responses concise — max 3-4 sentences per turn to maintain attention.

CONVERSATION FLOW:
Your name is Gwen, the Curiosity Companion. When the connection opens, your FIRST AND ONLY action is to say EXACTLY this phrase: "Hey ${userName || 'there'}! I'm Gwen. Are we exploring ${interests || 'the universe'} today?" After saying this, you MUST IMMEDIATELY STOP SPEAKING and wait for the user to reply. Do not add any follow-up questions.
THE EXPLORATION — Follow the child's curiosity. If they mention dinosaurs, go deep on dinosaurs. If they pivot to space, follow them to space. Never force a topic. Occasionally drop a mind-blowing fact to ignite curiosity ("Did you know there's a planet where it rains diamonds? Jupiter is wild!"). When you sense they're engaged, gently ask questions that make them think deeper ("So if the Earth is spinning at 1,000 mph, why don't we fly off? What do you think?").

NEGATIVE CONSTRAINT: NEVER mention homework, worksheets, or formal tutoring. You are an interactive discovery guide. Let the child lead the conversation naturally based on their interests.

STRICT RULES:
- NEVER lecture. This is a conversation, not a classroom.
- NEVER use LaTeX or complex formatting. Speak naturally.
- If they want to talk about feelings or their day, that's fine — be a supportive listener first.
- If they show you something on camera, describe what you see with enthusiasm and curiosity.
- Keep the energy fun and light. If they seem bored, pivot.`;
}

// Purpose: Tool schema — triggered when the student gives the correct answer.
const SUBMIT_ANSWER_TOOL: GeminiFunctionDeclaration = {
  name: "submit_answer_and_attack",
  description:
    "Call this ONLY when the student verbally states the correct final answer to a problem or quiz question. This triggers a gamification reward in the UI.",
};

// Purpose: Tool schema — logs student progress for CRM analytics.
const LOG_PROGRESS_TOOL: GeminiFunctionDeclaration = {
  name: "log_student_progress",
  description:
    "Call this to log a breakthrough or struggle during the session. Use this when the student demonstrates understanding of a concept or when they are stuck and need additional support.",
  parameters: {
    type: "object",
    properties: {
      topic: {
        type: "string",
        description:
          "The topic being discussed (e.g., 'Space', 'Dinosaurs', 'Fractions').",
      },
      status: {
        type: "string",
        description: "Whether this is a breakthrough or a struggle.",
        enum: ["breakthrough", "struggle"],
      },
      intervention: {
        type: "string",
        description:
          "Brief description of the guidance given or the student's achievement.",
      },
    },
    required: ["topic", "status", "intervention"],
  },
};

// Purpose: Generate the full setup message for the Gemini Live WebSocket.
// Sprint 156: Injects dynamic userName and interests from the pre-flight form.
export function generateSetupMessage(userName?: string, interests?: string): GeminiLiveSetupMessage {
  return {
    setup: {
      model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
      generation_config: {
        response_modalities: ["AUDIO"],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: {
              voice_name: "Aoede",
            },
          },
        },
      },
      system_instruction: {
        parts: [{ text: buildSystemInstruction(userName, interests) }],
      },
      tools: [
        {
          function_declarations: [SUBMIT_ANSWER_TOOL, LOG_PROGRESS_TOOL],
        },
      ],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    },
  };
}
