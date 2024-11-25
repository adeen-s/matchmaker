"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompletion } from "ai/react";
import { Loader2 } from "lucide-react";
import { FileText } from "lucide-react";
import { BIO_TEMPLATE } from "@/lib/constants/bioTemplate";

const TEMPLATE_QUESTIONS = [
  "What's your story? location, background, key career moments",
  "What are you currently building or exploring? Stage of development, Problem space, Key technologies",
  "What unique skills or expertise can you share with others? Technical abilities, Domain knowledge, Past successful outcomes",
  "What kind of collaborations interest you? Types of projects, Areas you want to learn, Potential partnership styles",
  "What problems are you passionate about solving? Industries you care about, Technologies you're excited about, Impact areas you want to focus on",
  "What makes you uniquely you? Personal interests/hobbies, Side projects, Community involvement",
];

interface Match {
  name: string;
  reason: string;
}

export default function Home() {
  const [bio, setBio] = useState("");
  const [matchingContext, setMatchingContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [summary, setSummary] = useState("");
  const [additionalQuestions, setAdditionalQuestions] = useState<
    { label: string; placeholder: string }[]
  >([]);
  const [questionAnswers, setQuestionAnswers] = useState<{
    [key: string]: string;
  }>({});
  const [templateUsed, setTemplateUsed] = useState(false);

  const toggleTemplate = () => {
    if (templateUsed) {
      setAdditionalQuestions([]);
      setBio("");
      setMatchingContext("");
      setQuestionAnswers({});
    } else {
      const parsedQuestions = TEMPLATE_QUESTIONS.map((question) => {
        const [label, ...placeholderParts] = question.split("?");
        return {
          label: label.trim() + "?",
          placeholder: placeholderParts.join("?").trim(),
        };
      });
      setAdditionalQuestions(parsedQuestions);
      // setBio(BIO_TEMPLATE);
    }
    setTemplateUsed(!templateUsed);
  };

  const fillTemplate = () => {
    setBio(BIO_TEMPLATE);
  };

  const { isLoading, complete } = useCompletion({
    api: "/api/matches",
    onResponse: async (response) => {
      const completion = (await response.text()).replace("&", "and");
      try {
        console.log("Raw AI Response:", completion);

        if (!completion) {
          throw new Error("No completion received");
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(completion, "text/xml");

        // Check for parsing errors
        const parserError = xmlDoc.querySelector("parsererror");
        if (parserError) {
          console.error("XML Parser Error:", parserError.textContent);
          throw new Error("Failed to parse XML response");
        }

        // Parse matches
        const matchesData = Array.from({ length: 3 }, (_, i) => {
          const matchNum = i + 1;
          const matchElement = xmlDoc.querySelector(`match${matchNum}`);

          if (!matchElement) {
            return null;
          }

          const name = matchElement.querySelector("name")?.textContent;
          const reason = matchElement.querySelector("reason")?.textContent;

          if (!name || !reason) {
            return null;
          }

          return { name, reason };
        }).filter((match): match is Match => match !== null);

        // Verify we got matches
        if (matchesData.length === 0) {
          throw new Error("No valid matches found in response");
        }

        setMatches(matchesData);

        // Parse summary
        const summaryElement = xmlDoc.querySelector("summary");
        const summaryText = summaryElement?.textContent?.trim();

        if (!summaryText) {
          console.warn("Summary not found or empty");
        }

        setSummary(summaryText || "");

        // Optional: Parse matching analysis for additional context
        const analysisElement = xmlDoc.querySelector("matching_analysis");
        if (analysisElement) {
          console.log("Matching Analysis:", analysisElement.textContent);
        }
      } catch (error) {
        console.error("Processing Error:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Error processing the response"
        );
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMatches([]);
    setSummary("");
    // Concatenate all questionAnswers into a single string
    const additionalContent = Object.entries(questionAnswers)
      .map(([label, answer]) => `${label}\n${answer}`)
      .join("\n\n");
    // Combine the additional content into the bio field
    const completeBio = `${bio}\n\n${additionalContent}`;
    const allResponses = {
      bio: completeBio,
      matchingContext,
    };
    try {
      // TODO handle submission of JSON data over text

      await complete(JSON.stringify(allResponses));
    } catch (error) {
      console.error("Submission Error:", error);
      setError("An error occurred while fetching matches. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">SPC Member Matcher</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary">
                  Who are you?
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleTemplate}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <FileText className="h-4 w-4" />
                  {templateUsed ? "Reset" : "Use Template"}
                </Button>
              </div>

              <Textarea
                placeholder="Enter your bio here..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`w-full rounded-lg border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  templateUsed ? "min-h-[100px]" : "min-h-[400px]"
                }`}
              />
            </div>

            <div className="space-y-4 mt-8">
              <h3 className="text-xl font-semibold text-primary">
                What are you looking for?
              </h3>
              <Textarea
                placeholder="types of connections, areas of advice, potential cofounders, etc."
                value={matchingContext}
                onChange={(e) => setMatchingContext(e.target.value)}
                className="min-h-[100px]"
              />

              {additionalQuestions.length > 0 &&
                additionalQuestions.map(({ label, placeholder }, index) => (
                  <div key={index} className="space-y-4">
                    <label className="block text-lg font-semibold">
                      {label}
                    </label>
                    <Textarea
                      placeholder={placeholder}
                      value={questionAnswers[label] || ""}
                      onChange={(e) =>
                        setQuestionAnswers({
                          ...questionAnswers,
                          [label]: e.target.value,
                        })
                      }
                      className="min-h-[100px] w-full rounded-lg border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 py-3 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding your matches...
                  </>
                ) : (
                  "Find Matches"
                )}
              </Button>
            </div>

            {error && <div className="text-red-500">{error}</div>}

            {matches.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold">Your Matches</h3>
                {matches.map((match, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-primary">
                        {match.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-2">
                        {match.reason}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {summary && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Summary</h3>
                    <p className="text-sm text-muted-foreground">{summary}</p>
                  </div>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      <span className="text-sm text-muted-foreground mt-4 block w-full text-center">
        -1 to 0 ... together :)
      </span>
    </div>
  );
}
