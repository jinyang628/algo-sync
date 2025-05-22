import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Language, languageEnum } from '@/lib/types/languages';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatProblemName(problemName: string): string {
  return problemName.toLowerCase().replace(/\s+/g, '_');
}

export function isSubmissionAccepted(): boolean {
  const resultElement = document.querySelector('[data-e2e-locator="submission-result"]');

  if (!resultElement) {
    console.error('Submission result element not found.');

    return false;
  }
  console.log('Submission result element found!');

  return true;
}

export function identifyLanguage(): Language {
  const codeContainer = document.querySelector('div[class="group relative"][translate="no"]');
  if (!codeContainer) {
    throw new Error('Code container not found');
  }
  const codeElement = codeContainer.querySelector('code');
  if (!codeElement) {
    throw new Error('Code element not found');
  }
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
  const match_submissions = pathname.match(/problems\/([^/]+)\/submissions\//);
  if (match_submissions && match_submissions[1]) {
    return match_submissions[1];
  }
  const match_description = pathname.match(/problems\/([^/]+)\/description\//);
  if (match_description && match_description[1]) {
    return match_description[1];
  }
  const match_base = pathname.match(/problems\/([^/]+)\//);
  if (match_base && match_base[1]) {
    return match_base[1];
  }

  throw new Error('Unable to extract problem name from URL');
}

export function extractProblemDescription(): string {
  const problemDescriptionContainer = document.querySelector<HTMLDivElement>(
    'div[data-track-load="description_content"]',
  );

  const descriptionText: string = problemDescriptionContainer?.innerText.trim() ?? '';

  return descriptionText;
}

export function extractCodeFromWorkingContainer(): string {
  const codeContainer = document.querySelector<HTMLDivElement>(
    'div.view-lines.monaco-mouse-cursor-text',
  );

  if (!codeContainer) {
    console.error('[AlgoSync] Code container (div.view-lines.monaco-mouse-cursor-text) not found.');
    throw new Error('Code container not found. Unable to extract code.');
  }

  const lineElements = codeContainer.querySelectorAll<HTMLDivElement>('div.view-line');

  if (!lineElements || lineElements.length === 0) {
    console.warn(
      '[AlgoSync] No line elements (div.view-line) found in code container. Returning empty string.',
    );

    return '';
  }

  const linesData: { top: number; text: string }[] = [];

  lineElements.forEach((lineElement) => {
    const topStyle = lineElement.style.top;
    if (!topStyle) {
      console.warn('[AlgoSync] Found a line element without a "top" style. Skipping:', lineElement);

      return;
    }

    const topValue = parseInt(topStyle, 10);

    if (isNaN(topValue)) {
      console.warn(
        '[AlgoSync] Found a line element with unparsable "top" style:',
        topStyle,
        'on element:',
        lineElement,
        '. Skipping this line.',
      );

      return;
    }
    const lineText = lineElement.innerText;
    linesData.push({ top: topValue, text: lineText });
  });

  linesData.sort((a, b) => a.top - b.top);
  const extractedCode = linesData.map((line) => line.text).join('\n');

  return extractedCode;
}

export function extractCodeFromAcceptedSubmissionContainer(): string {
  const codeContainer = document.querySelector('div[class="group relative"][translate="no"]');
  if (!codeContainer) {
    throw new Error('Code container not found');
  }
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

export function audioDataUrlToBase64(url: string): string {
  return url.split(',')[1];
}

export function convertSecondsToTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
