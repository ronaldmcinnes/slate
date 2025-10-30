// Vision service for recognizing math from an image using OpenAI Vision

export async function recognizeMathFromImage(imageBlob: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file"
    );
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(imageBlob);
  });

  const prompt =
    "Read the handwritten math and return a concise plain-text expression suitable for parsing. Example: 'z = sin(x*y)'. Only return the expression.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Vision recognition failed: ${err?.error?.message || response.statusText}`
    );
  }

  const result = await response.json();
  const text: string = result.choices?.[0]?.message?.content?.trim?.() || "";
  if (!text) throw new Error("Vision returned empty result");
  return text;
}
