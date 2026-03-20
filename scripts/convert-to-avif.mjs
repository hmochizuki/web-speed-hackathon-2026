import { readdir } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import sharp from "sharp";

const configs = [
  { dir: "../application/public/images", quality: 50 },
  { dir: "../application/public/images/profiles", quality: 90 },
];

for (const { dir, quality } of configs) {
  const fullDir = new URL(dir, import.meta.url).pathname;
  const files = await readdir(fullDir);
  const jpgs = files.filter((f) => extname(f) === ".jpg");

  console.log(`\n${dir} (quality: ${quality}): ${jpgs.length} files`);

  for (const file of jpgs) {
    const inputPath = join(fullDir, file);
    const outputPath = join(fullDir, basename(file, ".jpg") + ".avif");

    const result = await sharp(inputPath)
      .avif({ quality })
      .toFile(outputPath);

    const inputStat = await sharp(inputPath).metadata();
    const ratio = ((result.size / inputStat.size) * 100).toFixed(1);
    console.log(
      `  ${file}: ${(inputStat.size / 1024).toFixed(0)}KB -> ${(result.size / 1024).toFixed(0)}KB (${ratio}%)`,
    );
  }
}

console.log("\nDone!");
