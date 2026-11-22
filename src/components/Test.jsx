import { useRef, useState } from "react";

const REPLICATE_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN;
const INR_PER_USD = 92.67;
const MODELS = [
  { id: "openai/gpt-image-2.5-flare", label: "GPT Image 2.5 Flare" },
  { id: "openai/gpt-image-2.5-sunburst", label: "GPT Image 2.5 Sunburst" },
];
const QUALITIES = ["medium", "low"];
const PRICE_USD = { medium: 0.047, low: 0.012 };

function runKey(modelId, quality) {
  return `${modelId}:${quality}`;
}

function formatCost(quality) {
  const usd = PRICE_USD[quality];
  const inr = usd * INR_PER_USD;
  return { usd: `$${usd.toFixed(3)}`, inr: `₹${inr.toFixed(2)}` };
}

const PROMPT = [
  "The two uploaded photos are the same car. Use both as reference.",
  "Make one photorealistic automotive studio photo of that exact car.",
  "Keep the vehicle identical: same body, paint colour, wheels, badges, lights, mirrors, glass, number plate and proportions.",
  "Do not redesign, restyle, add parts, or change the car in any way.",
  "Replace only the surroundings with a real dealership studio: seamless light grey cyclorama, soft even lighting, a faint floor reflection and a natural contact shadow under the tyres.",
  "No people, no other cars, no text, no watermark.",
].join(" ");

function readDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(blob);
  });
}

function replicatePath(url) {
  return url.replace(/^https:\/\/api\.replicate\.com/, "/replicate-api");
}

