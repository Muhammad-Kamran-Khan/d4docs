import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DashboardPage = () => {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch('/api/v1/documents', {
                    credentials: 'include', // Sends the auth cookie
                });
                if (!response.ok) throw new Error('Could not fetch documents');
                const data = await response.json();
                setDocuments(data);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDocuments();
    }, []);

    const handleCreateDocument = async () => {
        const toastId = toast.loading('Creating new document...');
        try {
            const response = await fetch('/api/v1/documents', {
                method: 'POST',
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to create document');
            const data = await response.json();
            toast.success('Document created!', { id: toastId });
            navigate(`/documents/${data.documentId}`);
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    if (isLoading) return <div>Loading documents...</div>;

    return (
        <div className="dashboard-container">
            <h1>Your Documents</h1>
            <button onClick={handleCreateDocument} className="create-btn">
                + Create New Document
            </button>
            <div className="document-list">
                {documents.length > 0 ? (
                    documents.map(doc => (
                        <Link to={`/documents/${doc._id}`} key={doc._id} className="document-card">
                            <h3>{doc.title}</h3>
                            <p>Last updated: {new Date(doc.updatedAt).toLocaleDateString()}</p>
                        </Link>
                    ))
                ) : (
                    <p>You have no documents. Create one to get started!</p>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;