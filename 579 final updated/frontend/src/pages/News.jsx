import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      const options = {
        method: "GET",
        url: "https://real-time-news-data.p.rapidapi.com/search",
        params: {
          query: "Finance News",
          limit: "10",
          time_published: "anytime",
          country: "US",
          lang: "en",
        },
        headers: {
          "x-rapidapi-key":
            "30e43122e6msh2c201574d9391bap1657ecjsn7c2a86606419",
          "x-rapidapi-host": "real-time-news-data.p.rapidapi.com",
        },
      };

      try {
        const response = await axios.request(options);
        setNews(response.data.data || []); // Use empty array if no data
        setLoading(false);
      } catch (error) {
        console.error("Error fetching news:", error);
        setError("Failed to load news. Please try again later.");
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <>
      <Header />
      <div className="news-container py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Latest Finance News
        </h1>

        {loading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-lg">Loading news...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 text-lg p-4 bg-red-50 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="news-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.length > 0 ? (
              news.map((item, index) => (
                <div
                  key={index}
                  className="news-item bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {item.photo_url && (
                    <img
                      src={item.photo_url}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.style.display = "none"; // Hide if image fails to load
                      }}
                    />
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">
                      {item.title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {item.description || "No description available."}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {new Date(
                          item.published_datetime_utc
                        ).toLocaleDateString()}
                      </span>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline font-medium"
                      >
                        Read more →
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-lg text-gray-500">No news articles found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default News;
