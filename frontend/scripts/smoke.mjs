const DEFAULT_API_URL = "http://localhost:8000";

function getApiUrl() {
  return (process.env.SMOKE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
}

async function request(path, options = {}) {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed with ${response.status}`);
  }

  return body;
}

async function main() {
  const timestamp = Date.now();
  const collectionPayload = {
    name: `Smoke Collection ${timestamp}`,
    description: "Created by the local smoke test.",
  };

  const promptPayload = {
    title: `Smoke Prompt ${timestamp}`,
    content: "Return a concise summary of the provided input.",
    description: "Created by the local smoke test.",
    collection_id: null,
  };

  console.log("Checking API health...");
  const health = await request("/health");
  console.log("Health:", health);

  console.log("Creating collection...");
  const collection = await request("/collections", {
    method: "POST",
    body: JSON.stringify(collectionPayload),
  });

  console.log("Creating prompt...");
  const prompt = await request("/prompts", {
    method: "POST",
    body: JSON.stringify({
      ...promptPayload,
      collection_id: collection.id,
    }),
  });

  console.log("Reading prompt detail...");
  await request(`/prompts/${prompt.id}`);

  console.log("Filtering prompts by collection...");
  const filteredPrompts = await request(`/prompts?collection_id=${collection.id}`);
  if (!filteredPrompts.prompts.some((item) => item.id === prompt.id)) {
    throw new Error("Filtered prompts response did not include the created prompt.");
  }

  console.log("Updating prompt...");
  const updatedPrompt = await request(`/prompts/${prompt.id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...promptPayload,
      title: `${promptPayload.title} Updated`,
      collection_id: collection.id,
    }),
  });

  if (updatedPrompt.title !== `${promptPayload.title} Updated`) {
    throw new Error("Prompt update did not persist the new title.");
  }

  console.log("Deleting prompt...");
  await request(`/prompts/${prompt.id}`, {
    method: "DELETE",
  });

  console.log("Deleting collection...");
  await request(`/collections/${collection.id}`, {
    method: "DELETE",
  });

  console.log("Smoke test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
