// Capture square frames of the built wallpaper (build/) in headless Edge, for the
// preview GIF. Pans the SVG by hand so the motion is even. See README.md here.
// node capture.mjs stills <outDir> <vertical> <seed...>      one still per seed
// node capture.mjs frames <outDir> <vertical> <seed> <count> <stepPx> <startPx>
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PAGE = pathToFileURL(fileURLToPath(new URL("../../build/index.html", import.meta.url))).href;
const SIZE = 1080, OUT = 400, PORT = 9335;
const [, , mode, outDir, vertical, ...rest] = process.argv;
mkdirSync(outDir, { recursive: true });

const edge = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`, `--window-size=${SIZE},${SIZE}`,
    "--hide-scrollbars", "--force-device-scale-factor=1", "--user-data-dir=" + outDir + "/profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.result?.value;
const shot = async (file) => {
    // Wait two animation frames so the transform is painted
    await evaluate(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
    const r = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: SIZE, height: SIZE, scale: OUT / SIZE } });
    writeFileSync(file, Buffer.from(r.result.data, "base64"));
};
const load = async (seed) => {
    await send("Page.navigate", { url: PAGE }); await sleep(1500);
    await evaluate(`window.wallpaperPropertyListener.applyUserProperties({ scrolling: { value: false }, horizontalposition: { value: 0 },
        verticalposition: { value: ${vertical} }, papertexture: { value: false }, seed: { value: ${JSON.stringify(seed)} } })`);
    await sleep(2500);
};

await send("Page.enable");
// Exact square viewport: --window-size includes window chrome, leaving white edges
await send("Emulation.setDeviceMetricsOverride", { width: SIZE, height: SIZE, deviceScaleFactor: 1, mobile: false });
if (mode === "stills") {
    for (const seed of rest) { await load(seed); await shot(`${outDir}/seed-${seed}.png`); console.log("still", seed); }
} else {
    const [seed, count, step, start] = rest;
    await load(seed);
    for (let i = 0; i < +count; i++) {
        await evaluate(`document.getElementById("SVG").style.transform = "translate3d(${-(+start + i * +step)}px, 0, 0)"`);
        await shot(`${outDir}/f${String(i).padStart(3, "0")}.png`);
    }
    console.log("frames", count);
}
ws.close(); edge.kill(); process.exit(0);
