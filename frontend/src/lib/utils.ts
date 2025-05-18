import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Language, languageEnum } from '@/types/languages';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatProblemName(problemName: string): string {
  return problemName.toLowerCase().replace(/\s+/g, '_');
}

export function identifyLanguage(codeContainer: Element): Language {
  const codeElement = codeContainer.querySelector('code');
  if (!codeElement) {
    throw new Error('Code element not found');
  }
  console.log(codeElement.className);
  const language: string = codeElement.className.split('-')[1];
  switch (language) {
    case 'python':
      return languageEnum.Values.py;
    case 'java':
      return languageEnum.Values.java;
    case 'sql':
      return languageEnum.Values.sql;
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

export function extractProblemNameFromUrl(url: string): string {
  // Extract the pathname from the URL
  const pathname = new URL(url).pathname;
  // Use a regular expression to extract the text between `/problems/` and `/submissions/`
  const match = pathname.match(/problems\/([^/]+)\/submissions\//);
  console.log(match);
  if (!match || !match[1]) {
    throw new Error('Problem name not found in the URL');
    // Retry?
  }

  return match[1];
}

export function extractCodeFromContainer(codeContainer: Element): string {
  const codeElement = codeContainer.querySelector('code');
  if (!codeElement) {
    throw new Error('Code element not found');
  }

  // Get all top-level spans which represent lines
  const lines = codeElement.querySelectorAll('span > span');
  let fullCode = '';
  let currentLine = '';
  let previousLineSpan: Element | null = null;

  lines.forEach((span) => {
    // Check if this span belongs to the same line as the previous span
    const parentSpan = span.parentElement;
    if (previousLineSpan !== parentSpan) {
      if (currentLine) {
        fullCode += currentLine;
      }
      currentLine = '';
      previousLineSpan = parentSpan;
    }

    // Add the text content to the current line
    const text = span.textContent?.replace(/\u00A0/g, ' ') || '';
    currentLine += text;
  });

  // Add the last line if it exists
  if (currentLine) {
    fullCode += currentLine;
  }

  return fullCode.trim();
}

// Helper function to convert File to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Result is like "data:audio/webm;base64,AHGASFAS..."
      // We only want the part after the comma
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

export function convertSecondsToTimer(seconds: number): string {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  
return `${m}:${s}`;
}
