import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaBook,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaArrowUp,
  FaArrowDown,
  FaLink,
  FaShoppingCart
} from 'react-icons/fa';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const RecommendedBooks = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    coverImage: '',
    ebookLink: '',
    buyLink: '',
    tags: [],
    isActive: true,
    order: 0
  });
  const [newTag, setNewTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Fetch all books
  const fetchBooks = async () => {
    try {
      const data = await apiFetch('/books/all');
      setBooks(data);
    } catch (error) {
      console.error('Error fetching books:', error);
      if (error.status === 401) {
        logout();
        navigate('/admin/login');
      }
      toast.error(error.message || 'Failed to load books');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBooks();
    }
  }, [token]);

  useEffect(() => {
    const { title, author, description, coverImage } = formData;
    setIsFormValid(!!(title.trim() && author.trim() && description.trim() && coverImage.trim()));
  }, [formData]);


  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image URL change
  const handleImageChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      coverImage: url
    }));
    setPreviewImage(url);
  };

  // Add new tag
  const addTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please fill all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingBook) {
        await apiFetch(`/books/${editingBook._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        toast.success('Book updated successfully');
      } else {
        await apiFetch('/books', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success('Book added successfully');
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (error) {
      console.error('Error saving book:', error);
      toast.error(error.message || 'Failed to save book');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle book active status
  const toggleActive = async (id, currentStatus) => {
    try {
      const result = await apiFetch(`/books/${id}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      // Backend returns { message, isActive }. Update local book's isActive accordingly
      setBooks(prev => prev.map(b => (b._id === id ? { ...b, isActive: result.isActive } : b)));
      toast.success('Book updated successfully');
    } catch (error) {
      console.error('Error updating book active status:', error);
      toast.error('Failed to update book active status');
    }
  };

  // Delete a book
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await apiFetch(`/books/${id}`, { method: 'DELETE' });
        toast.success('Book deleted successfully');
        fetchBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
        toast.error('Failed to delete book');
      }
    }
  };
  
  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description,
      coverImage: book.coverImage,
      ebookLink: book.ebookLink || '',
      buyLink: book.buyLink || '',
      tags: book.tags || [],
      isActive: book.isActive,
      order: book.order || 0
    });
    setPreviewImage(book.coverImage);
    setIsModalOpen(true);
  };

  // Open modal for adding a new book
  const openAddModal = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      description: '',
      coverImage: '',
      ebookLink: '',
      buyLink: '',
      tags: [],
      isActive: true,
      order: 0
    });
    setPreviewImage('');
    setIsModalOpen(true);
  };

  // Move book up in order
  const moveUp = (index) => {
    if (index > 0) {
      const updatedBooks = [...books];
      const temp = updatedBooks[index].order;
      updatedBooks[index].order = updatedBooks[index - 1].order;
      updatedBooks[index - 1].order = temp;
      setBooks(updatedBooks.sort((a, b) => a.order - b.order));
      // TODO: Save the new order to the backend
    }
  };

  // Move book down in order
  const moveDown = (index) => {
    if (index < books.length - 1) {
      const updatedBooks = [...books];
      const temp = updatedBooks[index].order;
      updatedBooks[index].order = updatedBooks[index + 1].order;
      updatedBooks[index + 1].order = temp;
      setBooks(updatedBooks.sort((a, b) => a.order - b.order));
      // TODO: Save the new order to the backend
    }
  };

  // Filter books based on search term
  const filteredBooks = books.filter(book =>
    (book.title && book.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (book.tags && book.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      coverImage: '',
      ebookLink: '',
      buyLink: '',
      tags: [],
      isActive: true,
      order: 0
    });
    setPreviewImage('');
    setEditingBook(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#006D5B' }}>Recommended Books</h1>
        <div className="h-1 w-20 bg-gradient-to-r from-[#006D5B] to-[#B6E2D3] rounded-full mb-6"></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-gray-600">Manage books displayed on the recommendations section</p>
          <button
            onClick={openAddModal}
            className="px-6 py-3 bg-[#006D5B] text-white rounded-lg hover:bg-[#005A4B] transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
          >
            <FaPlus /> Add New Book
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8 max-w-xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Search books by title, author, or tags..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Books Grid */}
      {pageLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No books found. Add your first book recommendation!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book, index) => (
            <div
              key={book._id}
              className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${
                !book.isActive ? 'opacity-70' : ''
              }`}
            >
              <div className="relative">
                <img
                  src={book.coverImage || '/book-placeholder.jpg'}
                  alt={book.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/book-placeholder.jpg';
                  }}
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => handleEdit(book)}
                    className="bg-blue-100 text-blue-600 p-2 rounded-full hover:bg-blue-200 transition-colors"
                    title="Edit"
                  >
                    <FaEdit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(book._id)}
                    className="bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    <FaTrash size={14} />
                  </button>
                  <button
                    onClick={() => toggleActive(book._id, book.isActive)}
                    className={`p-2 rounded-full ${
                      book.isActive
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                    } transition-colors`}
                    title={book.isActive ? 'Mark as Inactive' : 'Mark as Active'}
                  >
                    {book.isActive ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                  </button>
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveUp(index);
                      }}
                      className="bg-gray-100 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                      title="Move Up"
                    >
                      <FaArrowUp size={14} />
                    </button>
                  )}
                  {index < filteredBooks.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveDown(index);
                      }}
                      className="bg-gray-100 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                      title="Move Down"
                    >
                      <FaArrowDown size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-800">{book.title}</h3>
                <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {book.tags && book.tags.map((tag, i) => (
                    <span key={`${book._id}-tag-${i}`} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    book.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {book.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-500">Order: {book.order || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingBook ? 'Update the book details' : 'Fill in the details to add a new book'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Book Cover */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Book Cover <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <input
                          type="url"
                          name="coverImage"
                          value={formData.coverImage}
                          onChange={handleImageChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
                          placeholder="https://example.com/cover.jpg"
                          required
                        />
                        <p className="mt-2 text-xs text-gray-500">Paste the URL of the book cover image</p>
                      </div>
                      <div className="w-full sm:w-32 h-40 bg-gray-50 rounded-lg overflow-hidden border-2 border-dashed border-gray-200 flex-shrink-0 flex items-center justify-center">
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt="Book cover preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                              e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><FaBook class="w-8 h-8" /></div>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                            <FaBook className="w-8 h-8 mb-2" />
                            <span className="text-xs">Cover Preview</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Book Details */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
                        placeholder="Book Title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Author <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
                        placeholder="Author Name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
                        placeholder="A brief description of the book..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Links */}
                  <div className="space-y-5">
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                      <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                        <FaLink className="mr-2 text-blue-600" />
                        Book Links
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            E-book Link <span className="text-gray-400">(Optional)</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaLink className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="url"
                              name="ebookLink"
                              value={formData.ebookLink}
                              onChange={handleInputChange}
                              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
                              placeholder="https://example.com/ebook"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Buy Link <span className="text-gray-400">(Optional)</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaShoppingCart className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="url"
                              name="buyLink"
                              value={formData.buyLink}
                              onChange={handleInputChange}
                              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
                              placeholder="https://example.com/buy"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                        <span className="text-xs text-gray-500 ml-1">(Press Enter to add)</span>
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTag(e)}
                          className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
                          placeholder="e.g., Orthodontics, Diagnosis, Treatment"
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="px-4 bg-[#006D5B] text-white rounded-r-lg hover:bg-[#005A4B] transition-colors flex items-center justify-center"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.tags.filter(tag => tag).map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            className="inline-flex items-center bg-[#E6F4F1] text-[#006D5B] text-xs px-3 py-1.5 rounded-full font-medium"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1.5 text-[#006D5B] hover:text-[#004D40] transition-colors"
                              aria-label={`Remove tag ${tag}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Order and Active Status */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={(e) =>
                              setFormData(prev => ({ ...prev, isActive: e.target.checked }))
                            }
                            className="h-4 w-4 text-[#006D5B] focus:ring-[#006D5B] border-gray-300 rounded"
                            id="isActiveCheckbox"
                          />
                          <label 
                            htmlFor="isActiveCheckbox"
                            className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            {formData.isActive ? 'Active' : 'Inactive'}
                          </label>
                        </div>

                        <div className="flex items-center">
                          <label className="text-sm font-medium text-gray-700 mr-2">
                            Display Order:
                          </label>
                          <input
                            type="number"
                            name="order"
                            value={formData.order}
                            onChange={handleInputChange}
                            min="0"
                            className="w-20 p-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Lower numbers appear first in the list</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006D5B] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#006D5B] hover:bg-[#005A4B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006D5B] disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingBook ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {editingBook ? 'Update Book' : 'Save Book'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendedBooks;