import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import buildspaceLogo from "../assets/buildspace-logo.png";

const Home = () => {
  const [input, setInput] = useState("");
  const [img, setImg] = useState("");

  const maxRetries = 20;
  const [retry, setRetry] = useState(0);
  const [retryCount, setRetryCount] = useState(maxRetries);

  const [isGenerating, setIsGenerating] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState("");

  const generateAction = async () => {
    console.log("Generating...");

    if (isGenerating && retry === 0) return;

    setIsGenerating(true);

    // If this is a retry request, take away retryCount
    if (retry > 0) {
      setRetryCount((prevState) => {
        if (prevState === 0) {
          return 0;
        } else {
          return prevState - 1;
        }
      });

      setRetry(0);
    }

    const response = await fetch(
      `https://api-inference.huggingface.co/models/buildspace/ai-avatar-generator`,
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_AUTH_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: input,
        }),
      }
    );

    const data = await response.json();

    // If model still loading, drop that retry time
    if (response.status === 503) {
      // Set the estimated_time property in state
      setRetry(data.estimated_time);
      return;
    }

    // If another error, drop error
    if (!response.ok) {
      console.log(`Error: ${data.error}`);
      setIsGenerating(false);
      return;
    }

    setFinalPrompt(input);
    setImg(data.image);
    setIsGenerating(false);
  };

  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  useEffect(() => {
    const runRetry = async () => {
      if (retryCount === 0) {
        console.log(
          `Model still loading after ${maxRetries} retries. Try request again in 5 minutes.`
        );
        setRetryCount(maxRetries);
        return;
      }

      console.log(`Trying again in ${retry} seconds.`);

      await sleep(retry * 1000);

      await generateAction();
    };

    if (retry === 0) {
      return;
    }

    runRetry();
  }, [retry]);

  return (
    <div className="root">
      <Head>
        <title>AI Avatar Generator</title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>your generator one-liner</h1>
          </div>
          <div className="header-subtitle">
            <h2>description of your generator</h2>
          </div>
          <div className="prompt-container">
            <input
              className="prompt-box"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
            />
            <div className="prompt-buttons">
              <a className="generate-button" onClick={generateAction}>
                <div className="generate">
                  <p>
                    {isGenerating ? (
                      <span className="loader"></span>
                    ) : (
                      <p>Generate</p>
                    )}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
        {img && (
          <div className="output-content">
            <Image src={img} width={512} height={512} alt={finalPrompt} />
            {/* Add prompt here */}
            <p>{finalPrompt}</p>
          </div>
        )}
      </div>
      <div className="badge-container grow">
        <a
          href="https://buildspace.so/builds/ai-avatar"
          target="_blank"
          rel="noreferrer"
        >
          <div className="badge">
            <Image src={buildspaceLogo} alt="buildspace logo" />
            <p>build with buildspace</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Home;
