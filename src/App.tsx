import Sidebar from "./components/Sidebar";
import NoteEditor from "./components/NoteEditor";
import QuickInput from "./components/QuickInput";

function App() {
  return (
    <div className="w-[700px] h-[600px] bg-bg rounded-2xl overflow-hidden flex flex-col border border-border/60 shadow-[0_20px_80px_rgba(0,0,0,0.8)]">
      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <NoteEditor />
      </div>
      <QuickInput />
    </div>
  );
}

export default App;
