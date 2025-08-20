import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context/userContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import ProfileSidebar from '../ProfileSidebar'; // Ensure this path is correct

// --- ICONS ---
const DocsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#2684FC" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"></path></svg>;
const MoreIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>;
const PlusIcon = () => <svg width="150" height="190" viewBox="0 0 150 190" style={{position:'absolute'}}><path fill="#4285F4" d="M74 85h2v20h-2z"/><path fill="#34A853" d="M74 85h2v20h-2z" style={{transform: 'rotate(90deg)', transformOrigin: 'center'}} /><path fill="#FBBC05" d="M74 85h2v20h-2z" style={{transform: 'rotate(180deg)', transformOrigin: 'center'}} /><path fill="#EA4335" d="M74 85h2v20h-2z" style={{transform: 'rotate(270deg)', transformOrigin: 'center'}}/></svg>;
const SearchIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#5f6368"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>;
const AZIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#5f6368"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 11.9V11H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"></path></svg>;
const GridIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#5f6368"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"></path></svg>;
const HeaderDocsIcon = () => <svg width="36" height="36" viewBox="0 0 36 36"><path fill="#2684FC" d="M25.5 4H10.5C9.67 4 9 4.67 9 5.5v25c0 .83.67 1.5 1.5 1.5h18c.83 0 1.5-.67 1.5-1.5V11L25.5 4z"></path><path fill="#FFF" d="M25 12h-6.5c-.83 0-1.5-.67-1.5-1.5V4h1.5v6.5c0 .28.22.5.5.5H25v-1z"></path></svg>;


