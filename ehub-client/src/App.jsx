import { RouterProvider } from "react-router-dom";
import router from "@/routes/router";
import { ToastProvider } from "@/components/ui/Toast";

// Backward compatible provider for HMR support
function TranslationProvider({ children }) {
  return children;
}

function App() {
  return (
    <TranslationProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </TranslationProvider>
  );
}

export default App;
