import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Phone, Mail, FileText, Clock, AlertTriangle, Info } from 'lucide-react';

const categories = [
  { name: 'Order Issues', icon: '📦', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'Payment Issues', icon: '💳', color: 'bg-green-50 border-green-200 text-green-700' },
  { name: 'Delivery Issues', icon: '🚚', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { name: 'Product Quality Issues', icon: '⭐', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'Technical Issues', icon: '🔧', color: 'bg-red-50 border-red-200 text-red-700' },
  { name: 'Other', icon: '❓', color: 'bg-gray-50 border-gray-200 text-gray-700' },
];

const priorityLevels = [
  { name: 'Low', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', icon: Info },
  { name: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200', icon: Clock },
  { name: 'High', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', icon: AlertTriangle },
];

function App() {
  const [category, setCategory] = useState('Order Issues');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [updates, setUpdates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('Please provide an issue description.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData();
    formData.append('category', category);
    formData.append('description', description);
    if (file) formData.append('file', file);
    formData.append('orderOrTransactionId', transactionId);
    formData.append('priority', priority);
    formData.append('contactEmail', email);
    formData.append('contactPhone', phone);
    formData.append('receiveUpdates', updates.toString());

    try {
      // Simulate API call for demo purposes
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation, uncomment below:
      /*
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Login required to report an issue.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/issues/report', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit issue');
      }
      */

      setSubmitStatus('success');

      // Reset form
      setCategory('Order Issues');
      setDescription('');
      setTransactionId('');
      setPriority('Medium');
      setEmail('');
      setPhone('');
      setFile(null);
      setUpdates(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error submitting issue:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Report an Issue</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're here to help. Please provide details about your issue and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800 font-medium">Issue submitted successfully! We'll get back to you soon.</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 font-medium">Failed to submit issue. Please try again.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Issue Categories */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Issue Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <label
                      key={cat.name}
                      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${category === cat.name
                          ? `${cat.color} border-current shadow-md`
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.name}
                        checked={category === cat.name}
                        onChange={(e) => setCategory(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="font-medium text-sm">{cat.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Issue Description */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Issue Description *
                </label>
                <textarea
                  className="w-full border-2 border-gray-200 rounded-xl p-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-0 transition-colors duration-200 resize-none"
                  placeholder="Please describe your issue in detail. Include any relevant information that might help us resolve it faster..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  {description.length}/500 characters
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Attach File (Optional)
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${dragActive
                      ? 'border-blue-400 bg-blue-50'
                      : file
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />

                  {file ? (
                    <div className="space-y-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                        <Upload className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900 mb-1">
                          Drop your file here, or{' '}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            browse
                          </button>
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports: Images, PDF, DOC, DOCX, TXT (Max 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Order ID / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="Enter your order or transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                />
              </div>

              {/* Priority Level */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Priority Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {priorityLevels.map((level) => {
                    const IconComponent = level.icon;
                    return (
                      <label
                        key={level.name}
                        className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${priority === level.name
                            ? `${level.bgColor} border-current shadow-md`
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={level.name}
                          checked={priority === level.name}
                          onChange={(e) => setPriority(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <IconComponent className={`w-5 h-5 ${level.color}`} />
                          <span className={`font-medium ${level.color}`}>{level.name}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Contact Details */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Contact Details <span className="text-gray-500 text-base font-normal">(Optional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Your phone number"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Updates Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="updates"
                  checked={updates}
                  onChange={() => setUpdates(!updates)}
                  className="mt-1 w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="updates" className="text-gray-700 cursor-pointer">
                  <span className="font-medium">Receive updates about this issue</span>
                  <p className="text-sm text-gray-500 mt-1">
                    We'll send you email notifications when there are updates on your issue status.
                  </p>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting Issue...
                  </div>
                ) : (
                  'Submit Issue Report'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">

        </div>
      </div>
    </div>
  );
}

export default App;