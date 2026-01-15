import React, { useState, useEffect } from 'react';
import { Camera, Trash2, X, Maximize2, Loader2, Plus } from 'lucide-react';
import { ConfirmDialog } from './ui/ConfirmDialog';
import './PhotoGallery.css';

export function PhotoGallery({ entityType, entityId }) {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoData, setPhotoData] = useState({});
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

    useEffect(() => {
        loadPhotos();
    }, [entityId]);

    const loadPhotos = async () => {
        setLoading(true);
        try {
            const list = await window.go.main.PhotoService.GetPhotos(entityType, entityId);
            setPhotos(list || []);

            // Load base64 for each photo if list is small
            if (list && list.length > 0) {
                const dataMap = {};
                for (const p of list) {
                    const base64 = await window.go.main.PhotoService.GetPhotoBase64(p.id);
                    dataMap[p.id] = base64;
                }
                setPhotoData(dataMap);
            }
        } catch (err) {
            console.error('Failed to load photos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        setUploading(true);
        try {
            const photo = await window.go.main.PhotoService.UploadPhoto(entityType, entityId, "");
            if (photo) {
                setPhotos(prev => [photo, ...prev]);
                const base64 = await window.go.main.PhotoService.GetPhotoBase64(photo.id);
                setPhotoData(prev => ({ ...prev, [photo.id]: base64 }));
            }
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        setConfirmDelete({ show: true, id });
    };

    const confirmDeletePhoto = async () => {
        const id = confirmDelete.id;
        try {
            await window.go.main.PhotoService.DeletePhoto(id);
            setPhotos(prev => prev.filter(p => p.id !== id));
            const newData = { ...photoData };
            delete newData[id];
            setPhotoData(newData);
            setConfirmDelete({ show: false, id: null });
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="photo-gallery loading">
                <Loader2 className="animate-spin" size={20} />
                <span>Loading photos...</span>
            </div>
        );
    }

    return (
        <div className="photo-gallery">
            <div className="gallery-header">
                <h3><Camera size={18} /> Photos</h3>
                <button
                    className="upload-btn"
                    onClick={handleUpload}
                    disabled={uploading}
                >
                    {uploading ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                    Add Photo
                </button>
            </div>

            <div className="photos-grid">
                {photos.length === 0 ? (
                    <div className="no-photos">
                        <p>No photos attached yet.</p>
                    </div>
                ) : (
                    photos.map(photo => (
                        <div
                            key={photo.id}
                            className="photo-card"
                            onClick={() => setSelectedPhoto(photo)}
                        >
                            <img src={photoData[photo.id] || ''} alt="Attachment" />
                            <div className="photo-overlay">
                                <button
                                    className="delete-btn"
                                    onClick={(e) => handleDelete(photo.id, e)}
                                    title="Delete photo"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <div className="zoom-icon"><Maximize2 size={16} /></div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedPhoto && (
                <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setSelectedPhoto(null)}>
                            <X size={24} />
                        </button>
                        <img src={photoData[selectedPhoto.id]} alt="Full view" />
                        <div className="photo-info">
                            <span className="photo-date">
                                Added: {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDelete.show}
                onClose={() => setConfirmDelete({ show: false, id: null })}
                onConfirm={confirmDeletePhoto}
                title="Delete Photo"
                message="Are you sure you want to delete this photo? This action cannot be undone."
                type="danger"
                confirmText="Delete Photo"
            />
        </div>
    );
}
