// Copy build/ into the Wallpaper Engine project folder, so the imported
// wallpaper updates without importing it again.
// The folder comes from WALLPAPER_DIR, set in .env.local (not committed).
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

// Files Wallpaper Engine edits itself: never overwrite a newer copy
const OWNED_BY_EDITOR = ["project.json", "preview.gif"];

if (!process.env.WALLPAPER_DIR && existsSync(".env.local")) {
    const match = readFileSync(".env.local", "utf8").match(/^WALLPAPER_DIR=(.*)$/m);
    if (match) process.env.WALLPAPER_DIR = match[1].trim();
}

const target = process.env.WALLPAPER_DIR;
if (!target || !existsSync(join(target, "project.json"))) {
    console.error(
        "Set WALLPAPER_DIR in .env.local to the Wallpaper Engine project folder,\n" +
            "e.g. WALLPAPER_DIR=D:\\SteamLibrary\\steamapps\\common\\wallpaper_engine\\projects\\myprojects\\shan_shui"
    );
    process.exit(1);
}

// Remove everything except the editor's files, so stale bundles do not pile up
for (const name of readdirSync(target)) {
    if (!OWNED_BY_EDITOR.includes(name)) {
        rmSync(join(target, name), { recursive: true, force: true });
    }
}

for (const name of readdirSync("build")) {
    const from = join("build", name);
    const to = join(target, name);

    if (OWNED_BY_EDITOR.includes(name) && existsSync(to)) {
        const sameContent = readFileSync(from).equals(readFileSync(to));
        const editorIsNewer = statSync(to).mtimeMs > statSync(join("public", name)).mtimeMs;
        if (!sameContent && editorIsNewer) {
            console.warn(
                `Kept ${name}: the Wallpaper Engine copy is newer. Copy it into public/ to keep the change:\n` +
                    `  cp "${to}" public/${name}`
            );
            continue;
        }
    }
    cpSync(from, to, { recursive: true });
}

console.log(`Deployed build/ to ${target}`);
