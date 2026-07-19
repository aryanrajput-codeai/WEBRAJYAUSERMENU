import fs from "fs";
import path from "path";

const rootDir = "/Users/aryanrajput/Desktop/POS";

const searchPatterns = [
  "LocalDB",
  "localStorage",
  "mock",
  "demo",
  "defaultCategories",
  "defaultMenuItems",
  "defaultAuditLogs",
  "defaultOrders",
  "dbStore"
];

interface AuditResult {
  file: string;
  line: number;
  content: string;
  pattern: string;
}

function auditDir(dir: string, results: AuditResult[]) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && file !== "dist" && file !== ".next") {
        auditDir(fullPath, results);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");
        lines.forEach((lineText, index) => {
          for (const pattern of searchPatterns) {
            if (lineText.includes(pattern)) {
              results.push({
                file: path.relative(rootDir, fullPath),
                line: index + 1,
                content: lineText.trim(),
                pattern
              });
            }
          }
        });
      }
    }
  }
}

const auditResults: AuditResult[] = [];
console.log("Auditing project directories...");
auditDir(rootDir, auditResults);

console.log(`Found ${auditResults.length} matches.`);

// Group results by file
const grouped: { [key: string]: AuditResult[] } = {};
for (const res of auditResults) {
  if (!grouped[res.file]) grouped[res.file] = [];
  grouped[res.file].push(res);
}

// Generate report markdown
let report = "# WebRajya POS SaaS Migration Audit Report\n\n";
report += `Generated at: ${new Date().toISOString()}\n\n`;
report += `This report outlines all occurrences of \`LocalDB\`, \`localStorage\`, mock/demo data, and fallback arrays across the source files. These must be replaced with direct Supabase calls.\n\n`;

report += "## Summary of Audit Matches\n\n";
report += "| File Path | Match Count |\n";
report += "| :--- | :--- |\n";
for (const file of Object.keys(grouped).sort()) {
  report += `| [${path.basename(file)}](file://${path.join(rootDir, file)}) | ${grouped[file].length} |\n`;
}
report += "\n---\n\n";

report += "## Detailed Occurrences by File\n\n";
for (const file of Object.keys(grouped).sort()) {
  report += `### [${file}](file://${path.join(rootDir, file)})\n\n`;
  report += "| Line | Pattern | Matching Line Content |\n";
  report += "| :--- | :--- | :--- |\n";
  for (const occ of grouped[file]) {
    // Escape Markdown inside table cells
    const escapedContent = occ.content
      .replace(/\|/g, "\\|")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    report += `| ${occ.line} | \`${occ.pattern}\` | \`${escapedContent}\` |\n`;
  }
  report += "\n";
}

fs.writeFileSync(path.join(rootDir, "migration_report.md"), report);
console.log("Migration report written to migration_report.md");
