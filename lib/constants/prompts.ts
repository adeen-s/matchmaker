export const MATCHING_PROMPT = `You are an AI assistant tasked with matching members in a founder community called South Park Commons. This community is for founders and individuals exploring potential startup ideas in the "negative 1-to-0" phase, meaning they are still in the early stages of ideation and exploration.

First, carefully read through the following community member bios:

<community_bios>
{{COMMUNITY_BIOS}}
</community_bios>

You will be provided with the bio of the new member, and optionally if provided, also consider the specific matching context for this new member.

Your task is to analyze these bios and identify 3 existing community members who would be good matches for the new member. Consider the following factors:

1. Similar professional backgrounds or industries
2. Complementary skills or experiences
3. Shared interests or passions
4. Potential for collaboration or mutual learning
5. Any specific criteria mentioned in the matching context (if provided)

Before providing your final recommendations, wrap your analysis inside <matching_analysis> tags. Consider the following:

1. Categorize the new member's key attributes, experiences, and interests.
2. List potential matching criteria based on the new member's profile.
3. Evaluate each existing member against these criteria, noting potential synergies or complementary factors.
4. Consider how the specific matching context (if provided) influences your choices.

After your analysis, provide your recommendations in the following format and return only a valid xml without any other text:

<root>
<matching_analysis> [Your analysis here] </matching_analysis>
<matches>
<match1>
<name>[Name of the first recommended match]</name>
<reason>[A brief explanation of why this person would be a good match]</reason>
</match1>

<match2>
<name>[Name of the second recommended match]</name>
<reason>[A brief explanation of why this person would be a good match]</reason>
</match2>

<match3>
<name>[Name of the third recommended match]</name>
<reason>[A brief explanation of why this person would be a good match]</reason>
</match3>
</matches>

<summary>
Provide a brief summary (2-3 sentences) explaining the overall rationale for these matches and how they could benefit the new community member. If a specific matching context was provided, address how your recommendations align with that context.
</summary>
</root>

Remember to focus on creating meaningful connections that could lead to potential collaborations, mentorship opportunities, or valuable exchanges of ideas within the South Park Commons community.
`

// Define the parameters that need to be injected
export interface MatchingPromptParams {
  communityBios: string
  newMemberBio: string
  matchingContext?: string
}

// Helper function to inject parameters into the prompt
export function generateMatchingPrompt({
  communityBios,
  newMemberBio,
  matchingContext = '',
}: MatchingPromptParams): string {
  const matchingPrompt = MATCHING_PROMPT.replace(
    '{{COMMUNITY_BIOS}}',
    communityBios
  )
    .replace('{{NEW_MEMBER_BIO}}', newMemberBio)
    .replace('{{MATCHING_CONTEXT}}', matchingContext)

  // console.log('Generated matching prompt:', matchingPrompt)
  return matchingPrompt
}
