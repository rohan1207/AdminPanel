import React, { useState } from 'react';
import axios from 'axios';

const Topic_Summaries = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Guard: must have a file selected (PDF or DOCX)
        if (!file) {
            alert('Please select a PDF or DOCX file to upload.');
            return;
        }
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowed.includes(file.type)) {
            alert('Only PDF or DOCX files are allowed.');
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('tags', tags);
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:5000/api/topicsummaries', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('Topic summary uploaded successfully:', response.data);
            // Optionally, reset form fields
            setTitle('');
            setDescription('');
            setTags('');
            setFile(null);
            // Reset file input
            if(document.getElementById('file')) {
                document.getElementById('file').value = null;
            }
        } catch (error) {
            console.error('Error uploading topic summary:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#006D5B' }}>Add Topic Summary</h1>
                <div className="h-1 w-20 bg-gradient-to-r from-[#006D5B] to-[#B6E2D3] rounded-full mb-6"></div>
                <p className="text-gray-600">Upload a new topic summary with a title, description, tags, and a PDF file.</p>
            </div>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
                        placeholder="Enter topic title"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
                        placeholder="Enter a short description"
                        required
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma separated)</label>
                    <input
                        type="text"
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200"
                        placeholder="e.g., Growth, Biomechanics, Diagnosis"
                    />
                </div>
                <div>
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1.5">PDF/DOCX Upload</label>
                    <input
                        type="file"
                        id="file"
                        onChange={(e) => {
                            const selected = e.target.files && e.target.files[0];
                            if (!selected) {
                                setFile(null);
                                return;
                            }
                            const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                            if (!allowed.includes(selected.type)) {
                                alert('Only PDF or DOCX files are allowed.');
                                setFile(null);
                                e.target.value = null;
                                return;
                            }
                            setFile(selected);
                        }}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E6F4F1] file:text-[#006D5B] hover:file:bg-[#DCE6D5] transition-colors cursor-pointer"
                        accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.docx"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full sm:w-auto px-8 py-3 bg-[#006D5B] text-white rounded-lg hover:bg-[#005A4B] transition-colors flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                        </>
                    ) : (
                        'Upload Topic Summary'
                    )}
                </button>
            </form>        </div>
    );
};

export default Topic_Summaries;