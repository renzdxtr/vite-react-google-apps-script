// vite.config.ts
import { defineConfig } from "file:///C:/Users/Renz/Desktop/BPI-LBNCRDPSC/BPI-Seed-Inventory-System/vite-react-google-apps-script/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Renz/Desktop/BPI-LBNCRDPSC/BPI-Seed-Inventory-System/vite-react-google-apps-script/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import fs from "fs";
var __vite_injected_original_dirname = "C:\\Users\\Renz\\Desktop\\BPI-LBNCRDPSC\\BPI-Seed-Inventory-System\\vite-react-google-apps-script";
function gasPlugin() {
  return {
    name: "gas-html-plugin",
    closeBundle: async () => {
      const distFiles = fs.readdirSync(path.resolve(__vite_injected_original_dirname, "dist/assets"));
      const jsFile = distFiles.find((file) => file.endsWith(".js"));
      if (!jsFile) {
        console.error("No JS file found in build output");
        return;
      }
      const jsContent = fs.readFileSync(
        path.resolve(__vite_injected_original_dirname, `dist/assets/${jsFile}`),
        "utf-8"
      );
      const jsHtml = `<script>${jsContent}</script>`;
      const gasDir = path.resolve(__vite_injected_original_dirname, "gas");
      if (!fs.existsSync(gasDir)) {
        fs.mkdirSync(gasDir, { recursive: true });
      }
      fs.writeFileSync(path.resolve(gasDir, "js.html"), jsHtml);
      console.log("Created js.html for Google Apps Script");
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [
    react(),
    gasPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src")
      // Create an alias '@' for the src directory
    }
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: void 0,
        // Prevent code splitting
        inlineDynamicImports: true
        // Ensure everything is in one file
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxSZW56XFxcXERlc2t0b3BcXFxcQlBJLUxCTkNSRFBTQ1xcXFxCUEktU2VlZC1JbnZlbnRvcnktU3lzdGVtXFxcXHZpdGUtcmVhY3QtZ29vZ2xlLWFwcHMtc2NyaXB0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxSZW56XFxcXERlc2t0b3BcXFxcQlBJLUxCTkNSRFBTQ1xcXFxCUEktU2VlZC1JbnZlbnRvcnktU3lzdGVtXFxcXHZpdGUtcmVhY3QtZ29vZ2xlLWFwcHMtc2NyaXB0XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9SZW56L0Rlc2t0b3AvQlBJLUxCTkNSRFBTQy9CUEktU2VlZC1JbnZlbnRvcnktU3lzdGVtL3ZpdGUtcmVhY3QtZ29vZ2xlLWFwcHMtc2NyaXB0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5cclxuLy8gRnVuY3Rpb24gdG8gaGFuZGxlIEdvb2dsZSBBcHBzIFNjcmlwdCBvdXRwdXRcclxuZnVuY3Rpb24gZ2FzUGx1Z2luKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiAnZ2FzLWh0bWwtcGx1Z2luJyxcclxuICAgIGNsb3NlQnVuZGxlOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgIC8vIEdldCB0aGUgYnVpbHQgSlMgZmlsZVxyXG4gICAgICBjb25zdCBkaXN0RmlsZXMgPSBmcy5yZWFkZGlyU3luYyhwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZGlzdC9hc3NldHMnKSk7XHJcbiAgICAgIGNvbnN0IGpzRmlsZSA9IGRpc3RGaWxlcy5maW5kKGZpbGUgPT4gZmlsZS5lbmRzV2l0aCgnLmpzJykpO1xyXG4gICAgICBcclxuICAgICAgaWYgKCFqc0ZpbGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdObyBKUyBmaWxlIGZvdW5kIGluIGJ1aWxkIG91dHB1dCcpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gUmVhZCB0aGUgY29udGVudCBvZiB0aGUgSlMgZmlsZVxyXG4gICAgICBjb25zdCBqc0NvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoXHJcbiAgICAgICAgcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYGRpc3QvYXNzZXRzLyR7anNGaWxlfWApLFxyXG4gICAgICAgICd1dGYtOCdcclxuICAgICAgKTtcclxuICAgICAgXHJcbiAgICAgIC8vIENyZWF0ZSB0aGUganMuaHRtbCBmaWxlIHdpdGggdGhlIGNvbnRlbnQgd3JhcHBlZCBpbiBzY3JpcHQgdGFnc1xyXG4gICAgICBjb25zdCBqc0h0bWwgPSBgPHNjcmlwdD4ke2pzQ29udGVudH08L3NjcmlwdD5gO1xyXG4gICAgICBcclxuICAgICAgLy8gRW5zdXJlIHRoZSBnYXMgZGlyZWN0b3J5IGV4aXN0c1xyXG4gICAgICBjb25zdCBnYXNEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZ2FzJyk7XHJcbiAgICAgIGlmICghZnMuZXhpc3RzU3luYyhnYXNEaXIpKSB7XHJcbiAgICAgICAgZnMubWtkaXJTeW5jKGdhc0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIFdyaXRlIHRoZSBqcy5odG1sIGZpbGVcclxuICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLnJlc29sdmUoZ2FzRGlyLCAnanMuaHRtbCcpLCBqc0h0bWwpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ0NyZWF0ZWQganMuaHRtbCBmb3IgR29vZ2xlIEFwcHMgU2NyaXB0Jyk7XHJcbiAgICB9XHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgZ2FzUGx1Z2luKClcclxuICBdLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyY1wiKSwgLy8gQ3JlYXRlIGFuIGFsaWFzICdAJyBmb3IgdGhlIHNyYyBkaXJlY3RvcnlcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczogdW5kZWZpbmVkLCAvLyBQcmV2ZW50IGNvZGUgc3BsaXR0aW5nXHJcbiAgICAgICAgaW5saW5lRHluYW1pY0ltcG9ydHM6IHRydWUsIC8vIEVuc3VyZSBldmVyeXRoaW5nIGlzIGluIG9uZSBmaWxlXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlkLFNBQVMsb0JBQW9CO0FBQzllLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsT0FBTyxRQUFRO0FBSGYsSUFBTSxtQ0FBbUM7QUFNekMsU0FBUyxZQUFZO0FBQ25CLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGFBQWEsWUFBWTtBQUV2QixZQUFNLFlBQVksR0FBRyxZQUFZLEtBQUssUUFBUSxrQ0FBVyxhQUFhLENBQUM7QUFDdkUsWUFBTSxTQUFTLFVBQVUsS0FBSyxVQUFRLEtBQUssU0FBUyxLQUFLLENBQUM7QUFFMUQsVUFBSSxDQUFDLFFBQVE7QUFDWCxnQkFBUSxNQUFNLGtDQUFrQztBQUNoRDtBQUFBLE1BQ0Y7QUFHQSxZQUFNLFlBQVksR0FBRztBQUFBLFFBQ25CLEtBQUssUUFBUSxrQ0FBVyxlQUFlLE1BQU0sRUFBRTtBQUFBLFFBQy9DO0FBQUEsTUFDRjtBQUdBLFlBQU0sU0FBUyxXQUFXLFNBQVM7QUFHbkMsWUFBTSxTQUFTLEtBQUssUUFBUSxrQ0FBVyxLQUFLO0FBQzVDLFVBQUksQ0FBQyxHQUFHLFdBQVcsTUFBTSxHQUFHO0FBQzFCLFdBQUcsVUFBVSxRQUFRLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFBQSxNQUMxQztBQUdBLFNBQUcsY0FBYyxLQUFLLFFBQVEsUUFBUSxTQUFTLEdBQUcsTUFBTTtBQUV4RCxjQUFRLElBQUksd0NBQXdDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixVQUFVO0FBQUEsRUFDWjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBO0FBQUEsSUFDcEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxRQUNkLHNCQUFzQjtBQUFBO0FBQUEsTUFDeEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