const HomePage = () => {
    const { user, serverUrl } = useUserContext();
    const navigate = useNavigate();

    const [allDocuments, setAllDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('owned-by-anyone');
    const [sortBy, setSortBy] = useState('modified');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);
    const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!user?._id) { setIsLoading(false); return; }
            try {
                const response = await axios.get(`${serverUrl}/api/v1/documents`);
                setAllDocuments(response.data);
            } catch (error) { toast.error("Could not fetch documents."); } finally { setIsLoading(false); }
        };
        fetchDocuments();
    }, [user, serverUrl]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) setIsFilterOpen(false);
            if (menuRef.current && !menuRef.current.contains(event.target)) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredDocuments = useMemo(() => {
        return allDocuments
            .filter(doc => {
                if (filterBy === 'owned-by-me') return doc.owner._id === user._id;
                if (filterBy === 'not-owned-by-me') return doc.owner._id !== user._id;
                return true;
            })
            .filter(doc => (doc.title || "Untitled Document").toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (sortBy === 'title') return (a.title || "").localeCompare(b.title || "");
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });
    }, [allDocuments, searchTerm, filterBy, sortBy, user._id]);

    const handleCreateDocument = async () => {
        const toastId = toast.loading('Creating new document...');
        try {
            const response = await axios.post(`${serverUrl}/api/v1/documents`);
            toast.success('Document created!', { id: toastId });
            navigate(`/documents/${response.data.documentId}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create document', { id: toastId });
        }
    };
    const openDocument = (docId) => navigate(`/documents/${docId}`);

    const handleDeleteDocument = async (docId) => {
        setOpenMenuId(null);
        if (!window.confirm("Are you sure you want to delete this document permanently?")) return;
        const toastId = toast.loading("Deleting document...");
        try {
            await axios.delete(`${serverUrl}/api/v1/documents/${docId}`);
            setAllDocuments(prevDocs => prevDocs.filter(doc => doc._id !== docId));
            toast.success("Document deleted.", { id: toastId });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete document.", { id: toastId });
        }
    };

    return (
        <>
            <style>{`
                body { margin: 0; font-family: 'Roboto', 'Arial', sans-serif; background-color: #fff; }
                .home-header { display: flex; align-items: center; padding: 8px 16px; border-bottom: 1px solid #dadce0; position: sticky; top: 0; background-color: #fff; z-index: 100; }
                .header-left { display: flex; align-items: center; gap: 8px; }
                .header-title { font-size: 22px; color: #5f6368; font-weight: 400; }
                .search-container { flex-grow: 1; display: flex; justify-content: center; padding: 0 60px; }
                .search-bar { display: flex; align-items: center; max-width: 720px; width: 100%; background-color: #f1f3f4; border-radius: 8px; padding: 0 8px; }
                .search-bar:focus-within { background-color: #fff; box-shadow: 0 1px 1px 0 rgba(0,0,0,.1); }
                .search-bar input { width: 100%; border: none; background: transparent; height: 46px; font-size: 16px; padding: 0 12px; outline: none; }
                .header-right { display: flex; align-items: center; gap: 16px; }
                .profile-avatar { width: 32px; height: 32px; border-radius: 50%; background-color: #1a73e8; color: white; display: flex; align-items: center; justify-content: center; font-weight: 500; cursor: pointer; overflow: hidden; }
                .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .templates-section { background-color: #f8f9fa; padding: 24px 0; border-bottom: 1px solid #dadce0; }
                .main-content { max-width: 1000px; margin: 0 auto; padding: 0 24px; }
                .templates-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .templates-header h2 { font-size: 16px; color: #202124; margin: 0; font-weight: 400; }
                .templates-list { display: flex; gap: 16px; }
                .template-card { text-align: left; cursor: pointer; }
                .template-card-preview { width: 150px; height: 190px; border: 1px solid #dadce0; border-radius: 4px; display: flex; align-items: center; justify-content: center; background-color: #fff; transition: border-color 0.2s; position: relative; }
                .template-card-preview:hover { border-color: #1a73e8; }
                .template-card p { margin: 8px 0 0 0; font-weight: 500; color: #202124; font-size: 14px; }
                .documents-section { max-width: 1000px; margin: 16px auto; padding: 0 24px; }
                .documents-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                
                /*
                 * Corrected Dropdown Styles
                 */
                .filter-dropdown-container {
                    position: relative; /* This is crucial for the absolute positioning of the dropdown menu */
                }
                .control-button { 
                    background-color: transparent; border: 1px solid #dadce0; border-radius: 4px; padding: 8px 12px; font-size: 14px; cursor: pointer; color: #3c4043; display: flex; align-items: center; 
                }
                .icon-button { 
                    background-color: transparent; border: 1px solid #dadce0; border-radius: 4px; padding: 8px; cursor: pointer; 
                }
                .documents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
                .document-card { position: relative; }
                .document-preview { height: 220px; border: 1px solid #dadce0; border-radius: 4px; display: flex; align-items: center; justify-content: center; background-color: #fff; transition: border-color 0.2s; cursor: pointer; }
                .document-preview:hover { border-color: #1a73e8; }
                .document-info { padding: 12px 0; }
                .document-title { font-size: 14px; color: #202124; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .document-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #5f6368; margin-top: 4px; }
                .options-btn { position: absolute; top: 8px; right: 8px; background: none; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; }
                .document-card:hover .options-btn { opacity: 1; }
                .options-btn:hover { background-color: #f1f3f4; }
                
                .dropdown-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background-color: #fff;
                    border: 1px solid #dadce0;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 100;
                    min-width: 200px;
                    padding: 8px 0;
                    margin-top: 4px;
                }
                .dropdown-option {
                    padding: 10px 16px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #3c4043;
                    transition: background-color 0.2s;
                    white-space: nowrap;
                }
                .dropdown-option:hover {
                    background-color: #f1f3f4;
                }
                .dropdown-option.active {
                    font-weight: 500;
                    background-color: #e8f0fe;
                    color: #1a73e8;
                }

                .options-menu {
                    position: absolute;
                    top: 40px;
                    right: 8px;
                    background: #fff;
                    border-radius: 4px;
                    box-shadow: 0 2px 6px rgba(0,0,0,.15);
                    z-index: 10;
                    padding: 8px 0;
                    width: 160px;
                }
                .option-item { padding: 8px 16px; cursor: pointer; font-size: 14px; }
                .option-item:hover { background-color: #f1f3f4; }
                .option-item-danger { color: #d93025; }
            `}</style>
            
            <div className="home-page-wrapper">
                <header className="home-header">
                    <div className="header-left"><HeaderDocsIcon /><h1 className="header-title">Docs</h1></div>
                    <div className="search-container"><div className="search-bar"><SearchIcon /><input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
                    <div className="header-right"><div className="profile-avatar" onClick={() => setIsProfileSidebarOpen(true)}>{user?.photo ? (<img src={user.photo} alt={user.name} />) : (<span>{user?.name?.charAt(0).toUpperCase()}</span>)}</div></div>
                </header>

                <div className="templates-section">
                    <div className="main-content">
                        <div className="templates-header"><h2>Start a new document</h2></div>
                        <div className="templates-list">
                            <div className="template-card" onClick={handleCreateDocument}>
                                <div className="template-card-preview"><PlusIcon /></div>
                                <p>Blank document</p>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="documents-section">
                    <div className="documents-controls">
                        {/* Corrected Filter Dropdown */}
                        <div className="filter-dropdown-container" ref={filterRef}>
                            <button className="control-button" onClick={() => setIsFilterOpen(o => !o)}>
                                {filterBy === 'owned-by-anyone' ? 'Owned by anyone' : filterBy === 'owned-by-me' ? 'Owned by me' : 'Not owned by me'} ▼
                            </button>
                            {isFilterOpen && (
                                <div className="dropdown-menu">
                                    <div onClick={() => { setFilterBy('owned-by-anyone'); setIsFilterOpen(false); }} className={`dropdown-option ${filterBy==='owned-by-anyone' && 'active'}`}>Owned by anyone</div>
                                    <div onClick={() => { setFilterBy('owned-by-me'); setIsFilterOpen(false); }} className={`dropdown-option ${filterBy==='owned-by-me' && 'active'}`}>Owned by me</div>
                                    <div onClick={() => { setFilterBy('not-owned-by-me'); setIsFilterOpen(false); }} className={`dropdown-option ${filterBy==='not-owned-by-me' && 'active'}`}>Not owned by me</div>
                                </div>
                            )}
                        </div>
                        <div>
                            <button onClick={() => setSortBy(sortBy === 'title' ? 'modified' : 'title')} className="icon-button" title="Sort by">
                                <AZIcon />
                            </button>
                        </div>
                    </div>

                    {isLoading ? ( <p>Loading documents...</p> ) : (
                        <div className="documents-grid">
                            {filteredDocuments.length > 0 ? (
                                filteredDocuments.map((doc) => (
                                    <div className="document-card" key={doc._id}>
                                        <div className="document-preview" onDoubleClick={() => openDocument(doc._id)}>
                                            <DocsIcon />
                                        </div>
                                        <div className="document-info">
                                            <p className="document-title">{doc.title || "Untitled Document"}</p>
                                            <div className="document-meta">
                                                <DocsIcon />
                                                <span>Opened {new Date(doc.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button className="options-btn" onClick={() => setOpenMenuId(openMenuId === doc._id ? null : doc._id)}>
                                            <MoreIcon />
                                        </button>
                                        {openMenuId === doc._id && (
                                            <div className="options-menu dropdown-menu" ref={menuRef}>
                                                {doc.owner._id === user._id && (
                                                    <div className="dropdown-option option-item-danger" onClick={() => handleDeleteDocument(doc._id)}>Delete</div>
                                                )}
                                                <div className="dropdown-option" onClick={() => openDocument(doc._id)}>Open</div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p>No documents found.</p>
                            )}
                        </div>
                    )}
                </main>
            </div>
            <ProfileSidebar isOpen={isProfileSidebarOpen} onClose={() => setIsProfileSidebarOpen(false)} />
        </>
    );
};

export default HomePage;