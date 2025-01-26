import '@/styles/globals.css';

export default function App() {
  return (
    // This should be the only container with hard coded width and height
    <div className="flex h-[400px] w-[400px] flex-col items-center justify-center space-y-5">
      <p className="mx-5 text-center text-lg font-semibold">
        Ask yourself constantly, “Am I winning?“ If the answer is yes, nothing else matters — chaos
        is tolerable; pain is tolerable. The only thing that matters is to win.
      </p>
    </div>
  );
}
