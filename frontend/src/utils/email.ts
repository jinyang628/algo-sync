import { EmailMessage, emailMessageSchema } from '@/types/email';

import { logger } from '@/lib/logger';

export function extractEmail(html: string): EmailMessage[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const messagesDivs = doc.querySelectorAll('div[class="gs"]');
  const messages: EmailMessage[] = [];
  for (const messageDiv of messagesDivs) {
    const contactInfoh3 = messageDiv.querySelector('h3.iw.gFxsud');
    if (!contactInfoh3) {
      logger.error('Contact info h3 not found');
      continue;
    }
    const spans = contactInfoh3.querySelectorAll('span');
    let email: string | null = null;
    let name: string | null = null;
    for (const span of spans) {
      if (!span.hasAttribute('email') || !span.hasAttribute('name')) {
        continue;
      }
      email = span.getAttribute('email');
      name = span.getAttribute('name');
      break;
    }
    if (!email) {
      logger.error('Email not found');
      continue;
    }
    if (!name) {
      logger.error('Name not found');
      continue;
    }

    let contentDiv: HTMLElement | null = messageDiv.querySelector('div[dir="ltr"]');
    if (!contentDiv) {
      contentDiv = messageDiv.querySelector('div.ii.gt');
      if (!contentDiv) {
        logger.error('Content div not found');
        continue;
      }
    }
    const content: string | null = contentDiv.textContent;
    if (!content) {
      logger.error('Content not found');
      continue;
    }
    const message = emailMessageSchema.parse({
      name: name,
      email: email,
      content: content.trim().replace(/\s+/g, ' '),
    });
    messages.push(message);
  }
  logger.info(`Extracted ${messages.length} messages from email`);
  return messages;
}
