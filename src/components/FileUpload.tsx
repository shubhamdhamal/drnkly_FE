import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description: string;
  icon?: React.ReactNode;
  accept?: string;
  onChange?: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  icon = <Upload className="w-12 h-12" />,
  accept = ".pdf,.jpg,.jpeg,.png",
  onChange,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    onChange?.(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
      />

      {!preview && !fileName ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
        >
          <div className="text-gray-400">{icon}</div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      ) : (
        <div className="relative border rounded-lg p-4">
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-4">
            {preview ? (
              <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <p className="font-medium">{fileName}</p>
              <button
                onClick={() => inputRef.current?.click()}
                className="text-sm text-blue-600 hover:text-blue-700 mt-1"
              >
                Change file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;