import { Button } from '@/components/ui/button';

import pushToGitHub from '@/lib/github';

import '@/styles/globals.css';

export default function App() {
  return (
    // This should be the only container with hard coded width and height
    <div className="flex h-[400px] w-[400px] flex-col items-center justify-center space-y-5">
      <Button onClick={() => pushToGitHub('example.txt', 'I love algorithms!', 'Add example.txt')}>
        Click
      </Button>
    </div>
  );
}
