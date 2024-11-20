"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompletion } from "ai/react";
import { Loader2 } from "lucide-react";
import { FileText } from "lucide-react";
// import { BIO_TEMPLATE } from "@/lib/constants/bioTemplate";

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
  const [additionalQuestions, setAdditionalQuestions] = useState<
    { label: string; placeholder: string }[]
  >([]);
  const [questionAnswers, setQuestionAnswers] = useState<{
    [key: string]: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [summary, setSummary] = useState("");
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

  const { isLoading, complete } = useCompletion({
    api: "/api/matches",
    onFinish: (completion) => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(completion, "text/xml");

        const parserError = xmlDoc.querySelector("parsererror");
        if (parserError) {
          throw new Error("Failed to parse XML response");
        }

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

        if (matchesData.length === 0) {
          throw new Error("No valid matches found in response");
        }

        setMatches(matchesData);

        const summaryElement = xmlDoc.querySelector("summary");
        const summaryText = summaryElement?.textContent?.trim();

        setSummary(summaryText || "");
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Error processing the response"
        );
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    console.log(matches);
    console.log(summary);
    console.log(error);
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
      const completion = await complete(JSON.stringify(allResponses));

      if (!completion) {
        throw new Error("No completion received");
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(completion, "text/xml");

      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("Failed to parse XML response");
      }

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

      setMatches(matchesData);

      const summaryElement = xmlDoc.querySelector("summary");
      const summaryText = summaryElement?.textContent?.trim();

      setSummary(summaryText || "");
    } catch (error) {
      console.error(error);
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section: Who Are You */}
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
                className={`min-h-[100px] w-full rounded-lg border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* Section: Matching Context */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">
                What are you looking for?
              </h3>
              <Textarea
                placeholder="types of connections, areas of advice, potential cofounders, etc."
                value={matchingContext}
                onChange={(e) => setMatchingContext(e.target.value)}
                className="min-h-[100px] w-full rounded-lg border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Section: Additional Questions (Dynamic Fields) */}
            {additionalQuestions.length > 0 &&
              additionalQuestions.map(({ label, placeholder }, index) => (
                <div key={index} className="space-y-4">
                  <label className="block text-lg font-semibold">{label}</label>
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

            {/* Submit Button */}
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

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-center mt-4">{error}</div>
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
