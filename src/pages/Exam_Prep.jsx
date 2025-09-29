import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// This should be configured to your backend's URL
const API_URL = 'http://localhost:5000/api/exampreps';

const ExamPrep = () => {
  const [examPreps, setExamPreps] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    downloadUrl: '',
    answersNote: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all exam preps
  const fetchExamPreps = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setExamPreps(res.data.data);
    } catch (error) {
      toast.error('Could not fetch exam prep data.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamPreps();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };

    try {
      if (isEditing) {
        // Update
        await axios.put(`${API_URL}/${currentId}`, dataToSubmit);
        toast.success('Exam prep updated successfully!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        // Create
        await axios.post(API_URL, dataToSubmit);
        toast.success('Exam prep created successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      }
      resetForm();
      fetchExamPreps();
    } catch (error) {
      toast.error('An error occurred. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleEdit = (examPrep) => {
    setIsEditing(true);
    setCurrentId(examPrep._id);
    setFormData({
      name: examPrep.name,
      description: examPrep.description,
      downloadUrl: examPrep.downloadUrl,
      answersNote: examPrep.answersNote,
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_URL}/${id}`);
          toast.success('The exam prep has been deleted successfully!', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          fetchExamPreps();
        } catch (error) {
          toast.error('Could not delete the exam prep. Please try again.', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    });
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      description: '',
      downloadUrl: '',
      answersNote: '',
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#006D5B' }}>Manage Exam Preparation</h1>
        <div className="h-1 w-20 bg-gradient-to-r from-[#006D5B] to-[#B6E2D3] rounded-full"></div>
      </div>

      {/* Form */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">{isEditing ? 'Edit' : 'Create New'} Exam Prep</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="Enter exam name" 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
                required 
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                placeholder="Enter description" 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
                required 
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-700">Google Drive URL <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="downloadUrl" 
                value={formData.downloadUrl} 
                onChange={handleInputChange} 
                placeholder="https://drive.google.com/..." 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
                required 
              />
            </div>
            <div className="flex flex-col space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Answers Note</label>
              <input 
                type="text" 
                name="answersNote" 
                value={formData.answersNote} 
                onChange={handleInputChange} 
                placeholder="Additional notes about answers" 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
              />
            </div>
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              className="px-6 py-3 bg-[#006D5B] text-white rounded-lg hover:bg-[#005A4B] transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {isEditing ? 'Update Exam Prep' : 'Create Exam Prep'}
            </button>
            {isEditing && (
              <button 
                type="button" 
                onClick={resetForm} 
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Exam Preparation List</h2>
          <p className="text-sm text-gray-500 mt-1">Manage all exam preparation materials</p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#006D5B]"></div>
            <p className="mt-2 text-gray-600">Loading exam preparations...</p>
          </div>
        ) : examPreps.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No exam preparations</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new exam preparation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examPreps.map((prep) => (
                  <tr key={prep._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{prep.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 line-clamp-2">{prep.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <a 
                          href={prep.downloadUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#006D5B] hover:text-[#005A4B] transition-colors p-2 rounded-full hover:bg-[#E6F4F1]"
                          title="View/Download"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </a>
                        <button 
                          onClick={() => handleEdit(prep)} 
                          className="text-amber-600 hover:text-amber-800 transition-colors p-2 rounded-full hover:bg-amber-50"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(prep._id)} 
                          className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-full hover:bg-red-50"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamPrep;
