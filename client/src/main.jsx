/**
 * @fileoverview Main entry point for the React application.
 * Initializes the React root, configures global providers (like React Query),
 * and mounts the root App component.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

/**
 * Configure the global React Query client.
 * Disables refetch on window focus to prevent unnecessary network requests
 * and sets the retry limit to 1 for failing queries.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Initialize the root React element and mount the application
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
