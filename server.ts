import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/youtube/trending", async (req, res) => {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const pageToken = req.query.pageToken as string;
      
      // We will provide high-quality fallback mock data if no key is present.
      // This is expected for standard demo configurations without requiring the user to immediately grab an API key.
      if (!apiKey || apiKey === "MY_YOUTUBE_API_KEY") {
        const mockBase = [
          { id: "mock1", title: "James Webb Space Telescope: A Universe of Discoveries", channel: "NASA", thumbnail: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=800&auto=format&fit=crop" },
          { id: "mock2", title: "Lofi Hip Hop Radio - Beats to Relax/Study to", channel: "Lofi Girl", thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop" },
          { id: "mock3", title: "4K HDR 60FPS Nature Video - Swiss Alps", channel: "Nature Channel", thumbnail: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop" },
          { id: "mock4", title: "Building a mechanical keyboard from scratch", channel: "Tech DIY", thumbnail: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop" },
          { id: "mock5", title: "Modern Cabin Build - 100 Days Timelapse", channel: "Cabin Builder", thumbnail: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=800&auto=format&fit=crop" },
          { id: "mock6", title: "Japanese Street Food Tour - Osaka", channel: "Travel Eats", thumbnail: "https://images.unsplash.com/photo-1554492476-eb36940e7228?q=80&w=800&auto=format&fit=crop" }
        ];
        
        // Randomize IDs so React keys don't clash on infinite scroll
        const mockData = mockBase.map(m => ({ ...m, id: m.id + "-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5) }));
        return res.json({ items: mockData, nextPageToken: "mock-token-" + Date.now() });
      }

      let ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=US&maxResults=10&key=${apiKey}`;
      if (pageToken) {
        ytUrl += `&pageToken=${pageToken}`;
      }

      const response = await fetch(ytUrl);
      const data = await response.json();
      
      if (data.error) {
         throw new Error(data.error.message);
      }

      const formatted = data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url
      }));

      res.json({ items: formatted, nextPageToken: data.nextPageToken });

    } catch (error: any) {
      console.error("YouTube API Error:", error);
      res.status(500).json({ error: "Failed to fetch trending videos." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
