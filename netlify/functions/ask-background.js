const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const message = body.message;

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No message provided in request." }),
      };
    }

    console.log("📨 Incoming message:", message);

    // Step 1: Create a new thread
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;

    console.log("🧵 Created thread:", threadId);

    // Step 2: Post user message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    console.log("📩 Message posted to thread.");

    // Step 3: Create run with assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });

    const runId = run.id;
    console.log("🏃 Run started:", runId);

    // Step 4: Poll until run is complete
    let runStatus = run.status;
    while (runStatus !== "completed" && runStatus !== "failed" && runStatus !== "cancelled") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const updatedRun = await openai.beta.threads.runs.retrieve(threadId, runId);
      runStatus = updatedRun.status;
      console.log("🔁 Run status:", runStatus);
    }

    if (runStatus !== "completed") {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Run did not complete: ${runStatus}` }),
      };
    }

    // Step 5: Retrieve messages from thread
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data
      .filter(m => m.role === "assistant")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    const replyText = lastMessage?.content?.[0]?.text?.value || "⚠ No reply received.";

    return {
      statusCode: 200,
      body: JSON.stringify({ response: replyText }),
    };

  } catch (err) {
    console.error("❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

