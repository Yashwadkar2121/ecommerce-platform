// frontend/src/App.jsx
import AppRouter from "./router/AppRouter";
import CartNotification from "./components/CartNotification";
import AIAssistant from "./components/AIAssistant";

function App() {
  return (
    <>
      <AppRouter />
      <CartNotification />
      <AIAssistant />
    </>
  );
}

export default App;
