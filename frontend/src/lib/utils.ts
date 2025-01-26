import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatProblemName(problemName: string): string {
  return problemName.toLowerCase().replace(/\s+/g, '_');
}

export function extractProblemNameFromUrl(url: string): string {
  // Extract the pathname from the URL
  const pathname = new URL(url).pathname;

  // Use a regular expression to extract the text between `/problems/` and `/submissions/`
  const match = pathname.match(/\/problems\/([^\/]+)\/submissions\//);

  if (!match || !match[1]) {
    throw new Error('Problem name not found in the URL');
  }
  return match[1];
}

export function extractCodeFromContainer(codeContainer: Element): string {
  // Get all line divs
  const lineDivs = codeContainer.getElementsByClassName('view-line');
  let fullCode = '';

  // Iterate through each line
  for (const lineDiv of lineDivs) {
    // Get all spans within the line
    const spans = lineDiv.getElementsByTagName('span');
    let lineText = '';

    // Extract text from each span
    for (const span of spans) {
      // Replace &nbsp; with a space
      const text = span.textContent?.replace(/\u00A0/g, ' ') || '';
      lineText += text;
    }

    // Add the line to full code with a newline
    fullCode += lineText + '\n';
  }

  return fullCode.trim(); // Remove trailing whitespace
}
