import React, { useState } from 'react';
import { Building2, User, X, CheckCircle } from 'lucide-react';
import { UserCredentials } from '../firebase/types';

interface LinkedInPage {
  id: string;
  name: string;
  vanityName?: string;
  role: string;
  type: 'personal' | 'organization';
}

interface LinkedInPageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPageSelect: (pageId: string, pageName: string, isOrganization: boolean) => void;
  credentials: UserCredentials;
}

const LinkedInPageSelectionModal: React.FC<LinkedInPageSelectionModalProps> = ({
  isOpen,
  onClose,
  onPageSelect,
  credentials
}) => {
  const [selectedPage, setSelectedPage] = useState<LinkedInPage | null>(null);

  if (!isOpen) return null;

  // Build the list of available pages
  const availablePages: LinkedInPage[] = [];

  // Add personal profile if available
  if (credentials.linkedInUserId) {
    availablePages.push({
      id: credentials.linkedInUserId,
      name: credentials.linkedInPageName || 'Personal Profile',
      role: 'Owner',
      type: 'personal'
    });
  }

  // Add organization pages if available
  if (credentials.organizationPages && credentials.organizationPages.length > 0) {
    credentials.organizationPages.forEach(orgPage => {
      availablePages.push({
        id: orgPage.id,
        name: orgPage.name,
        vanityName: orgPage.vanityName,
        role: orgPage.role,
        type: 'organization'
      });
    });
  }

  const handlePageSelect = (page: LinkedInPage) => {
    setSelectedPage(page);
  };

  const handleConfirm = () => {
    if (selectedPage) {
      onPageSelect(
        selectedPage.id,
        selectedPage.name,
        selectedPage.type === 'organization'
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Select LinkedIn Page</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <p className="text-gray-600 mb-6">
            Choose which LinkedIn page you want to use for posting content.
          </p>

          <div className="space-y-4">
            {availablePages.map((page) => (
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
                    <p className="text-xs text-gray-500">Role: {page.role}</p>
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

          {availablePages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No LinkedIn pages found.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPage}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Select Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkedInPageSelectionModal;
