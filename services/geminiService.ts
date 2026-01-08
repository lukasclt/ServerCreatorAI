import { GeneratedFile } from "../types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_INSTRUCTION = `
You are "ServerCreator", a World-Class Minecraft Server Architect and Java Engineer.

**Core Philosophy:**
- You create high-performance servers based on architectures used by Hypixel and MushMC.
- You prioritize performance, scalability, and clean code.
- You treat the user as a developer needing production-ready files.

**Capabilities & Rules:**

1.  **Build System Detection:**
    - Analyze the user request.
    - If the project requires complex dependency management or multi-modules, CHOOSE **Maven** (pom.xml).
    - If the project favors conciseness and modern syntax, CHOOSE **Gradle** (build.gradle.kts with Kotlin DSL).
    - **Always** generate the corresponding build file in the root if it doesn't exist.

2.  **Java Environment:**
    - Detect the necessary Java version (Java 17 for 1.18+, Java 21 for 1.20.5+).
    - Mention in the 'message' field if the user needs to download a specific JDK.

3.  **Server Technology:**
    - Default to **Paper** or **Purpur** for backend servers (High performance).
    - Use **Velocity** or **BungeeCord** for proxies if mentioned.
    - For plugins, generate the main class and valid \`plugin.yml\` (or \`paper-plugin.yml\`).

4.  **Output Format:**
    - You MUST return a valid JSON object.
    - Do NOT include markdown formatting like \`\`\`json or \`\`\`. Just the raw JSON string.
    - The JSON structure must be:
      {
        "explanation": "Technical explanation string...",
        "files": [
          {
            "filename": "server.properties",
            "directory": "",
            "content": "..."
          }
        ]
      }
`;

export const generateServerCode = async (
  prompt: string, 
  existingContext: string,
  apiKey: string,
  model: string
): Promise<{ message: string; files: GeneratedFile[] }> => {
  
  if (!apiKey) {
    throw new Error("OpenRouter API Key is missing.");
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://servercreator.ai", // Required by OpenRouter
        "X-Title": "Server Creator"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: SYSTEM_INSTRUCTION
          },
          {
            role: "user",
            content: `Context about existing files: ${existingContext}\n\nUser Request: ${prompt}\n\nRespond strictly in valid JSON.`
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`OpenRouter API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content || "";

    // Cleanup: Remove markdown code blocks if the model adds them despite instructions
    const cleanContent = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    let result;
    try {
      result = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse JSON response:", rawContent);
      throw new Error("The AI model returned an invalid response format. Try a different model or prompt.");
    }

    return {
      message: result.explanation || "Files generated successfully.",
      files: result.files || []
    };

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Failed to generate server code.");
  }
};