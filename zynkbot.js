async function askZynk() {
  const inputBox = document.getElementById("userInput");
  const userInput = inputBox.value.trim();

  if (!userInput) {
    appendMessage("bot", "⚠ Please enter a question.");
    return;
  }

  appendMessage("user", userInput);
  inputBox.value = "";

  const loading = appendMessage("bot", "⏳ Thinking...");

  try {
    const response = await fetch("/.netlify/functions/ask-background", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userInput })
    });

    if (!response.ok) {
      loading.textContent = `⚠ Server error (${response.status})`;
      return;
    }

    const data = await response.json();

    if (data?.response && typeof data.response === "string") {
      loading.textContent = data.response;
    } else if (data?.error) {
      loading.textContent = `⚠ Error: ${data.error}`;
    } else {
      loading.textContent = "⚠ Unexpected response format.";
    }

  } catch (err) {
    loading.textContent = "⚠ Network error: " + err.message;
  }
}

function appendMessage(role, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight; // auto-scroll
}

