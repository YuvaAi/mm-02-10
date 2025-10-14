import React, { useState, useEffect } from 'react';
import { Building2, User, CheckCircle, AlertCircle } from 'lucide-react';

interface LinkedInPage {
  id: string;
  name: string;
  vanityName?: string;
  role: string;
  type: 'personal' | 'organization';
}

interface LinkedInPageSelectorProps {
  pages: LinkedInPage[];
  onPageSelect: (page: LinkedInPage) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const LinkedInPageSelector: React.FC<LinkedInPageSelectorProps> = ({
  pages,
  onPageSelect,
  onCancel,
  isLoading = false
}) => {
  const [selectedPage, setSelectedPage] = useState<LinkedInPage | null>(null);

  // Auto-select personal page if available
  useEffect(() => {
    const personalPage = pages.find(page => page.type === 'personal');
    if (personalPage) {
      setSelectedPage(personalPage);
    }
  }, [pages]);

  const handlePageSelect = (page: LinkedInPage) => {
    setSelectedPage(page);
  };

  const handleConfirm = () => {
    if (selectedPage) {
      onPageSelect(selectedPage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading LinkedIn Pages</h2>
          <p className="text-gray-600">Fetching your LinkedIn pages and organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select LinkedIn Page</h2>
          <p className="text-gray-600">
            Choose which LinkedIn page you want to use for posting content.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedPage?.id === page.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePageSelect(page)}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {page.type === 'organization' ? (
                    <Building2 className="w-8 h-8 text-blue-600" />
                  ) : (
                    <User className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{page.name}</h3>
                  <p className="text-sm text-gray-600">
                    {page.type === 'organization' ? 'Company Page' : 'Personal Profile'}
                  </p>
                  {page.vanityName && (
                    <p className="text-xs text-gray-500">@{page.vanityName}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {selectedPage?.id === page.id ? (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {pages.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pages Found</h3>
            <p className="text-gray-600">
              We couldn't find any LinkedIn pages or organizations associated with your account.
            </p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPage}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue with {selectedPage?.type === 'organization' ? 'Company Page' : 'Personal Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkedInPageSelector;
