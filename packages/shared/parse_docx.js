const fs = require('fs');
const path = require('path');

const docxXmlPath = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\f2390b77-e01a-4bae-831a-5672e0fd6b6f\\scratch\\docx_extracted\\word\\document.xml';
const outputPath = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\f2390b77-e01a-4bae-831a-5672e0fd6b6f\\scratch\\spec_parsed.md';

if (!fs.existsSync(docxXmlPath)) {
  console.error("document.xml does not exist at " + docxXmlPath);
  process.exit(1);
}

const content = fs.readFileSync(docxXmlPath, 'utf8');

// Find all paragraphs <w:p>
// Word XML namespaces might be present, so w:p or similar
// Let's also decode XML entities like &lt;, &gt;, &amp;, &quot;, &apos;
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

const pRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
const tRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;

let match;
const paragraphs = [];
while ((match = pRegex.exec(content)) !== null) {
  const pContent = match[1];
  let tMatch;
  let pText = '';
  // Match w:t tags
  const textMatches = pContent.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g) || [];
  for (const tTag of textMatches) {
    const tContentMatch = tTag.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/);
    if (tContentMatch) {
      pText += tContentMatch[1];
    }
  }
  paragraphs.push(decodeEntities(pText));
}

fs.writeFileSync(outputPath, paragraphs.join('\n\n'), 'utf8');
console.log("Successfully parsed docx to spec_parsed.md. Paragraphs count: " + paragraphs.length);
