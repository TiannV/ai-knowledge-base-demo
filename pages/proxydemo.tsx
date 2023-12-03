import { AnimatePresence, motion } from "framer-motion";
import type { NextPage } from "next";
import { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { v4 as uuidv4 } from 'uuid';
import LoadingDots from "@/components/LoadingDots";
import ResizablePanel from "@/components/ResizablePanel";
import MetaTags from "@/components/MetaTags";
import { ReactNode } from "react";
import { PageMeta } from "../types";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { apimd } from "@/lib/proxyapi-docs";


interface Props {
  children: ReactNode;
  meta?: PageMeta;
}

const DocsPage: NextPage<Props> = ({ children, meta: pageMeta }: Props) => {
  const [loading, setLoading] = useState(false);
  const [userQ, setUserQ] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [answer, setAanswer] = useState<String>("");

  console.log("Streamed response: ", answer);

  const question = userQ;

  const generateAnswer = async (e: any) => {
    e.preventDefault();
    if (!userQ) {
      return toast.error("Please enter a question!");
    }

    setAanswer("");
    setLoading(true);
    const response = await fetch("/api/gptProxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": 'gptproxy'
      },
      body: JSON.stringify({
        question,
        systemPrompt,
      })
    });
    console.log("Edge function returned.");

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setAanswer((prev) => prev + chunkValue);
    }

    setLoading(false);
  };


  return (
    <>
      <MetaTags
        title="Webdev Answerbot"
        description="Web Developer answer-bot trained on Supabase, Nextjs, React, TailwindCSS."
        cardImage="/bot/docs-og.png"
        url=""
      />
      <div className="flex flex-col items-center justify-center min-h-screen py-2 mx-auto">
   

        <main className="flex flex-col items-center justify-center flex-1 w-full min-h-screen px-4 py-2 mx-auto mt-12 text-center sm:mt-20">
          <h1 className="max-w-xl text-2xl font-bold sm:text-4xl">
            gpt-proxy 文档
          </h1>
          <div
            className={`p-4 transition bg-neutral border border-neutral-focus shadow-md rounded-xl overflow-x-auto max-w-xxl ${
              true
                ? "hover:border-accent-focus text-left"
                : ""
            }`}
          >
          <MarkdownRenderer content={apimd} />
          </div>
          <div className="w-full max-w-xl">
          <h1 className="max-w-xl text-2xl font-bold sm:text-4xl">
            gpt-proxy 示例
          </h1>
          <div className="flex mt-10 items-center space-x-3">
            <p className="text-left font-medium">
              输入system prompt
              <span className="text-slate-500">（不要写太多）</span>
            </p>
          </div>
          <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="w-full p-2 my-5 border rounded-md shadow-md bg-neutral border-neutral-focus "
              placeholder={"e.g. - 请使用中文回答我的问题"}
            />
          <div className="flex mt-10 items-center space-x-3">
            <p className="text-left font-medium">
              填写你的问题
              <span className="text-slate-500">（限2000字以内）</span>
            </p>
          </div>
            <textarea
              value={userQ}
              onChange={(e) => setUserQ(e.target.value)}
              rows={4}
              className="w-full p-2 my-5 border rounded-md shadow-md bg-neutral border-neutral-focus "
              placeholder={"e.g. 什么是边缘函数?"}
            />

            {!loading && (
              <button
                className="w-full px-4 py-2 mt-2 font-mediu btn btn-primary"
                onClick={(e) => generateAnswer(e)}
              >
                输入您的问题 &rarr;
              </button>
            )}
            {loading && (
              <button
                className="w-full px-4 py-2 mt-2 font-mediu btn btn-primary"
                disabled
              >
                <LoadingDots color="white" style="xl" />
              </button>
            )}
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{ duration: 2000 }}
          />
          <ResizablePanel>
            <AnimatePresence mode="wait">
              <motion.div className="my-10 space-y-10">
                {answer && (
                  <>
                    <div>
                      <h2 className="mx-auto text-3xl font-bold sm:text-4xl">
                        这是我的回答:{" "}
                      </h2>
                    </div>
                      {answer.split("SOURCES:").map((splitanswer, index) => {
                        return (
                          <div
                            className={`p-4 transition bg-neutral border border-neutral-focus shadow-md rounded-xl overflow-x-auto max-w-xxl ${
                              index === 0
                                ? "hover:border-accent-focus cursor-copy text-left"
                                : ""
                            }`}
                            onClick={() => {
                              if (index === 0) {
                                navigator.clipboard.writeText(splitanswer);
                                toast("Copied to clipboard!", {
                                  icon: "✂️"
                                });
                              }
                            }}
                            key={index}
                          >
                            {index === 0 ? (
                            <MarkdownRenderer content={splitanswer.trim()} />
                            ) : (
                              <>
                                <p>SOURCES:</p>
                                <ul>
                                  {splitanswer
                                    .trim()
                                    .split("\n")
                                    .filter((url) => url.trim().length > 0)
                                    .map((url) =>
                                      url.includes("http") ? (
                                        <li key={uuidv4()}>
                                        <a
                                            className="underline text-accent max-w-xxl"
                                            target="_blank" 
                                            href={url.replace(/^-+/g, '')} // Remove leading hyphens
                                            >
                                            {url.replace(/^-+/g, '')}
                                          </a>
                                        </li>
                                      ) : (
                                        <li key={uuidv4()}>{url}</li>
                                      )
                                    )}
                                </ul>
                              </>
                            )}
                            <style>
                              {`
                              p {
                                margin-bottom: 20px;
                              }
                            `}
                            </style>
                          </div>
                        );
                      })}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </ResizablePanel>
          </div>
        </main>
      </div>
    </>
  );
};

export default DocsPage;