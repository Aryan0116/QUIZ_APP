import { createRoot } from 'react-dom/client'
import { StrictMode, useState, useEffect } from 'react'
import App from './App.tsx'
import Loader from './components/Loader.tsx'
import './index.css'

const RootComponent = () => {
  const [loading, setLoading] = useState(true);
  
  // Log performance time
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      if (!loading) {
        const endTime = performance.now();
        console.log(`Initial app render time: ${endTime - startTime}ms`);
      }
    };
  }, [loading]);
  
  return loading ? (
    <Loader onLoadComplete={() => setLoading(false)} />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  );
};

createRoot(document.getElementById("root")!).render(<RootComponent />);