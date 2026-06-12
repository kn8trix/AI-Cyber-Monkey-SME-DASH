// One-shot: extract BuildFest PDF text to .pdf-text.txt next to the PDF
const { PDFParse } = require("pdf-parse");
const fs = require("fs");
const path = require("path");

const pdfPath = path.resolve("THE INFINITY AI BUILDFEST 2026.pdf");

(async () => {
  try {
    const parser = new PDFParse({ data: fs.readFileSync(pdfPath) });
    const result = await parser.getText();
    const text = typeof result === "string" ? result : result.text || JSON.stringify(result);
    const out = pdfPath + ".text.txt";
    fs.writeFileSync(out, text, "utf8");
    console.log("OK", out, text.length, "chars");
    console.log("---FIRST 1200 CHARS---");
    console.log(text.slice(0, 1200));
    console.log("---END---");
  } catch (e) {
    console.error("ERR", e.message);
    process.exit(1);
  }
})();
