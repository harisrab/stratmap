import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

type CoverImageOptions = {
  height: number;
  image: Blob;
  title: string;
  width: number;
};

const geistBoldPath = path.join(process.cwd(), "src/assets/fonts/geist-bold.ttf");
const geistRegularPath = path.join(process.cwd(), "src/assets/fonts/geist-regular.ttf");
let geistBoldFontPromise: Promise<ArrayBuffer> | undefined;
let geistRegularFontPromise: Promise<ArrayBuffer> | undefined;

function getArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}

function getGeistBoldFont(): Promise<ArrayBuffer> {
  if (!geistBoldFontPromise) {
    geistBoldFontPromise = readFile(geistBoldPath).then(getArrayBuffer);
  }
  return geistBoldFontPromise;
}

function getGeistRegularFont(): Promise<ArrayBuffer> {
  if (!geistRegularFontPromise) {
    geistRegularFontPromise = readFile(geistRegularPath).then(getArrayBuffer);
  }
  return geistRegularFontPromise;
}

function wrapCoverTitle(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > 27 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      continue;
    }
    currentLine = nextLine;
  }
  if (currentLine) lines.push(currentLine);
  const visibleLines = lines.slice(0, 2);
  if (lines.length > 2) {
    visibleLines[1] = `${visibleLines[1].replace(/\s+\S*$/, "") || visibleLines[1]}...`;
  }
  return visibleLines.length > 0 ? visibleLines : ["Untitled stratbook"];
}

async function blobToDataUrl(blob: Blob) {
  const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
  return `data:${blob.type || "image/png"};base64,${base64}`;
}

export async function renderCoverImage({ height, image, title, width }: CoverImageOptions) {
  const [backgroundImage, geistBold, geistRegular] = await Promise.all([
    blobToDataUrl(image),
    getGeistBoldFont(),
    getGeistRegularFont(),
  ]);
  const titleLines = wrapCoverTitle(title);
  const response = new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "#02060a",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <img
          alt=""
          src={backgroundImage}
          style={{
            height: "100%",
            left: 0,
            objectFit: "cover",
            position: "absolute",
            top: 0,
            width: "100%",
          }}
        />
        <div
          style={{
            background:
              "linear-gradient(90deg, rgba(2,6,10,0.78) 0%, rgba(2,6,10,0.28) 46%, rgba(2,6,10,0) 100%)",
            height: "100%",
            left: 0,
            position: "absolute",
            top: 0,
            width: "100%",
          }}
        />
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(2,6,10,0) 0%, rgba(2,6,10,0.16) 64%, rgba(2,6,10,0.52) 100%)",
            height: "100%",
            left: 0,
            position: "absolute",
            top: 0,
            width: "100%",
          }}
        />
        <div
          style={{
            background:
              "radial-gradient(circle at 50% 42%, rgba(2,6,10,0) 48%, rgba(2,6,10,0.36) 100%)",
            height: "100%",
            left: 0,
            position: "absolute",
            top: 0,
            width: "100%",
          }}
        />
        <div
          style={{
            color: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            left: 64,
            position: "absolute",
            top: 58,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Geist",
              fontSize: 26,
              fontWeight: 700,
              height: 28,
              lineHeight: 1,
              position: "relative",
              textShadow: "0 1px 10px rgba(2, 6, 10, 0.64)",
              width: 130,
            }}
          >
            <div
              style={{
                color: "#f8fafc",
                display: "flex",
                left: 0,
                position: "absolute",
                top: 0,
              }}
            >
              Stratbook
            </div>
            <div
              style={{
                color: "#5eead4",
                display: "flex",
                left: 0,
                position: "absolute",
                top: 0,
              }}
            >
              Strat
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Geist",
              fontSize: 50,
              fontWeight: 400,
              gap: 8,
              lineHeight: 1,
              marginTop: 32,
              maxWidth: 740,
              textShadow: "0 2px 18px rgba(2, 6, 10, 0.58)",
            }}
          >
            {titleLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      fonts: [
        {
          data: geistRegular,
          name: "Geist",
          style: "normal",
          weight: 400,
        },
        {
          data: geistBold,
          name: "Geist",
          style: "normal",
          weight: 700,
        },
      ],
      height,
      width,
    }
  );

  return response.blob();
}
