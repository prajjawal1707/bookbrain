import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './lib/AppContext'
import Layout from './components/Layout'
import Toast from './components/Toast'
import AnalyzePage    from './pages/AnalyzePage'
import PackagesPage   from './pages/PackagesPage'
import PromptsPage    from './pages/PromptsPage'
import AdvisorPage    from './pages/AdvisorPage'
import FlashcardsPage from './pages/FlashcardsPage'
import QuizPage       from './pages/QuizPage'
import NotesPage      from './pages/NotesPage'
import DashboardPage  from './pages/DashboardPage'
import BookmarksPage  from './pages/BookmarksPage'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/"           element={<AnalyzePage />} />
            <Route path="/packages"   element={<PackagesPage />} />
            <Route path="/prompts"    element={<PromptsPage />} />
            <Route path="/advisor"    element={<AdvisorPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/quiz"       element={<QuizPage />} />
            <Route path="/notes"      element={<NotesPage />} />
            <Route path="/dashboard"  element={<DashboardPage />} />
            <Route path="/bookmarks"  element={<BookmarksPage />} />
          </Routes>
        </Layout>
        <Toast />
      </BrowserRouter>
    </AppProvider>
  )
}
