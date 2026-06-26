var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.get("/api/youtube/trending", async (req, res) => {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const pageToken = req.query.pageToken;
      if (!apiKey || apiKey === "MY_YOUTUBE_API_KEY") {
        const mockBase = [
          { id: "mock1", title: "James Webb Space Telescope: A Universe of Discoveries", channel: "NASA", thumbnail: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=800&auto=format&fit=crop" },
          { id: "mock2", title: "Lofi Hip Hop Radio - Beats to Relax/Study to", channel: "Lofi Girl", thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop" },
          { id: "mock3", title: "4K HDR 60FPS Nature Video - Swiss Alps", channel: "Nature Channel", thumbnail: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop" },
          { id: "mock4", title: "Building a mechanical keyboard from scratch", channel: "Tech DIY", thumbnail: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop" },
          { id: "mock5", title: "Modern Cabin Build - 100 Days Timelapse", channel: "Cabin Builder", thumbnail: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=800&auto=format&fit=crop" },
          { id: "mock6", title: "Japanese Street Food Tour - Osaka", channel: "Travel Eats", thumbnail: "https://images.unsplash.com/photo-1554492476-eb36940e7228?q=80&w=800&auto=format&fit=crop" }
        ];
        const mockData = mockBase.map((m) => ({ ...m, id: m.id + "-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5) }));
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
      const formatted = data.items.map((item) => ({
        id: item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url
      }));
      res.json({ items: formatted, nextPageToken: data.nextPageToken });
    } catch (error) {
      console.error("YouTube API Error:", error);
      res.status(500).json({ error: "Failed to fetch trending videos." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
