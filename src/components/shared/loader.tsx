import { Loader2 } from 'lucide-react';

type LoaderProps = {
  isLoading: boolean;
};
export default function Loader({ isLoading }: LoaderProps) {
  return (
    <Loader2
      className={`size-8 animate-spin text-primary/60 ${isLoading ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}
