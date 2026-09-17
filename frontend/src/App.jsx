import { useState, useEffect } from "react";
import Widget from "./components/Widget";
import HomePage from "./components/HomePage";

function App() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.slice(1) || "/";
    return hash;
  });

  useEffect(() => {
    const onHashChange = () => {
      setRoute(window.location.hash.slice(1) || "/");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (route.startsWith("/widget")) {
    return (
      <div className="w-full min-h-screen bg-bg text-text flex items-center justify-center p-4">
        <Widget />
      </div>
    );
  }

  return <HomePage />;
}

export default App;
