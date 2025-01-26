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
  const lineDivs = Array.from(codeContainer.querySelectorAll('.view-line'));

  // Sort lines by their top position
  lineDivs.sort((a, b) => {
    const aTop = parseInt((a as HTMLElement).style.top) || 0;
    const bTop = parseInt((b as HTMLElement).style.top) || 0;
    return aTop - bTop;
  });

  let fullCode = '';

  for (const lineDiv of lineDivs) {
    // Get only the leaf node spans that don't contain other spans
    const spans = Array.from(lineDiv.getElementsByTagName('span')).filter(
      (span) => !span.getElementsByTagName('span').length,
    );
    let lineText = '';

    for (const span of spans) {
      const text = span.textContent?.replace(/\u00A0/g, ' ') || '';
      lineText += text;
    }
    console.log(lineText);
    fullCode += lineText + '\n';
    console.log(fullCode);
  }

  return fullCode.trim();
}
