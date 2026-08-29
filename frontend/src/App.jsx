import { useState } from "react";
import MapSelector from "./MapSelector";

function App() {
  const [message, setMessage] = useState("Checking backend...");

  const testBackend = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/test");
      const data = await response.json();

      setMessage(data.message);
    } catch (error) {
      setMessage("❌ Backend connection failed");
      console.error(error);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>Blue Carbon MRV</h1>

      {/* Backend Test */}
      <section>
        <p>Backend Status:</p>

        <h2>{message}</h2>

        <button onClick={testBackend}>
          Test Flask Connection
        </button>
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* AOI Map */}
      <section>
        <MapSelector />
      </section>
    </div>
  );
}

export default App;