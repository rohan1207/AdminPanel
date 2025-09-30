import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import ImageTool from '@editorjs/image';
import Quote from '@editorjs/quote';
import Table from '@editorjs/table';
import { compressImage } from "../utils/compressImage";
import { API_BASE } from "../utils/api";

const AddBlog = () => {
  // Helper to update form fields
  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    mainHeading: '',
    subHeading: '',
    slug: '',
    tags: '',
    category: '',
    status: 'published',
    readingTime: '',
    keywords: '',
    summaryPoints: [''],
    author: '',
    heroImage: '', // will store URL
    shortDescription: '',
    citations: [''],
  });

  const [heroPreview, setHeroPreview] = useState(null);
  const [uploadsInProgress, setUploadsInProgress] = useState(false);

  const token = localStorage.getItem('adminToken');
  
  // Add token validation
  const isValidToken = (token) => {
    if (!token) return false;
    try {
      // Basic JWT structure check (should have 3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Try to decode the payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < now) {
        console.warn('Token is expired');
        return false;
      }
      
      return true;
    } catch (err) {
      console.warn('Invalid token format:', err);
      return false;
    }
  };
  
  if (!token || !isValidToken(token)) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-brand">Add Blog</h2>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-sm text-red-600 mb-3">
            {!token ? 'No admin token found.' : 'Your admin session has expired.'}
            <br />
            You must be logged in as admin to create a blog.
          </p>
          <button 
            onClick={() => {
              localStorage.removeItem('adminToken');
              window.location.href = '/admin/login';
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // Initialize Editor.js on mount
  useEffect(() => {
    let editorInstance;
    const initEditor = async () => {
      // Make sure the element exists and we don't already have an editor
      const editorElement = document.getElementById('editorjs');
      if (editorElement && !editorRef.current) {
        try {
          // Clear any existing content in the element
          editorElement.innerHTML = '';
          
          editorInstance = new EditorJS({
            holder: 'editorjs',
            autofocus: true,
            placeholder: 'Start writing your blog content here...',
            tools: {
              header: Header,
              list: {
                class: List,
                inlineToolbar: true
              },
              image: {
                class: ImageTool,
                config: {
                  uploader: {
                    uploadByFile: async (file) => {
                      try {
                        setUploadsInProgress(true);
                        const url = await uploadImageFile(file);
                        setUploadsInProgress(false);
                        return {
                          success: 1,
                          file: {
                            url: url,
                          }
                        };
                      } catch (error) {
                        setUploadsInProgress(false);
                        console.error('EditorJS image upload failed:', error);
                        return {
                          success: 0,
                          message: error.message || 'Image upload failed'
                        };
                      }
                    },
                    uploadByUrl: async (url) => {
                      // Handle URL-based uploads (paste functionality)
                      try {
                        console.log('URL upload attempted:', url);
                        // For local file URLs (like the temp files in error), we can't upload them
                        if (url.startsWith('file://') || url.includes('AppData/Local/Temp')) {
                          throw new Error('Local files cannot be uploaded. Please use drag & drop or file selection.');
                        }
                        
                        // For external URLs, you might want to download and re-upload to Cloudinary
                        // For now, just return the URL as-is if it's already a valid web URL
                        if (url.startsWith('http://') || url.startsWith('https://')) {
                          return {
                            success: 1,
                            file: {
                              url: url,
                            }
                          };
                        }
                        
                        throw new Error('Invalid URL format');
                      } catch (error) {
                        console.error('URL upload failed:', error);
                        return {
                          success: 0,
                          message: error.message || 'URL upload failed'
                        };
                      }
                    }
                  }
                }
              },
              quote: Quote,
              table: Table
            },
            onReady: () => {
              console.log('EditorJS is ready to work!');
            },
            onChange: (api, event) => {
              console.log('Editor content changed');
            }
          });
          
          await editorInstance.isReady;
          editorRef.current = editorInstance;
          console.log('EditorJS initialized successfully');
        } catch (error) {
          console.error('Failed to initialize EditorJS:', error);
          setError('Failed to initialize editor: ' + error.message);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(initEditor, 200);

    return () => {
      clearTimeout(timeoutId);
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  // For testing without backend - mock image upload
  const TESTING_MODE = false; // Set to true for testing without backend

  // upload a single File to backend which forwards to Cloudinary
  async function uploadImageFile(file) {
    if (TESTING_MODE) {
      console.log('MOCK UPLOAD: Simulating file upload.');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `https://res.cloudinary.com/your-cloud/image/upload/v1234567890/${file.name.replace(/\s+/g, '_')}`;
    }

    console.log('Uploading to backend:', file.name, file.size, 'bytes');
    let fileToUpload = file;
    try {
      if (file instanceof File) {
        fileToUpload = await compressImage(file);
        console.log('Compression complete. New size:', fileToUpload.size, 'bytes');
      }
    } catch (err) {
      console.warn('Compression failed, uploading original file.', err);
    }

    const fd = new FormData();
    fd.append('file', fileToUpload);
    
    try {
      const res = await fetch(`${API_BASE}/blogs/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      
      console.log('Upload response status:', res.status);

      if (!res.ok) {
        const errText = await res.text();
        console.error('Upload error response text:', errText);
        throw new Error(errText || `Upload failed with status ${res.status}`);
      }

      // Robust response parsing: read text once, then interpret
      const contentType = res.headers.get('content-type') || '';
      const raw = await res.text();
      const trimmed = (raw || '').trim();
      console.log('Upload raw response:', { status: res.status, contentType, bodyPreview: trimmed.slice(0, 120) });

      if (!trimmed) {
        throw new Error('Upload succeeded but the server returned an empty response.');
      }

      if (contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const data = JSON.parse(trimmed);
          if (typeof data === 'string' && /^https?:\/\//i.test(data)) {
            return data;
          }
          if (data && typeof data.url === 'string' && /^https?:\/\//i.test(data.url)) {
            return data.url;
          }
          throw new Error('JSON response did not include a valid URL.');
        } catch (e) {
          console.warn('Failed to parse JSON, will try to extract URL from text:', e);
        }
      }

      const match = trimmed.match(/https?:\/\/[\w\-._~:\/?#[\]@!$&'()*+,;=%]+/i);
      if (match) return match[0];

      throw new Error('Received an invalid response from the server.');
    } catch (fetchError) {
      console.error('Network/fetch error during upload:', fetchError);
      throw new Error(`Network error: ${fetchError.message}`);
    }
  }

  async function handleHeroChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('Hero image selected:', file.name, file.size, file.type);
    setError('');
    
    try {
      setUploadsInProgress(true);
      setLoading(true);
      
      console.log('Starting hero image upload...');
      
      // compress then upload
      const compressed = await compressImage(file);
      console.log('Image compressed successfully');
      
      const url = await uploadImageFile(compressed);
      console.log('Hero image uploaded successfully:', url);
      
      updateField('heroImage', url);
      setHeroPreview(url);
      setSuccess('Hero image uploaded successfully!');
      
    } catch (err) {
      console.error('Hero image upload error:', err);
      setError(`Hero image upload failed: ${err.message}`);
      
      // Clear the file input on error
      e.target.value = '';
    } finally {
      setLoading(false);
      setUploadsInProgress(false);
    }
  }

  function handleSummaryPointChange(index, value) {
    const copy = [...form.summaryPoints];
    copy[index] = value;
    updateField('summaryPoints', copy);
  }

  function addSummaryPoint() {
    updateField('summaryPoints', [...form.summaryPoints, '']);
  }

  function removeSummaryPoint(idx) {
    const copy = form.summaryPoints.filter((_, i) => i !== idx);
    updateField('summaryPoints', copy);
  }

  // Function to extract and validate all images in content
  const validateAndExtractImages = (editorOutput) => {
    const imageUrls = [];
    const issues = [];

    if (editorOutput.blocks) {
      editorOutput.blocks.forEach((block, index) => {
        if (block.type === 'image') {
          const url = block.data?.file?.url;
          if (url) {
            imageUrls.push(url);
            // Check if it's a Cloudinary URL (basic check)
            if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
              issues.push(`Block ${index + 1}: Image may not be stored on Cloudinary`);
            }
          } else {
            issues.push(`Block ${index + 1}: Image block missing URL`);
          }
        }
      });
    }

    return { imageUrls, issues };
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (uploadsInProgress) {
      setError('Image uploads are still in progress. Please wait for them to finish before submitting.');
      return;
    }

    let content = '';
    let editorOutput = null;
    if (editorRef.current && editorRef.current.save) {
      try {
        editorOutput = await editorRef.current.save();
        content = JSON.stringify(editorOutput);
        console.log('Editor content:', JSON.stringify(editorOutput, null, 2));
        
        if (!editorOutput.blocks || editorOutput.blocks.length === 0) {
          setError('Please add some content to your blog post');
          return;
        }
      } catch (err) {
        console.error('Failed to save editor content:', err);
        setError('Failed to get editor content: ' + err.message);
        return;
      }
    } else {
      console.warn('Editor not initialized or save method not available');
      setError('Editor not initialized properly');
      return;
    }

    const { imageUrls, issues } = validateAndExtractImages(editorOutput);
    
    console.log('=== IMAGE ANALYSIS ===');
    console.log('Hero Image URL:', form.heroImage || 'None');
    console.log('Content Images:', imageUrls);
    console.log('Total Images:', (form.heroImage ? 1 : 0) + imageUrls.length);
    if (issues.length > 0) {
      console.warn('Image Issues:', issues);
    }
    console.log('=== END IMAGE ANALYSIS ===');

    const payload = {
      ...form,
      content,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
      readingTime: form.readingTime ? Number(form.readingTime) : 0,
      citations: form.citations.filter(c => c.trim()),
      imageMetadata: {
        heroImageUrl: form.heroImage || null,
        contentImageUrls: imageUrls,
        totalImages: (form.heroImage ? 1 : 0) + imageUrls.length
      }
    };

    try {
      setLoading(true);
      
      const res = await fetch(`${API_BASE}/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      console.log('Create blog response status:', res.status, res.statusText);
      
      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        throw new Error('Your session has expired. Please login again.');
      }
      
      if (!res.ok) {
        const errText = await res.text();
        console.error('Create blog error response text:', errText);
        throw new Error(errText || `Request failed with status ${res.status}`);
      }

      // Robust response parsing similar to upload: read once, then interpret
      const contentType = res.headers.get('content-type') || '';
      const raw = await res.text();
      const trimmed = (raw || '').trim();
      console.log('Create blog raw response:', { status: res.status, contentType, bodyPreview: trimmed.slice(0, 200) });

      if (!trimmed) {
        throw new Error('Create blog: server returned an empty response.');
      }

      let created;
      if (contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          created = JSON.parse(trimmed);
        } catch (e) {
          throw new Error('Create blog: invalid JSON returned by server.');
        }
      } else {
        // Not JSON => treat as error to avoid false positive
        throw new Error(`Create blog: unexpected response type (${contentType || 'unknown'}).`);
      }

      // Validate expected fields
      if (!created || created.success !== true || !created.blog || !created.blog.slug) {
        throw new Error('Create blog: response missing success/blog data.');
      }

      console.log('Blog created successfully:', created);
      setSuccess('Blog created and saved successfully!');
      
      setTimeout(() => {
        if (window.confirm('Blog created successfully! Would you like to create another blog?')) {
          setForm({
            mainHeading: '', subHeading: '', slug: '', tags: '', category: '',
            status: 'published', readingTime: '', keywords: '', summaryPoints: [''],
            author: '', heroImage: '', shortDescription: '', citations: [''],
          });
          setHeroPreview(null);
          if (editorRef.current && editorRef.current.clear) {
            editorRef.current.clear();
          }
        } else {
          navigate('/admin/manage-blogs');
        }
      }, 2000);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create blog');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-brand">Add New Blog</h2>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Main Heading <span className="text-red-500">*</span></span>
            <input 
              value={form.mainHeading} 
              onChange={e => updateField('mainHeading', e.target.value)} 
              placeholder="Enter main heading" 
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
              required
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Sub Heading</span>
            <input 
              value={form.subHeading} 
              onChange={e => updateField('subHeading', e.target.value)} 
              placeholder="Enter sub heading" 
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Slug (URL) <span className="text-red-500">*</span></span>
            <input 
              value={form.slug} 
              onChange={e => updateField('slug', e.target.value)} 
              placeholder="my-awesome-article" 
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
              required
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Category</span>
            <input 
              value={form.category} 
              onChange={e => updateField('category', e.target.value)} 
              placeholder="Enter category"
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Tags <span className="text-gray-400">(comma separated)</span></span>
            <input 
              value={form.tags} 
              onChange={e => updateField('tags', e.target.value)} 
              placeholder="tag1, tag2, tag3"
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Reading Time <span className="text-gray-400">(minutes)</span></span>
            <input 
              type="number" 
              value={form.readingTime} 
              onChange={e => updateField('readingTime', e.target.value)} 
              placeholder="5"
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Author</span>
            <input 
              value={form.author} 
              onChange={e => updateField('author', e.target.value)} 
              placeholder="Author name"
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Keywords <span className="text-gray-400">(comma separated)</span></span>
            <input 
              value={form.keywords} 
              onChange={e => updateField('keywords', e.target.value)} 
              placeholder="keyword1, keyword2"
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
            />
          </label>
        </div>

        <div>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Hero Image</span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleHeroChange} 
              className="mt-2" 
            />
            {heroPreview && (
              <img 
                src={heroPreview} 
                alt="hero preview" 
                className="mt-2 max-h-48 object-contain border rounded" 
              />
            )}
          </label>
        </div>

        <div>
          <label className="flex flex-col">
            <span className="text-sm font-medium">Short Description</span>
            <textarea 
              value={form.shortDescription} 
              onChange={e => updateField('shortDescription', e.target.value)} 
              placeholder="Brief description of the blog post"
              className="mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
              rows={3} 
            />
          </label>
        </div>

        <div>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Content <span className="text-red-500">*</span></span>
            <div className="mt-2">
              <div 
                id="editorjs" 
                className="border rounded p-4 min-h-[400px] bg-white"
                style={{ minHeight: '400px' }}
              />
            </div>
          </label>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Summary Points</h3>
          <div className="space-y-2">
            {form.summaryPoints.map((p, i) => (
              <div key={`summary-${i}`} className="flex gap-2">
                <input 
                  value={p} 
                  onChange={e => handleSummaryPointChange(i, e.target.value)} 
                  placeholder={`Summary point ${i + 1}`}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
                />
                {form.summaryPoints.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeSummaryPoint(i)} 
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={addSummaryPoint} 
              className="mt-2 px-4 py-2 bg-[#E6F4F1] text-[#006D5B] rounded-lg hover:bg-[#D6EDE5] transition-colors flex items-center gap-1 font-medium"
            >
              Add Point
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Citations</h3>
          <div className="space-y-2">
            {form.citations.map((c, i) => (
              <div key={`citation-${i}`} className="flex gap-2">
                <input 
                  value={c} 
                  onChange={e => {
                    const copy = [...form.citations];
                    copy[i] = e.target.value;
                    updateField('citations', copy);
                  }} 
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D5B]/50 focus:border-[#006D5B] outline-none transition-all duration-200" 
                  placeholder="Citation or reference URL" 
                />
                {form.citations.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => {
                      const copy = form.citations.filter((_, idx) => idx !== i);
                      updateField('citations', copy);
                    }} 
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => updateField('citations', [...form.citations, ''])} 
              className="mt-2 px-4 py-2 bg-[#E6F4F1] text-[#006D5B] rounded-lg hover:bg-[#D6EDE5] transition-colors flex items-center gap-1 font-medium"
            >
              Add Citation
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button 
            disabled={loading || uploadsInProgress} 
            type="submit" 
            className="px-6 py-2 bg-brand text-white rounded hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Create Blog (Console Log)'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/admin')} 
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        {uploadsInProgress && (
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Image uploads in progress... Please wait before submitting.
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
            {success}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddBlog;