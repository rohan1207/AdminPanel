import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const ManageBlogs = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await apiFetch('/blogs?status=all'); // Fetch all blogs regardless of status
                if (response && Array.isArray(response.blogs)) {
                    setBlogs(response.blogs);
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (err) {
                setError(err.message || 'Failed to fetch blogs.');
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    const handleDeleteClick = (blog) => {
        setBlogToDelete(blog);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!blogToDelete) return;

        try {
            await apiFetch(`/blogs/${blogToDelete.slug}`, { method: 'DELETE' });
            setBlogs(blogs.filter(b => b.slug !== blogToDelete.slug));
            setShowDeleteModal(false);
            setBlogToDelete(null);
        } catch (err) {
            setError(err.message || 'Failed to delete blog.');
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return <div className="p-6">Loading blogs...</div>;
    }

    if (error) {
        return <div className="p-6 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage Blogs</h1>
                <button
                    onClick={() => navigate('/admin/manage-blogs/new')}
                    className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
                >
                    + Create New Blog
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {blogs.length > 0 ? (
                            blogs.map(blog => (
                                <tr key={blog.slug}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{blog.mainHeading}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.author || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.category || 'Uncategorized'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${blog.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {blog.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(blog.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 mr-4">View</a>
                                        <button onClick={() => navigate(`/admin/manage-blogs/edit/${blog.slug}`)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                                        <button onClick={() => handleDeleteClick(blog)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No blogs found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
                        <h2 className="text-lg font-bold mb-4">Confirm Deletion</h2>
                        <p className="mb-4">Are you sure you want to delete the blog "{blogToDelete?.mainHeading}"? This action cannot be undone.</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageBlogs;
