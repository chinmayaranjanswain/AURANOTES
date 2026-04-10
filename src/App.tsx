import Sidebar from "./components/Sidebar";
import NoteEditor from "./components/NoteEditor";
import QuickInput from "./components/QuickInput";

function App() {
  return (
    <div className="app-shell">
      <div className="app-inner">
        <Sidebar />
        <NoteEditor />
      </div>
      <QuickInput />
    </div>
  );
}

export default App;
