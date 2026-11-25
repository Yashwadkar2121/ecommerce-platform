import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X, Send, Loader2, Star } from "lucide-react";
import { aiService } from "../services/aiService";
import { optimizedImage, handleImageError } from "../utils/image";

const GREETING =
  "Hi! Tell me what you are looking for - for example \"wireless headphones under $80\" - and I will search the store for you.";

const SUGGESTIONS = [
  "Running shoes under $60",
  "Best rated headphones",
  "Gift ideas for a gamer",
];

const money = (value) =>
  `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ProductMini = ({ product, onNavigate }) => (
  <Link
    to={`/product/${product._id}`}
    onClick={onNavigate}
    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
  >
    <img
      src={optimizedImage(product.images?.[0], 120)}
      onError={handleImageError}
      alt=""
      loading="lazy"
      decoding="async"
      className="h-14 w-14 flex-shrink-0 rounded-md bg-gray-100 object-cover"
    />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
      <p className="text-xs text-gray-500">{product.brand}</p>
      <div className="mt-0.5 flex items-center gap-2 text-xs">
        <span className="font-semibold text-gray-900">{money(product.price)}</span>
        {product.ratings?.average > 0 && (
          <span className="inline-flex items-center gap-0.5 text-gray-600">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            {product.ratings.average.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  </Link>
);

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", text: GREETING, products: [] }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (text) => {
    const message = text.trim();
    if (!message || loading) return;

    // the greeting is not part of the conversation the AI needs
    const history = messages
      .slice(1)
      .map(({ role, text: t }) => ({ role, text: t }))
      .slice(-6);

    setMessages((prev) => [...prev, { role: "user", text: message, products: [] }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await aiService.assistant(message, history);
      let reply = data.reply;
      if (data.products?.length === 0 && Object.keys(data.filters || {}).length > 1) {
        reply += " I could not find matching products in stock - try different words.";
      } else if (data.relaxed && data.products?.length > 0) {
        reply += " (No exact match, so here are close options.)";
      }
      setMessages((prev) => [...prev, { role: "assistant", text: reply, products: data.products || [] }]);
    } catch (err) {
      const text =
        err?.response?.data?.error || "Sorry, the assistant is unavailable right now. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", text, products: [], isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
          aria-label="Open the AI shopping assistant"
        >
          <Sparkles size={18} />
          Ask AI
        </button>
      )}

      {open && (
        <section
          className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col bg-white shadow-2xl sm:bottom-5 sm:right-5 sm:h-[34rem] sm:w-[23rem] sm:rounded-2xl sm:border sm:border-gray-200"
          aria-label="AI shopping assistant"
        >
          <header className="flex items-center justify-between rounded-t-2xl bg-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <div>
                <h2 className="text-sm font-semibold leading-tight">AI shopping assistant</h2>
                <p className="text-[11px] text-indigo-100">Answers can be wrong - check the product page</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close the assistant" className="p-1 hover:bg-indigo-500 rounded">
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-3 py-4" aria-live="polite">
            {messages.map((m, index) => (
              <div key={index} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={m.role === "user" ? "max-w-[85%]" : "w-full max-w-[92%]"}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white"
                        : m.isError
                          ? "border border-red-200 bg-red-50 text-red-800"
                          : "border border-gray-200 bg-white text-gray-800"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.products?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.products.map((p) => (
                        <ProductMini key={p._id} product={p} onNavigate={() => setOpen(false)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="animate-spin" size={16} /> Searching...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-gray-200 bg-white p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={300}
              placeholder="What are you looking for?"
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Message"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      )}
    </>
  );
};

export default AIAssistant;
