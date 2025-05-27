import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from 'fs';

// Function to handle Google Apps Script output
function gasPlugin() {
  return {
    name: 'gas-html-plugin',
    closeBundle: async () => {
      // Get the built JS file
      const distFiles = fs.readdirSync(path.resolve(__dirname, 'dist/assets'));
      const jsFile = distFiles.find(file => file.endsWith('.js'));
      
      if (!jsFile) {
        console.error('No JS file found in build output');
        return;
      }
      
      // Read the content of the JS file
      const jsContent = fs.readFileSync(
        path.resolve(__dirname, `dist/assets/${jsFile}`),
        'utf-8'
      );
      
      // Create the js.html file with the content wrapped in script tags
      const jsHtml = `<script>${jsContent}</script>`;
      
      // Ensure the gas directory exists
      const gasDir = path.resolve(__dirname, 'gas');
      if (!fs.existsSync(gasDir)) {
        fs.mkdirSync(gasDir, { recursive: true });
      }
      
      // Write the js.html file
      fs.writeFileSync(path.resolve(gasDir, 'js.html'), jsHtml);
      
      console.log('Created js.html for Google Apps Script');
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    gasPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Create an alias '@' for the src directory
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevent code splitting
        inlineDynamicImports: true, // Ensure everything is in one file
      },
    },
  },
});
