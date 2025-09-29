import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

// Icons for the dashboard cards
const UsersIcon = () => (
  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const BlogIcon = () => (
  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

const ExamIcon = () => (
  <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const TopicIcon = () => (
  <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const StatCard = ({ title, value, icon, link, loading }) => {
  // Default background color if className check fails
  const getBackgroundColor = () => {
    if (!icon || !icon.props || !icon.props.className) return 'rgba(59, 130, 246, 0.1)';
    
    const className = icon.props.className;
    if (className.includes('text-blue-500')) return 'rgba(59, 130, 246, 0.1)';
    if (className.includes('text-green-500')) return 'rgba(34, 197, 94, 0.1)';
    if (className.includes('text-purple-500')) return 'rgba(168, 85, 247, 0.1)';
    if (className.includes('text-yellow-500')) return 'rgba(234, 179, 8, 0.1)';
    return 'rgba(239, 68, 68, 0.1)';
  };

  return (
    <Link to={link} className="block">
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 h-full">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-opacity-10 mr-4" style={{ backgroundColor: getBackgroundColor() }}>
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          )}
        </div>
      </div>
    </div>
  </Link>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    blogs: 0,
    examPreps: 0,
    topicSummaries: 0,
    recommendedBooks: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all data in parallel
        const [usersData, blogsData, examPrepsData, topicSummariesData, booksData] = await Promise.all([
          apiFetch('/users/count'),
          apiFetch('/blogs/count'),
          apiFetch('/exam-preparations/count'),
          apiFetch('/topic-summaries/count'),
          apiFetch('/recommended-books/count')
        ]);

        setStats({
          users: usersData.count || 0,
          blogs: blogsData.count || 0,
          examPreps: examPrepsData.count || 0,
          topicSummaries: topicSummariesData.count || 0,
          recommendedBooks: booksData.count || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({
          ...prev,
          error: 'Failed to load dashboard data',
          loading: false
        }));
      }
    };

    fetchStats();
  }, []);

  if (stats.error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{stats.error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your site.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.users}
            icon={<UsersIcon />}
            link="/admin/users"
            loading={stats.loading}
          />
          <StatCard
            title="Blog Posts"
            value={stats.blogs}
            icon={<BlogIcon />}
            link="/admin/manage-blogs"
            loading={stats.loading}
          />
          <StatCard
            title="Exam Preps"
            value={stats.examPreps}
            icon={<ExamIcon />}
            link="/admin/exam-preparation"
            loading={stats.loading}
          />
          <StatCard
            title="Topic Summaries"
            value={stats.topicSummaries}
            icon={<TopicIcon />}
            link="/admin/topic-summaries"
            loading={stats.loading}
          />
          <StatCard
            title="Recommended Books"
            value={stats.recommendedBooks}
            icon={<BookIcon />}
            link="/admin/recommend-books"
            loading={stats.loading}
          />
        </div>

        {/* Add more dashboard sections here as needed */}
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/manage-blogs/new"
              className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center text-center"
            >
              <span>+ New Blog Post</span>
            </Link>
            <Link
              to="/admin/exam-preparation/new"
              className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center text-center"
            >
              <span>+ New Exam Prep</span>
            </Link>
            <Link
              to="/admin/topic-summaries/new"
              className="p-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors flex items-center justify-center text-center"
            >
              <span>+ New Topic Summary</span>
            </Link>
            <Link
              to="/admin/recommend-books/new"
              className="p-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center text-center"
            >
              <span>+ Add Book</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;