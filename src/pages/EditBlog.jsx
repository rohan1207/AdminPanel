import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import ImageTool from '@editorjs/image';
import Quote from '@editorjs/quote';
import Table from '@editorjs/table';
import { compressImage } from "../utils/compressImage";
import { apiFetch, API_BASE } from "../utils/api";

const EditBlog = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const editorRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState(null);
    const [heroPreview, setHeroPreview] = useState(null);
    const [uploadsInProgress, setUploadsInProgress] = useState(false);

    const token = localStorage.getItem('adminToken');

    // Fetch existing blog data on component mount
    useEffect(() => {
        const fetchBlogData = async () => {
            try {
                const data = await apiFetch(`/blogs/${slug}`);
                setForm({
                    ...data,
                    tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
                    keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : '',
                    summaryPoints: Array.isArray(data.summaryPoints) ? data.summaryPoints : [''],
                    citations: Array.isArray(data.citations) ? data.citations : [''],
                });
                if (data.heroImage) {
                    setHeroPreview(data.heroImage);
                }
            } catch (err) {
                setError('Failed to fetch blog data. ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogData();
    }, [slug]);

    // Initialize Editor.js once form data is loaded
    useEffect(() => {
        if (form && !editorRef.current) {
            const initialContent = form.content ? JSON.parse(form.content) : { blocks: [] };
            const editor = new EditorJS({
                holder: 'editorjs-edit',
                data: initialContent,
                tools: {
                    header: Header,
                    list: List,
                    image: {
                        class: ImageTool,
                        config: {
                            uploader: {
                                uploadByFile: async (file) => {
                                    setUploadsInProgress(true);
                                    const url = await uploadImageFile(file);
                                    setUploadsInProgress(false);
                                    return { success: 1, file: { url } };
                                },
                            },
                        },
                    },
                    quote: Quote,
                    table: Table,
                },
            });
            editorRef.current = editor;
        }

        return () => {
            if (editorRef.current && editorRef.current.destroy) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };
    }, [form]);

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    async function uploadImageFile(file) {
        const fd = new FormData();
        const compressed = await compressImage(file);
        fd.append('file', compressed);

        try {
            const res = await fetch(`${API_BASE}/blogs/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            return data.url;
        } catch (err) {
            setError('Image upload failed: ' + err.message);
            return { success: 0 };
        }
    }

    async function handleHeroChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadsInProgress(true);
        try {
            const url = await uploadImageFile(file);
            updateField('heroImage', url);
            setHeroPreview(url);
        } catch (err) {
            setError('Hero image upload failed.');
        } finally {
            setUploadsInProgress(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (uploadsInProgress) {
            setError('Please wait for image uploads to complete.');
            return;
        }

        let content;
        try {
            const outputData = await editorRef.current.save();
            content = JSON.stringify(outputData);
        } catch (err) {
            setError('Failed to save editor content.');
            return;
        }

        const payload = {
            ...form,
            content,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
        };

        setLoading(true);
        try {
            await apiFetch(`/blogs/${slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            setSuccess('Blog updated successfully!');
            setTimeout(() => navigate('/admin/manage-blogs'), 2000);
        } catch (err) {
            setError('Failed to update blog: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading && !form) {
        return <div className="p-6">Loading...</div>;
    }

    if (error && !form) {
        return <div className="p-6 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-brand">Edit Blog</h2>
            {form && (
                <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-xl shadow-sm">
                    {/* Form fields are identical to AddBlog, so they are omitted for brevity */}
                    {/* Main Heading */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Main Heading</label>
                        <input value={form.mainHeading} onChange={e => updateField('mainHeading', e.target.value)} className="mt-1 p-3 border rounded-lg w-full" required />
                    </div>
                    {/* Slug */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Slug</label>
                        <input value={form.slug} onChange={e => updateField('slug', e.target.value)} className="mt-1 p-3 border rounded-lg w-full" required />
                    </div>
                    {/* Hero Image */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Hero Image</label>
                        <input type="file" accept="image/*" onChange={handleHeroChange} className="mt-2" />
                        {heroPreview && <img src={heroPreview} alt="Preview" className="mt-2 max-h-48" />}
                    </div>
                    {/* Content Editor */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Content</label>
                        <div id="editorjs-edit" className="mt-2 border rounded p-4 min-h-[400px]" />
                    </div>
                    {/* ... other form fields like tags, category etc. would go here ... */}
                    
                    <div className="flex items-center gap-4 pt-4">
                        <button disabled={loading || uploadsInProgress} type="submit" className="px-6 py-2 bg-brand text-white rounded hover:bg-brand-dark disabled:opacity-50">
                            {loading ? 'Updating...' : 'Update Blog'}
                        </button>
                        <button type="button" onClick={() => navigate('/admin/manage-blogs')} className="px-6 py-2 border rounded hover:bg-gray-50">
                            Cancel
                        </button>
                    </div>

                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
                    {success && <div className="text-sm text-green-600 bg-green-50 p-3 rounded">{success}</div>}
                </form>
            )}
        </div>
    );
};

export default EditBlog;
