import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const InfiniteScrollLoader = ({ loadMore, hasMore, loadingMore }) => {
  const observerRef = useRef();
  const loaderRef = useRef();

  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loadingMore) {
        loadMore();
      }
    },
    [hasMore, loadMore, loadingMore]
  );

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observerRef.current.observe(loaderRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  return (
    <div ref={loaderRef} className="py-8">
      {loadingMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <div className="flex space-x-2">
            <div className="w-4 h-4 bg-primary-600 rounded-full animate-bounce"></div>
            <div
              className="w-4 h-4 bg-primary-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-4 h-4 bg-primary-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <p className="text-gray-600 text-sm">Loading more products...</p>
        </motion.div>
      )}
      {!hasMore && !loadingMore && (
        <div className="text-center py-8">
          <p className="text-gray-500">No more products to load</p>
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollLoader;
