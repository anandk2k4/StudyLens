"use client";

import axios from "axios";
import { useState } from "react";

export default function Home() {

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<any>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] =
    useState<any[]>([]);

  const [selectedAnswers, setSelectedAnswers] =
    useState<any>({});

  async function handleUpload() {

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    try {

      setLoading(true);

      const response = await axios.post(
        "http://127.0.0.1:8000/upload/",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data"
          }
        }
      );

      setResult(response.data);

      setSearchResults([]);
      setAnswer("");
      setSelectedAnswers({});

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  }

  async function handleAskQuestion() {

    if (!question) return;

    try {

      setAsking(true);

      const response = await axios.post(
        "http://127.0.0.1:8000/qa/",
        { question }
      );

      setAnswer(response.data.answer);

    } catch (error) {

      console.error(error);

    } finally {

      setAsking(false);
    }
  }

  async function handleSearch() {

    if (!search) {

      setSearchResults([]);
      return;
    }

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/search/",
        { query: search }
      );

      setSearchResults(response.data.results);

    } catch (error) {

      console.error(error);
    }
  }

  const displayedSegments =
    searchResults.length > 0
      ? searchResults
      : result?.segments || [];

  return (

    <main className="min-h-screen bg-white p-10">

      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}

        <div className="space-y-2">

          <h1 className="text-5xl font-bold">
            StudyLens AI
          </h1>

          <p className="text-gray-500">
            Upload videos and learn with AI.
          </p>

        </div>

        {/* UPLOAD */}

        <div className="border rounded-xl p-6 space-y-4">

          <input
            type="file"
            accept="video/*"
            onChange={(e) => {

              if (e.target.files) {
                setFile(e.target.files[0]);
              }
            }}
            className="border p-3 rounded-lg w-full"
          />

          <button
            onClick={handleUpload}
            className="
              bg-black text-white
              px-6 py-3 rounded-lg
              hover:opacity-90 transition
            "
          >

            {loading
              ? "Processing..."
              : "Upload Video"}

          </button>

        </div>

        {/* RESULTS */}

        {result && (

          <div className="space-y-6">

            {/* VIDEO */}

            <video
              id="video-player"
              controls
              src={result.video_url}
              className="w-full rounded-xl border"
            />

            {/* SUMMARY */}

            <div className="border rounded-xl p-6">

              <h2 className="text-2xl font-semibold mb-4">
                AI Summary
              </h2>

              <p className="leading-7 text-gray-700">
                {result.summary}
              </p>

            </div>

            {/* NOTES */}

            {result.notes && (

              <div className="border rounded-xl p-6">

                <h2 className="text-2xl font-semibold mb-4">
                  AI Notes
                </h2>

                <pre className="
                  whitespace-pre-wrap
                  text-gray-700
                  font-sans
                ">
                  {result.notes}
                </pre>

              </div>

            )}

            {/* QUIZ */}

            {result.quiz && (

              <div className="border rounded-xl p-6 space-y-6">

                <h2 className="text-2xl font-semibold">
                  AI Quiz
                </h2>

                {result.quiz.map(
                  (quizItem: any, index: number) => (

                  <div
                    key={index}
                    className="
                      border rounded-xl
                      p-5 space-y-4
                    "
                  >

                    <h3 className="
                      font-semibold text-lg
                    ">
                      Q{index + 1}.
                      {" "}
                      {quizItem.question}
                    </h3>

                    <div className="grid gap-3">

                      {quizItem.options.map(
                        (
                          option: string,
                          optionIndex: number
                        ) => {

                          const selected =
                            selectedAnswers[index];

                          const isCorrect =
                            option ===
                            quizItem.answer;

                          const isSelected =
                            selected === option;

                          return (

                            <button
                              key={optionIndex}

                              onClick={() =>
                                setSelectedAnswers({
                                  ...selectedAnswers,
                                  [index]: option
                                })
                              }

                              className={`
                                border rounded-lg
                                p-3 text-left transition

                                ${
                                  isSelected &&
                                  isCorrect
                                    ? "bg-green-200 border-green-500"
                                    : ""
                                }

                                ${
                                  isSelected &&
                                  !isCorrect
                                    ? "bg-red-200 border-red-500"
                                    : ""
                                }
                              `}
                            >

                              {option}

                            </button>

                          );
                        }
                      )}

                    </div>

                    {selectedAnswers[index] && (

                      <div className="text-sm font-medium">

                        {selectedAnswers[index] ===
                        quizItem.answer ? (

                          <div className="text-green-600">
                            Correct ✅
                          </div>

                        ) : (

                          <div className="text-red-600">

                            Wrong ❌

                            <div className="mt-1">
                              Correct Answer:
                              {" "}
                              {quizItem.answer}
                            </div>

                          </div>

                        )}

                      </div>

                    )}

                  </div>

                ))}

              </div>

            )}

            {/* TRANSCRIPT */}

            <div className="border rounded-xl p-6">

              <h2 className="
                text-2xl font-semibold mb-4
              ">
                Semantic Transcript Search
              </h2>

              <div className="flex gap-3 mb-4">

                <input
                  type="text"
                  placeholder="Search concepts..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="
                    flex-1 border
                    rounded-lg p-3
                  "
                />

                <button
                  onClick={handleSearch}
                  className="
                    bg-black text-white
                    px-5 rounded-lg
                  "
                >
                  Search
                </button>

              </div>

              <div className="
                space-y-3
                max-h-[500px]
                overflow-y-auto
              ">

                {displayedSegments.map(
                  (
                    segment: any,
                    index: number
                  ) => (

                  <div
                    key={index}

                    onClick={() => {

                      const video =
                        document.getElementById(
                          "video-player"
                        ) as HTMLVideoElement;

                      if (video) {

                        video.currentTime =
                          segment.start;

                        video.play();
                      }
                    }}

                    className="
                      border rounded-lg p-4
                      hover:bg-gray-100
                      cursor-pointer transition
                    "
                  >

                    <div className="
                      text-sm text-gray-500 mb-2
                    ">

                      {Math.floor(segment.start)}s

                    </div>

                    <p className="text-gray-800">
                      {segment.text}
                    </p>

                  </div>

                ))}

              </div>

            </div>

            {/* AI CHAT */}

            <div className="
              border rounded-xl
              p-6 space-y-4
            ">

              <h2 className="
                text-2xl font-semibold
              ">
                Ask AI About Video
              </h2>

              <textarea
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
                placeholder="
                  Ask anything about this video...
                "
                className="
                  w-full border rounded-lg
                  p-4 min-h-[120px]
                "
              />

              <button
                onClick={handleAskQuestion}
                className="
                  bg-black text-white
                  px-6 py-3 rounded-lg
                  hover:opacity-90 transition
                "
              >

                {asking
                  ? "Thinking..."
                  : "Ask AI"}

              </button>

              {answer && (

                <div className="
                  bg-gray-100
                  rounded-xl p-4
                ">

                  <h3 className="
                    font-semibold mb-2
                  ">
                    AI Answer
                  </h3>

                  <p className="
                    whitespace-pre-wrap
                    text-gray-700
                  ">
                    {answer}
                  </p>

                </div>

              )}

            </div>

          </div>

        )}

      </div>

    </main>
  );
}