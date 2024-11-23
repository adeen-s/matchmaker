import { Anthropic } from "@anthropic-ai/sdk";
import { generateMatchingPrompt } from "@/lib/constants/prompts";
import { COMMUNITY_BIOS } from "@/lib/constants/communityBios";
import { MOCK_RESPONSE } from "@/lib/constants/mockResponse";

export async function POST(req: Request) {
  try {
    const USE_MOCK = false; // Set to false when ready for real API

    if (USE_MOCK) {
      return new Response(MOCK_RESPONSE, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    const body = await req.json();
    console.log("Received request body:", body);

    const { bio, matchingContext } = body?.prompt;

    const promptData = generateMatchingPrompt({
      communityBios: COMMUNITY_BIOS,
      newMemberBio: bio || "",
      matchingContext: matchingContext || "",
    });

    // console.log('Community bios:', COMMUNITY_BIOS)
    // console.log('Bio:', bio)
    // console.log('Matching context:', matchingContext)

    // console.log("Generated prompt:", promptData);
    console.log("bio: ", bio);
    console.log("matchingContext:", matchingContext);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.beta.promptCaching.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: promptData,
          cache_control: {type: "ephemeral"}
        },
      ],
      messages: [
        {
          role: "user",
          content: `Consider the following new member bio and the matching context to generate a response with matching community members: <new_member_bio>${bio}</new_member_bio> <matching_context>${matchingContext}</matching_context>`,
        },
      ],
      stream: false,
    });

    console.log("Response:", response);

    return new Response(response.content[0].text, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Error processing request" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
