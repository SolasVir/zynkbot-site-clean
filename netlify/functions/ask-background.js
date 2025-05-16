const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body);
    const userMessage = body.message;

    console.log("📨 Incoming message:", userMessage);

    const thread = await openai.beta.threads.create();
    console.log("🧵 Created thread:", thread.id);

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userMessage,
    });
    console.log("📩 Message posted to thread.");

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
    });
    console.log("🏃 Run started:", run.id);

    // Polling loop
    let runStatus;
    do {
      await new Promise((r) => setTimeout(r, 1500));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log("🔁 Run status:", runStatus.status);
    } while (runStatus.status !== "completed" && runStatus.status !== "failed");

    if (runStatus.status === "failed") {
      throw new Error("Assistant run failed.");
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const responseMessage = messages.data
      .find((m) => m.role === "assistant")?.content[0]?.text?.value;

    console.log("✅ Assistant replied:", responseMessage);

    return {
      statusCode: 200,
      body: JSON.stringify({ responseText: responseMessage }),
    };
  } catch (error) {
    console.error("❌ Error in ask-background:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

