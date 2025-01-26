import { useState } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type CopyableTextProps = {
  text: string;
};

export default function CopyableText({ text }: CopyableTextProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  if (!text) {
    return null;
  }

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <pre
              className="mt-2 w-full cursor-pointer whitespace-pre-wrap break-words rounded p-2 text-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleCopy}
            >
              {text}
            </pre>
          </TooltipTrigger>
          <TooltipContent align="center">Click to copy the email reply</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <p className={`text-center text-green-600 ${isCopied ? 'opacity-100' : 'opacity-0'}`}>
        Copied to clipboard!
      </p>
    </div>
  );
}
