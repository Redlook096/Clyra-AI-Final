import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

if (window.location.pathname === '/preview') {
    // Add the activeStyle class to the body to inherit the selected theme
    const searchParams = new URLSearchParams(window.location.search);
    const theme = searchParams.get('theme');
    if (theme) {
        document.body.className = `theme-${theme} bg-transparent`;
    }
    
    // We use a query parameter cache buster for the dynamic import to ensure 
    // it loads the latest version of the file instead of a cached version.
    const importUrl = `/src/GeneratedPreviewComponent.tsx?t=${Date.now()}`;
    
    // Dynamically import the component
    import(/* @vite-ignore */ importUrl)
        .then(module => {
            const Component = module.default;
            root.render(
                <StrictMode>
                    <Suspense fallback={<div className="flex items-center justify-center min-h-[300px] w-full text-stone-400">Loading Preview...</div>}>
                        <Component />
                    </Suspense>
                </StrictMode>
            );
        })
        .catch(err => {
            console.error("Preview render error:", err);
            root.render(
                <div className="p-6 bg-red-50 text-red-600 rounded-xl m-4 border border-red-200 shadow-sm">
                    <h3 className="font-bold mb-2">Preview Error</h3>
                    <pre className="text-sm whitespace-pre-wrap font-mono">{err?.toString()}</pre>
                </div>
            );
        });
} else {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
}
