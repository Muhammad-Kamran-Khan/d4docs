import React, { useCallback, useEffect, useState, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { io } from 'socket.io-client';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserContext } from '../src/context/userContext';
import Chat from './Chat'; // Import the Chat component

const DocsIcon = () => (
    <svg height="36" viewBox="0 0 36 36" width="36">
        <path d="M25.5 4H10.5C9.67 4 9 4.67 9 5.5v25c0 .83.67 1.5 1.5 1.5h18c.83 0 1.5-.67 1.5-1.5V11L25.5 4z" fill="#2684fc" />
        <path d="M25 12h-6.5c-.83 0-1.5-.67-1.5-1.5V4h1.5v6.5c0 .28.22.5.5.5H25v-1z" fill="#fff" />
    </svg>
);

const ShareIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
);

const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['bold', 'italic', 'underline'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ align: [] }],
    ['image', 'blockquote', 'code-block'],
    ['clean'],
];

export default function TextEditor() {
    const { id: documentId } = useParams();
    const { user, serverUrl } = useUserContext();

    const [socket, setSocket] = useState(null);
    const [quill, setQuill] = useState(null);
    const [documentTitle, setDocumentTitle] = useState('Untitled document');
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [collaboratorEmail, setCollaboratorEmail] = useState('');
    const shareDropdownRef = useRef(null);

    useEffect(() => {
        const s = io('http://localhost:3001', { withCredentials: true });
        setSocket(s);

        const onConnectError = (err) => toast.error(err?.message || 'Socket connection failed');
        const onDocumentError = (message) => toast.error(`Error: ${message}`);
        const onReceiveChanges = (delta) => quill?.updateContents(delta);

        s.on('connect_error', onConnectError);
        s.on('document-error', onDocumentError);
        s.on('receive-changes', onReceiveChanges);

        const handleClickOutside = (event) => {
            if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target)) {
                setIsShareOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            s.disconnect();
            s.off('connect_error', onConnectError);
            s.off('document-error', onDocumentError);
            s.off('receive-changes', onReceiveChanges);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [quill]);

    useEffect(() => {
        if (!socket || !quill) return;
        socket.once('load-document', (doc) => {
            const data = doc?.data ?? { ops: [] };
            const title = doc?.title || 'Untitled document';
            setDocumentTitle(title);
            quill.setContents(data, 'silent');
            quill.enable();
        });
        socket.emit('get-document', documentId);
    }, [socket, quill, documentId]);

    // This useEffect hook had the syntax error which is now fixed.
    useEffect(() => {
        if (documentTitle === 'Untitled document' || !documentTitle) return;
        const handler = setTimeout(async () => { // Corrected this line
            try {
                await axios.patch(`${serverUrl}/api/v1/documents/${documentId}/title`, { title: documentTitle });
                toast.success('Title saved!');
            } catch (error) {
                toast.error('Could not save title.');
            }
        }, 1200);
        return () => clearTimeout(handler);
    }, [documentTitle, documentId, serverUrl]);

    useEffect(() => {
        if (!socket || !quill) return;
        const textChangeHandler = (delta, oldDelta, source) => {
            if (source === 'user') socket.emit('send-changes', delta);
        };
        quill.on('text-change', textChangeHandler);

        const interval = setInterval(() => {
            if (quill.getText().trim() !== '') {
                socket.emit('save-document', quill.getContents());
            }
        }, 3000);

        return () => {
            quill.off('text-change', textChangeHandler);
            clearInterval(interval);
        };
    }, [socket, quill]);

    const wrapperRef = useCallback((wrapper) => {
        if (wrapper == null) return;
        wrapper.innerHTML = '';
        const toolbarHost = document.getElementById('toolbar-host');

        const editorDiv = document.createElement('div');
        editorDiv.className = 'h-full';
        wrapper.append(editorDiv);

        const q = new Quill(editorDiv, {
            theme: 'snow',
            modules: {
                toolbar: TOOLBAR_OPTIONS,
            },
        });

        q.disable();
        q.setText('Connecting...');

        try {
            const tbModule = q.getModule('toolbar');
            if (tbModule && tbModule.container && toolbarHost) {
                toolbarHost.innerHTML = '';
                toolbarHost.appendChild(tbModule.container);
                tbModule.container.classList.add('quill-toolbar-host');
                tbModule.container.querySelectorAll('select').forEach((s) => s.classList.add('ql-small-select'));
                tbModule.container.querySelectorAll('button').forEach((b) => b.classList.add('ql-small-button'));
            }
        } catch (e) {
            // ignore
        }

        setQuill(q);
    }, []);

    const handleInviteCollaborator = async (e) => {
        e.preventDefault();
        if (!collaboratorEmail) return;
        const t = toast.loading(`Inviting ${collaboratorEmail}...`);
        try {
            const o = await axios.post(`${serverUrl}/api/v1/documents/${documentId}/share`, { collaboratorEmail });
            toast.success(o.data.message, { id: t });
            setCollaboratorEmail('');
            setIsShareOpen(false);
        } catch (o) {
            toast.error(o.response?.data?.message || 'Failed to invite', { id: t });
        }
    };

    return (
        <div className="text-editor-container flex flex-col h-screen bg-gray-50">
            <header className="flex items-center px-4 py-2 bg-white shadow-sm z-20 print:hidden">
                <Link to="/" className="flex items-center gap-3">
                    <DocsIcon />
                </Link>

                <input
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="ml-3 px-2 py-1 text-lg rounded-md border border-transparent focus:border-blue-400 outline-none w-80"
                    aria-label="Document title"
                />

                <div className="ml-auto flex items-center gap-3 relative">
                    <button
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md"
                        onClick={() => setIsShareOpen((s) => !s)}
                    >
                        <ShareIcon />
                        <span>Share</span>
                    </button>

                    {isShareOpen && (
                        <div ref={shareDropdownRef} className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg p-4">
                            <h4 className="font-semibold mb-2">Invite to collaborate</h4>
                            <form onSubmit={handleInviteCollaborator} className="flex flex-col gap-2">
                                <input
                                    type="email"
                                    value={collaboratorEmail}
                                    onChange={(e) => setCollaboratorEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    className="border rounded px-2 py-1"
                                    required
                                />
                                <button className="bg-blue-600 text-white px-3 py-1 rounded">Invite</button>
                            </form>
                        </div>
                    )}
                </div>
            </header>

            <div id="toolbar-host" className="bg-white border-b border-gray-200 px-3 py-2 flex justify-center print:hidden">
                <div className="toolbar-inner max-w-3xl w-full"></div>
            </div>

            <main className="flex-1 overflow-auto document-page-wrapper">
                <div className="document-page" ref={wrapperRef}></div>
            </main>

            <div className="chat-widget-container print:hidden">
                <Chat serverUrl={serverUrl} quill={quill} />
            </div>

            <style>{`
                /* Global styles */
                *, *::before, *::after {
                    box-sizing: border-box;
                }
                
                body {
                    background-color: #F3F3F3;
                    margin: 0;
                }

                /* Toolbar styling */
                #toolbar-host { 
                    padding-left: 8px; 
                    padding-right: 8px; 
                }
                .quill-toolbar-host .ql-toolbar.ql-snow { 
                    padding: 4px 6px; 
                    border: none; 
                    font-size: 13px; 
                    display: inline-flex; 
                }
                .quill-toolbar-host .ql-formats { 
                    margin-right: 6px; 
                }
                
                /* Main document area wrapper */
                .document-page-wrapper {
                    display: flex;
                    justify-content: center;
                }
                
                /* Document page container and padding */
                .document-page {
                    width: 8.5in;
                    min-height: 11in;
                    box-shadow: 0 0 5px 0 rgba(0, 0, 0, .5);
                    background-color: white;
                    margin: 1rem 0;
                }

                .ql-container.ql-snow { 
                    border: none;
                }
                .ql-editor { 
                    padding: 1in;
                    font-size: 15px; 
                    min-height: 11in;
                }
                
                /* Corrected Print styles */
                @media print {
                    /* Hide non-essential UI elements. Using a class on the chat container for safety. */
                    header, #toolbar-host, .chat-widget-container {
                        display: none !important;
                    }

                    /* Reset body for a clean print background */
                    body {
                        background-color: #fff;
                    }

                    /* Allow the main container and wrapper to expand with content */
                    .text-editor-container, .document-page-wrapper {
                        height: auto;
                        overflow: visible;
                    }
                    
                    .document-page-wrapper {
                        display: block; /* Ensure it's not a flex container in print */
                    }

                    /* Style the document page itself for printing */
                    .document-page {
                        box-shadow: none;
                        margin: 0;
                        width: 100%;
                        border: none;
                    }
                    
                    /* Ensure the editor content is styled correctly for print */
                    .ql-editor {
                        height: auto;
                        min-height: unset;
                        padding: 1in; /* Ensure margins are present */
                        font-size: 11pt;
                    }

                    .ql-container.ql-snow {
                        border: none;
                    }
                }
            `}</style>
        </div>
    );
}