async function runStudio(modelId, dataUrls, quality, signal) {
  const response = await fetch(`/replicate-api/v1/models/${modelId}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({
      input: {
        prompt: PROMPT,
        input_images: dataUrls,
        aspect_ratio: "auto",
        quality,
        background: "opaque",
        output_format: "jpeg",
        output_compression: 92,
        number_of_images: 1,
      },
    }),
    signal,
  });

  let prediction = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(prediction?.detail || prediction?.error || `Replicate rejected the request (${response.status}).`);
  }

  while (prediction?.status === "starting" || prediction?.status === "processing") {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 2000);
      if (!signal) return;
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(new DOMException("Cancelled", "AbortError"));
        },
        { once: true }
      );
    });
    const poll = await fetch(replicatePath(prediction.urls.get), {
      headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
      signal,
    });
    prediction = await poll.json().catch(() => null);
    if (!poll.ok) throw new Error(prediction?.detail || "Could not check the prediction.");
  }

  if (prediction?.status !== "succeeded") {
    throw new Error(prediction?.error || "Replicate did not return an image.");
  }

  const output = prediction.output;
  const url = Array.isArray(output) ? output[0] : output;
  if (typeof url !== "string") throw new Error("Replicate did not return an image URL.");
  return url;
}

export default function Test() {
  const [files, setFiles] = useState([null, null]);
  const [previews, setPreviews] = useState(["", ""]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [fluxLoading, setFluxLoading] = useState(false);
  const [fluxResult, setFluxResult] = useState("");
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const onFile = (index, selected) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    setError("");
    setResults({});
    setFluxResult("");
    setFiles((current) => current.map((item, i) => (i === index ? selected : item)));
    setPreviews((current) => current.map((item, i) => (i === index ? URL.createObjectURL(selected) : item)));
  };

  const generate = async () => {
    if (!files[0] || !files[1] || loading) return;
    if (!REPLICATE_TOKEN) {
      setError("Missing VITE_REPLICATE_API_TOKEN.");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");
    setResults({});
    try {
      const dataUrls = await Promise.all(files.map((item) => readDataUrl(item)));
      const jobs = MODELS.flatMap((model) => QUALITIES.map((quality) => ({ model, quality })));
      const settled = await Promise.all(
        jobs.map(async ({ model, quality }) => {
          const outputUrl = await runStudio(model.id, dataUrls, quality, controller.signal);
          const imageRes = await fetch(`/replicate-file?url=${encodeURIComponent(outputUrl)}`, {
            signal: controller.signal,
          });
          if (!imageRes.ok) throw new Error(`The ${model.label} ${quality} image could not be downloaded.`);
          return [runKey(model.id, quality), URL.createObjectURL(await imageRes.blob())];
        })
      );
      setResults(Object.fromEntries(settled));
    } catch (err) {
      if (err?.name === "AbortError") setError("Cancelled.");
      else setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const generateFlux = async () => {
    if (!files[0] || !files[1] || fluxLoading) return;
    setFluxLoading(true);
    setError("");
    setFluxResult("");
    try {
      const images = await Promise.all(files.map((item) => readDataUrl(item)));
      const response = await fetch("/api/flux-klein", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "FLUX 3 Klein did not return an image.");
      if (!data?.image) throw new Error("FLUX 3 Klein did not return an image.");
      setFluxResult(data.image);
    } catch (err) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setFluxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <div
        className="min-h-screen"
        style={{ background: "linear-gradient(165deg, #161616 0%, #0a0a0a 50%, #1a1a1c 100%)" }}
      >
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-xs tracking-[0.2em] text-zinc-500 uppercase">Replicate</p>
          <h1 className="mt-1 text-2xl font-medium">Studio photo</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Upload two photos of the same car. Each run uses GPT Image 2.5 Flare and Sunburst at medium and low quality.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {["Photo 1", "Photo 2"].map((label, index) => (
              <label
                key={label}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-600 bg-black/30 px-6 py-8 text-center hover:border-zinc-400"
              >
                <span className="text-sm font-medium">{files[index] ? `Replace ${label.toLowerCase()}` : label}</span>
                <span className="mt-1 text-xs text-zinc-500">JPG, PNG or WebP</span>
                {previews[index] ? (
                  <img src={previews[index]} alt={label} className="mt-4 h-36 w-full object-contain" />
                ) : null}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => onFile(index, event.target.files?.[0])}
                />
              </label>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={!files[0] || !files[1] || loading}
              onClick={generate}
              className="rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-black disabled:opacity-40"
            >
              {loading ? "Generating four images" : "Generate Flare and Sunburst"}
            </button>
            <button
              type="button"
              disabled={!files[0] || !files[1] || fluxLoading}
              onClick={generateFlux}
              className="rounded-lg border border-zinc-400 px-4 py-2.5 text-sm font-medium text-zinc-100 disabled:opacity-40"
            >
              {fluxLoading ? "Generating FLUX 3 Klein" : "Generate FLUX 3 Klein"}
            </button>
            {loading ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm text-zinc-200"
              >
                Cancel
              </button>
            ) : null}
          </div>

          {error ? <p className="mt-4 text-sm text-zinc-300">{error}</p> : null}

          {fluxResult ? (
            <figure className="mt-8">
              <figcaption className="mb-2 text-xs tracking-wide text-zinc-500 uppercase">
                FLUX 3 Klein
              </figcaption>
              <div className="flex aspect-[3/2] items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black/40">
                <img src={fluxResult} alt="FLUX 3 Klein studio car" className="h-full w-full object-contain" />
              </div>
              <a
                href={fluxResult}
                download="car-studio-flux-3-klein.jpg"
                className="mt-3 inline-block rounded-lg border border-zinc-500 px-4 py-2 text-sm text-zinc-100"
              >
                Download
              </a>
            </figure>
          ) : null}

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {MODELS.flatMap((model) =>
              QUALITIES.map((quality) => {
                const url = results[runKey(model.id, quality)];
                const cost = formatCost(quality);
                return (
                  <figure key={runKey(model.id, quality)}>
                    <figcaption className="mb-2 text-xs tracking-wide text-zinc-500 uppercase">
                      {model.label} · {quality}
                    </figcaption>
                    <div className="flex aspect-[3/2] items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black/40">
                      {url ? (
                        <img src={url} alt={`${model.label} ${quality}`} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-sm text-zinc-600">{loading ? "Working" : "Result appears here"}</span>
                      )}
                    </div>
                    {url ? (
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-zinc-300">
                          {cost.usd}
                          <span className="mx-2 text-zinc-600">/</span>
                          {cost.inr}
                        </p>
                        <a
                          href={url}
                          download={`car-studio-${model.id.split("/")[1]}-${quality}.jpg`}
                          className="rounded-lg border border-zinc-500 px-4 py-2 text-sm text-zinc-100"
                        >
                          Download
                        </a>
                      </div>
                    ) : null}
                  </figure>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
