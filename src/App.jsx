import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Admin imports
import Login from "./pages/Login";
import Layout from "./Layout";
import RequireAuth from "./RequireAuth";
import Dashboard from "./pages/Dashboard";
const AddBlog = React.lazy(() => import("./pages/AddBlog"));
const RecommendedBooks = React.lazy(() => import("./pages/RecommendedBooks"));
const ExamPrep = React.lazy(() => import("./pages/Exam_Prep"));
const ManageBlogs = React.lazy(() => import("./pages/ManageBlogs"));
const EditBlog = React.lazy(() => import("./pages/EditBlog")); // Import EditBlog
const Topic_Summaries = React.lazy(() => import("./pages/Topic_Summaries"));
const App = () => {
  return (
    <AuthProvider>
        <React.Suspense
          fallback={<div className="p-6 text-center">Loading admin...</div>}
        >
          <Routes>
            {/* Redirect root to admin */}
            <Route path="/" element={<Navigate to="/admin" replace />} />

            {/* Admin auth */}
            <Route path="/admin/login" element={<Login />} />

            {/* Admin protected routes */}
            <Route
              path="/admin/*"
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="add-blog" element={<AddBlog />} />
              <Route path="recommend-books" element={<RecommendedBooks />} />
              <Route path="exam-preparation" element={<ExamPrep />} />
              <Route path="manage-blogs" element={<ManageBlogs />} />
              <Route path="manage-blogs/new" element={<AddBlog />} />
              <Route path="manage-blogs/edit/:slug" element={<EditBlog />} />
              <Route path="topic-summaries" element={<Topic_Summaries />} />
            </Route>

            {/* Catch all other routes */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </React.Suspense>
    </AuthProvider>
  );
};

export default App;
