/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// --- ICONS (as React components for easier use) ---
const CommentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894z"/></svg>;
const AttachmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v8a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v8a3.5 3.5 0 1 1-7 0V3z"/></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/><path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/></svg>;

// --- DATA STRUCTURES AND TYPES ---
type UserRole = 'Editor' | 'Graphic Designer' | 'Camera Man' | 'Model' | 'Web Developer' | 'Manager' | 'Founder' | string;
type UserType = 'staff' | 'brand';
type TaskStatus = 'Pending' | 'In Progress' | 'Blocked' | 'For Review' | 'Completed' | 'Pending Transfer';

interface User {
  id: number;
  name: string;
  username: string; // Full username, e.g., alice@bihstaff
  password?: string; // For mock auth
  role: UserRole | null;
  userType: UserType;
  isPrimary?: boolean; // To protect the first founder
  totalStars: number;
  monthlyStars: number;
  profilePicture?: string;
  dob?: string;
  contactNumber?: string;
  instagramId?: string;
  bio?: string;
}

interface Attachment {
    fileName: string;
    url: string; // Mock URL
}

interface Comment {
    userId: number;
    text: string;
    timestamp: string;
    attachment?: Attachment;
}

interface HistoryEntry {
    userId: number;
    action: string;
    timestamp: string;
    details?: string;
}

interface TransferRequest {
    fromUserId: number;
    toUserId: number;
    reason: string;
}

interface InvitationRequest {
    fromUserId: number;
    toUserId: number;
    reason: string;
    status: 'pending' | 'accepted' | 'declined';
}

interface Task {
  id: number;
  title: string;
  description: string;
  assignedTo: number[]; // User IDs
  startTime: string; // ISO string for start date and time
  endTime: string; // ISO string for end date and time
  status: TaskStatus;
  brandId: number | null; // ID of the tagged brand user
  comments: Comment[];
  attachments: Attachment[];
  history: HistoryEntry[];
  ratings: { [raterId: number]: number };
  transferRequest?: TransferRequest;
  invitationRequest?: InvitationRequest;
  isBrandRequested?: boolean;
}

interface TaskRequest {
  id: number;
  brandId: number;
  title: string;
  description: string;
  requestedManagerId: number | null;
  requestedEndTime: string;
  status: 'pending' | 'approved' | 'declined';
}

interface DeletionRequest {
    id: number;
    requestedById: number;
    targetUserId: number;
    reason: string;
    status: 'pending';
}

type BirthdayWishType = 'text' | 'emoji' | 'voice';

interface BirthdayWish {
    userId: number;
    birthdayUserId: number;
    type: BirthdayWishType;
    content: string; 
    timestamp: string;
}

// --- MOCK DATA ---
const initialUsers: User[] = [
  { id: 1, name: 'Alice', username: 'alice@bihstaff', role: 'Graphic Designer', userType: 'staff', password: 'password123', totalStars: 15, monthlyStars: 5, profilePicture: 'https://i.pravatar.cc/150?u=1', dob: '1995-05-15', contactNumber: '123-456-7890', instagramId: 'alice.design', bio: 'Creative soul with a passion for pixels. Lover of coffee and clean layouts.' },
  { id: 2, name: 'Bob', username: 'bob@bihstaff', role: 'Web Developer', userType: 'staff', password: 'password123', totalStars: 5, monthlyStars: 5, profilePicture: 'https://i.pravatar.cc/150?u=2', dob: new Date().toISOString().split('T')[0], contactNumber: '987-654-3210', instagramId: 'bob.dev', bio: 'Building the web, one line of code at a time.' },
  { id: 3, name: 'Charlie', username: 'charlie@bihstaff', role: 'Editor', userType: 'staff', password: 'password123', totalStars: 8, monthlyStars: 0, profilePicture: 'https://i.pravatar.cc/150?u=3', bio: 'Wordsmith. I make sentences shine.' },
  { id: 4, name: 'Diana', username: 'diana@bihstaff', role: 'Camera Man', userType: 'staff', password: 'password123', totalStars: 22, monthlyStars: 13, profilePicture: 'https://i.pravatar.cc/150?u=4' },
  { id: 5, name: 'Eve', username: 'eve@bihstaff', role: 'Model', userType: 'staff', password: 'password123', totalStars: 22, monthlyStars: 9, profilePicture: 'https://i.pravatar.cc/150?u=5' },
  { id: 6, name: 'Frank', username: 'frank@bihstaff', role: 'Manager', userType: 'staff', password: 'password123', totalStars: 0, monthlyStars: 0, profilePicture: 'https://i.pravatar.cc/150?u=6' },
  { id: 7, name: 'Aman', username: 'aman@bih', role: 'Founder', userType: 'staff', password: 'Base@!9098', isPrimary: true, totalStars: 0, monthlyStars: 0, profilePicture: 'https://i.pravatar.cc/150?u=7', dob: '1988-01-01', contactNumber: '555-555-5555', instagramId: 'aman.bih', bio: 'Leading the charge to build amazing things.' },
  { id: 8, name: 'Nike', username: 'nike@bihbrand', role: null, userType: 'brand', password: 'password123', totalStars: 0, monthlyStars: 0 },
  { id: 9, name: 'Adidas', username: 'adidas@bihbrand', role: null, userType: 'brand', password: 'password123', totalStars: 0, monthlyStars: 0 },
  { id: 10, name: 'Base Brand', username: 'base@bihbrand', role: null, userType: 'brand', password: 'Base@!9098', totalStars: 0, monthlyStars: 0 },
];

const now = new Date();
const tomorrow = new Date(new Date().setDate(now.getDate() + 1));
const dayAfter = new Date(new Date().setDate(now.getDate() + 2));
const yesterday = new Date(new Date().setDate(now.getDate() - 1));
const twoDaysAgo = new Date(new Date().setDate(now.getDate() - 2));


const initialTasks: Task[] = [
  { id: 1, title: 'Design new social media campaign assets', description: 'Create a set of 5 unique visual assets for the upcoming Nike Air launch. Assets should be optimized for Instagram, Facebook, and Twitter. Please refer to the attached creative brief for brand guidelines.', assignedTo: [1], startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), endTime: new Date(now.getTime() + 8 * 60 * 1000).toISOString(), status: 'In Progress', brandId: 8, comments: [{userId: 6, text: "Let's get this done by EOD.", timestamp: new Date().toISOString()}], attachments: [{fileName: 'Creative_Brief.pdf', url: '#'}], history: [{userId: 6, action: 'Task Created', timestamp: new Date().toISOString()}], ratings: {}},
  { id: 2, title: 'Fix login bug on the main website', description: 'Users are reporting that the "Forgot Password" link is broken. This is a high priority issue. The bug seems to be located in the auth controller.', assignedTo: [2], startTime: now.toISOString(), endTime: tomorrow.toISOString(), status: 'Pending', brandId: null, comments: [], attachments: [], history: [{userId: 7, action: 'Task Created', timestamp: new Date().toISOString()}], ratings: {}},
  { id: 3, title: 'Review and edit blog post for Q3', description: 'Review the draft for the Q3 market analysis blog post. Check for grammar, tone of voice, and accuracy of data. The draft is attached.', assignedTo: [3], startTime: tomorrow.toISOString(), endTime: dayAfter.toISOString(), status: 'Pending', brandId: 9, comments: [], attachments: [], history: [{userId: 6, action: 'Task Created', timestamp: new Date().toISOString()}], ratings: {}},
  { id: 4, title: 'Photoshoot for the new product line', description: 'Full day photoshoot for the new "Urban Explorer" collection. See moodboard and product list for details on required shots.', assignedTo: [4, 5], startTime: twoDaysAgo.toISOString(), endTime: yesterday.toISOString(), status: 'Completed', brandId: 8, comments: [{userId: 4, text: 'All shots are done and uploaded to the drive!', timestamp: yesterday.toISOString(), attachment: {fileName: 'Final_Shots.zip', url: '#'}}], attachments: [{fileName: 'Moodboard.zip', url: '#'}, {fileName: 'Product_List.docx', url: '#'}], history: [{userId: 7, action: 'Task Created', timestamp: new Date().toISOString()}, {userId: 4, action: 'Status changed to Completed', timestamp: new Date().toISOString()}], ratings: { '7': 5, '8': 4 }},
  { id: 6, title: 'Develop landing page for new campaign', description: 'Build a new landing page based on the provided Figma designs. Page needs to be responsive and optimized for fast loading.', assignedTo: [2], startTime: dayAfter.toISOString(), endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'Pending', brandId: 9, comments: [], attachments: [], history: [{userId: 6, action: 'Task Created', timestamp: new Date().toISOString()}], ratings: {}, isBrandRequested: true},
  { id: 7, title: 'Finalize copy for website homepage', description: 'The current homepage copy needs a refresh. The goal is to make it more engaging and clearly state our value proposition. I am currently blocked waiting for design wireframes.', assignedTo: [3], startTime: yesterday.toISOString(), endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'Blocked', brandId: null, comments: [{userId: 3, text: "I'm blocked on this until I get the final wireframes.", timestamp: new Date().toISOString()}], attachments: [], history: [{userId: 6, action: 'Task Created', timestamp: new Date().toISOString()}], ratings: {}},
  { id: 8, title: 'Review campaign performance', description: 'Analyze the performance data from the last campaign and prepare a report with key insights and recommendations for the next one.', assignedTo: [6], startTime: now.toISOString(), endTime: tomorrow.toISOString(), status: 'For Review', brandId: 8, comments: [], attachments: [], history: [{userId: 7, action: 'Task Created', timestamp: new Date().toISOString()}], ratings: {}},
];

const initialTaskRequests: TaskRequest[] = [
    { id: 1, brandId: 8, title: 'New "Summer Vibes" Influencer Campaign', description: 'We need a full campaign plan and creative assets for an influencer push in July. Please assign a manager to oversee this.', requestedManagerId: 6, requestedEndTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending' },
    { id: 2, brandId: 9, title: 'Homepage Refresh Mockups', description: 'Requesting mockups for a homepage redesign. Focus on a cleaner, more modern look.', requestedManagerId: null, requestedEndTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'approved'},
    { id: 3, brandId: 9, title: 'A/B Test for Checkout Flow', description: 'Can we run an A/B test on a new one-page checkout flow?', requestedManagerId: 6, requestedEndTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), status: 'declined'},
];

const initialRoles: UserRole[] = ['Editor', 'Graphic Designer', 'Camera Man', 'Model', 'Web Developer'];
const initialDeletionRequests: DeletionRequest[] = [];
const initialBirthdayWishes: BirthdayWish[] = [];

// --- HELPER FUNCTIONS ---
const getUserById = (id: number | null, users: User[]) => users.find(user => user.id === id);
const formatForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// --- UI COMPONENTS ---
const UserDisplay = ({ user, onClick, isClickable }: { user: User | undefined; onClick?: (user: User, event: React.MouseEvent) => void; isClickable?: boolean; }) => {
    if (!user) return null;
    const content = (
        <>
            {user.userType === 'staff' && (
                <span className="user-rating-badge" title={`${user.totalStars} total rating points`}>
                    ✨{user.totalStars}
                </span>
            )}
            {user.name}
        </>
    );
    if (isClickable && onClick) {
        return (
            <button className="user-display clickable" onClick={(event) => onClick(user, event)}>
                {content}
            </button>
        );
    }
    return <span className="user-display">{content}</span>;
};

const StarRating = ({ rating, onRate, disabled = false, maxStars = 5 }: { rating: number; onRate: (rating: number) => void; disabled?: boolean; maxStars?: number; }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div className="star-rating" onMouseLeave={() => setHoverRating(0)}>
            {[...Array(maxStars)].map((_, i) => {
                const starValue = i + 1;
                return (
                    <button
                        type="button"
                        key={starValue}
                        className={starValue <= (hoverRating || rating) ? 'on' : 'off'}
                        onClick={() => !disabled && onRate(starValue)}
                        onMouseEnter={() => !disabled && setHoverRating(starValue)}
                        disabled={disabled}
                        aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                    >
                        &#9733;
                    </button>
                );
            })}
        </div>
    );
};

const ProfileModal = ({ user, currentUser, onClose, onUpdateProfile }: { user: User; currentUser: User; onClose: () => void; onUpdateProfile: (user: User) => void; }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name || '',
        dob: user.dob || '',
        contactNumber: user.contactNumber || '',
        instagramId: user.instagramId || '',
        bio: user.bio || '',
    });

    useEffect(() => {
        setFormData({
            name: user.name || '',
            dob: user.dob || '',
            contactNumber: user.contactNumber || '',
            instagramId: user.instagramId || '',
            bio: user.bio || '',
        });
        setIsEditing(false);
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile({ ...user, ...formData });
        setIsEditing(false);
    };

    const isCurrentUserProfile = currentUser.id === user.id;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="profile-modal-content modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-button">&times;</button>
                <div className="profile-modal-body">
                    <div className="profile-picture-container">
                        <img src={user.profilePicture || 'https://i.pravatar.cc/150?u=default'} alt={user.name} className="profile-picture" />
                        {isCurrentUserProfile && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="edit-profile-button">Edit Profile</button>
                        )}
                    </div>
                    {!isEditing ? (
                        <div className="profile-details-view">
                            <h3><UserDisplay user={user} isClickable={false} /></h3>
                            <p className="profile-role">{user.role}</p>
                            <div className="profile-info-grid">
                                <div><strong>Contact:</strong> {user.contactNumber || 'N/A'}</div>
                                <div><strong>Birthday:</strong> {user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}</div>
                                <div><strong>Instagram:</strong> {user.instagramId ? `@${user.instagramId}` : 'N/A'}</div>
                            </div>
                            <h4>Bio</h4>
                            <p className="profile-bio">{user.bio || 'No bio provided.'}</p>
                        </div>
                    ) : (
                        <form className="profile-edit-form" onSubmit={handleSave}>
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="dob">Date of Birth</label>
                                <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="contactNumber">Contact Number</label>
                                <input type="text" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="instagramId">Instagram ID</label>
                                <input type="text" id="instagramId" name="instagramId" value={formData.instagramId} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bio">Bio</label>
                                <textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} rows={4}></textarea>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setIsEditing(false)} className="cancel-button">Cancel</button>
                                <button type="submit" className="submit-button">Save Changes</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const CompleteTaskModal = ({ task, onClose, onConfirm }: { task: Task; onClose: () => void; onConfirm: (taskId: number, commentText: string, file: File | null) => void; }) => {
    const [commentText, setCommentText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const canSubmit = commentText.trim() !== '' || file !== null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (canSubmit) {
            onConfirm(task.id, commentText, file);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="complete-task-modal-content modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-button">&times;</button>
                <header className="modal-header">
                    <h3>Complete Task: {task.title}</h3>
                </header>
                <form onSubmit={handleSubmit} className="modal-body">
                    <p>To complete this task, please provide a final comment and/or attach the final deliverable. This is required.</p>
                    <div className="form-group">
                        <label htmlFor="completion-comment">Comment</label>
                        <textarea
                            id="completion-comment"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="e.g., Final assets are attached."
                            rows={4}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="completion-attachment">Attachment</label>
                        <input
                            id="completion-attachment"
                            type="file"
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
                        <button type="submit" disabled={!canSubmit} className="submit-button">Mark as Complete</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RequestModal = ({ title, users, onSubmit, onCancel, submitText }: { title: string, users: User[], onSubmit: (userId: number, reason: string) => void, onCancel: () => void, submitText: string }) => {
    const [userId, setUserId] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(userId && reason) {
            onSubmit(parseInt(userId), reason);
        }
    };
    
    return (
         <div className="modal-overlay">
            <div className="request-modal-content modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onCancel} className="modal-close-button">&times;</button>
                <header className="modal-header"><h3>{title}</h3></header>
                <form onSubmit={handleSubmit} className="modal-body">
                     <div className="form-group">
                        <label htmlFor="user-select">Select Staff Member</label>
                        <select id="user-select" value={userId} onChange={e => setUserId(e.target.value)} required>
                            <option value="" disabled>Select a user...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="reason">Reason / Comment (Required)</label>
                        <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={4} required/>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
                        <button type="submit" disabled={!userId || !reason} className="submit-button">{submitText}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const TaskDetailModal = ({ task, users, currentUser, onClose, onUpdateTask, onRateTask, onViewProfile, onInitiateComplete }: { task: Task, users: User[], currentUser: User, onClose: () => void, onUpdateTask: (updatedTask: Task) => void, onRateTask: (taskId: number, rating: number) => void, onViewProfile: (user: User) => void, onInitiateComplete: (task: Task) => void }) => {
    const [newComment, setNewComment] = useState('');
    const [newCommentFile, setNewCommentFile] = useState<File | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState<'transfer' | 'invite' | null>(null);
    
    const [editData, setEditData] = useState({
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo.map(String),
        startTime: formatForInput(task.startTime),
        endTime: formatForInput(task.endTime),
        brandId: task.brandId,
    });
    
    useEffect(() => {
        setIsEditing(false);
        setShowRequestModal(null);
        setEditData({
            title: task.title,
            description: task.description,
            assignedTo: task.assignedTo.map(String),
            startTime: formatForInput(task.startTime),
            endTime: formatForInput(task.endTime),
            brandId: task.brandId,
        });
    }, [task]);
    
    const brand = getUserById(task.brandId, users);
    const canViewProfiles = currentUser.userType === 'staff';
    const canEditTask = currentUser.role === 'Founder' || currentUser.role === 'Manager';
    const isAssigned = task.assignedTo.includes(currentUser.id);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as TaskStatus;
        if (newStatus === 'Completed') {
            onInitiateComplete(task);
            return;
        }
        const historyEntry: HistoryEntry = {
            userId: currentUser.id,
            action: `Status changed to ${newStatus}`,
            timestamp: new Date().toISOString(),
        };
        onUpdateTask({ ...task, status: newStatus, history: [...task.history, historyEntry] });
    };
    
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newComment.trim() && !newCommentFile) return;

        const comment: Comment = {
            userId: currentUser.id,
            text: newComment,
            timestamp: new Date().toISOString(),
        };

        if (newCommentFile) {
            comment.attachment = { fileName: newCommentFile.name, url: '#' };
        }

        onUpdateTask({ ...task, comments: [...task.comments, comment] });
        setNewComment('');
        setNewCommentFile(null);
    };

    const handleEditSave = (e: React.FormEvent) => {
        e.preventDefault();
        const historyEntry: HistoryEntry = {
            userId: currentUser.id,
            action: `edited the task details`,
            timestamp: new Date().toISOString(),
        };
        const updatedTask = {
            ...task,
            ...editData,
            assignedTo: editData.assignedTo.map(Number),
            startTime: new Date(editData.startTime).toISOString(),
            endTime: new Date(editData.endTime).toISOString(),
            history: [...task.history, historyEntry]
        };
        onUpdateTask(updatedTask);
        setIsEditing(false);
    }
    
    const handleRequestTransfer = (toUserId: number, reason: string) => {
        const toUser = getUserById(toUserId, users);
        const historyEntry: HistoryEntry = {
            userId: currentUser.id,
            action: `requested to transfer task to ${toUser?.name}`,
            timestamp: new Date().toISOString(),
            details: reason,
        };
        onUpdateTask({ ...task, status: 'Pending Transfer', transferRequest: { fromUserId: currentUser.id, toUserId, reason }, history: [...task.history, historyEntry] });
        setShowRequestModal(null);
    };

    const handleRequestInvite = (toUserId: number, reason: string) => {
        const toUser = getUserById(toUserId, users);
        const historyEntry: HistoryEntry = {
            userId: currentUser.id,
            action: `invited ${toUser?.name} to collaborate`,
            timestamp: new Date().toISOString(),
            details: reason,
        };
        onUpdateTask({ ...task, invitationRequest: { fromUserId: currentUser.id, toUserId, reason, status: 'pending' }, history: [...task.history, historyEntry] });
        setShowRequestModal(null);
    };
    
    const handleResolveTransfer = (approved: boolean) => {
        if (!task.transferRequest) return;
        const { toUserId } = task.transferRequest;
        const toUser = getUserById(toUserId, users);
        
        let updatedTask: Task;

        if (approved) {
            const historyEntry: HistoryEntry = {
                userId: currentUser.id,
                action: `approved transfer to ${toUser?.name}`,
                timestamp: new Date().toISOString(),
            };
            updatedTask = { ...task, assignedTo: [toUserId], status: 'Pending', history: [...task.history, historyEntry] };
        } else {
             const historyEntry: HistoryEntry = {
                userId: currentUser.id,
                action: `rejected transfer to ${toUser?.name}`,
                timestamp: new Date().toISOString(),
            };
            updatedTask = { ...task, status: 'Pending', history: [...task.history, historyEntry] };
        }
        delete updatedTask.transferRequest;
        onUpdateTask(updatedTask);
    };

    const handleResolveInvitation = (accepted: boolean) => {
        if (!task.invitationRequest) return;
        const { fromUserId } = task.invitationRequest;
        const fromUser = getUserById(fromUserId, users);
        
        let updatedTask: Task;

        if (accepted) {
            const historyEntry: HistoryEntry = {
                userId: currentUser.id,
                action: `accepted invitation from ${fromUser?.name}`,
                timestamp: new Date().toISOString(),
            };
            updatedTask = { ...task, assignedTo: [...task.assignedTo, currentUser.id], history: [...task.history, historyEntry] };
        } else {
             const historyEntry: HistoryEntry = {
                userId: currentUser.id,
                action: `declined invitation from ${fromUser?.name}`,
                timestamp: new Date().toISOString(),
            };
            updatedTask = { ...task, history: [...task.history, historyEntry] };
        }
        delete updatedTask.invitationRequest;
        onUpdateTask(updatedTask);
    };

    const canComment = isAssigned || currentUser.id === task.brandId || currentUser.role === 'Manager' || currentUser.role === 'Founder';

    const raters = useMemo(() => {
        const founderAndManagers = users.filter(u => u.role === 'Founder' || u.role === 'Manager');
        const brandUser = brand ? [brand] : [];
        return [...founderAndManagers, ...brandUser];
    }, [users, brand]);

    const staffUsers = useMemo(() => users.filter(u => u.userType === 'staff' && !task.assignedTo.includes(u.id)), [users, task.assignedTo]);
    const assignableUsers = useMemo(() => {
        if (currentUser.role === 'Founder') {
            return users.filter(u => u.userType === 'staff' && u.role !== 'Founder');
        }
        if (currentUser.role === 'Manager') {
            return users.filter(u => u.userType === 'staff' && u.role !== 'Founder' && u.role !== 'Manager');
        }
        return [];
    }, [currentUser, users]);
    const brandUsers = useMemo(() => users.filter(u => u.userType === 'brand'), [users]);
    
    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="modal-close-button">&times;</button>
                    <header className="modal-header">
                        {!isEditing ? (
                             <h2>
                                {task.title}
                                {task.isBrandRequested && <span className="task-requested-tag">Requested</span>}
                            </h2>
                        ) : (
                            <div className="task-title-edit-container">
                                <input type="text" className="task-title-edit" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} />
                                {task.isBrandRequested && <span className="task-requested-tag">Requested</span>}
                            </div>
                        )}
                        <div className={`status status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>{task.status}</div>
                        {canEditTask && !isEditing && <button className="edit-task-button" onClick={() => setIsEditing(true)}>Edit Task</button>}
                    </header>
                    <div className="modal-body">
                         {task.transferRequest && (
                            <div className="request-banner info">
                                Transfer requested from {getUserById(task.transferRequest.fromUserId, users)?.name} to {getUserById(task.transferRequest.toUserId, users)?.name}. Reason: "{task.transferRequest.reason}"
                                {canEditTask && (
                                    <div className="approval-buttons">
                                        <button className="approve" onClick={() => handleResolveTransfer(true)}>Approve</button>
                                        <button className="reject" onClick={() => handleResolveTransfer(false)}>Reject</button>
                                    </div>
                                )}
                            </div>
                        )}
                        {task.invitationRequest && task.invitationRequest.toUserId === currentUser.id && task.invitationRequest.status === 'pending' && (
                            <div className="request-banner info">
                                {getUserById(task.invitationRequest.fromUserId, users)?.name} invited you to collaborate. Reason: "{task.invitationRequest.reason}"
                                <div className="approval-buttons">
                                    <button className="approve" onClick={() => handleResolveInvitation(true)}>Accept</button>
                                    <button className="reject" onClick={() => handleResolveInvitation(false)}>Decline</button>
                                </div>
                            </div>
                        )}
                        {isEditing ? (
                            <form className="task-edit-form" onSubmit={handleEditSave}>
                                <div className="form-group">
                                    <label htmlFor="edit-description">Description</label>
                                    <textarea id="edit-description" rows={5} value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group form-column">
                                        <label htmlFor="edit-assignedTo">Assigned To</label>
                                        <select id="edit-assignedTo" multiple value={editData.assignedTo} onChange={e => setEditData({...editData, assignedTo: Array.from(e.target.selectedOptions, o => o.value)})} className="multi-select-assign">
                                            {assignableUsers.map(user => (
                                                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group form-column">
                                        <label htmlFor="edit-brandId">Brand</label>
                                        <select id="edit-brandId" value={editData.brandId ?? ''} onChange={(e) => setEditData({...editData, brandId: e.target.value ? parseInt(e.target.value) : null})}>
                                            <option value="">No brand</option>
                                            {brandUsers.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group form-column">
                                        <label htmlFor="edit-startTime">Start Time</label>
                                        <input id="edit-startTime" type="datetime-local" value={editData.startTime} onChange={(e) => setEditData({...editData, startTime: e.target.value})} />
                                    </div>
                                    <div className="form-group form-column">
                                        <label htmlFor="edit-endTime">End Time</label>
                                        <input id="edit-endTime" type="datetime-local" value={editData.endTime} onChange={(e) => setEditData({...editData, endTime: e.target.value})} />
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" onClick={() => setIsEditing(false)} className="cancel-button">Cancel</button>
                                    <button type="submit" className="submit-button">Save Changes</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <section className="task-description">
                                    <h4>Description</h4>
                                    <p>{task.description || 'No description provided.'}</p>
                                </section>
                                <section className="task-info-grid">
                                    <div><strong>Assigned To:</strong> 
                                        <ul className="assignee-list">
                                            {users.filter(u => task.assignedTo.includes(u.id)).map(u => <li key={u.id}><UserDisplay user={u} onClick={(user, e) => onViewProfile(user)} isClickable={canViewProfiles}/> ({u.role})</li>)}
                                        </ul>
                                    </div>
                                    <div><strong>Start Time:</strong> {new Date(task.startTime).toLocaleString()}</div>
                                    <div><strong>End Time:</strong> {new Date(task.endTime).toLocaleString()}</div>
                                    {brand && <div><strong>Brand:</strong> {brand.name}</div>}
                                    <div className="status-updater">
                                        <strong>Status:</strong>
                                        <select value={task.status} onChange={handleStatusChange} disabled={task.status === 'Completed' || task.status === 'Pending Transfer'}>
                                            {(['Pending', 'In Progress', 'Blocked', 'For Review', 'Completed'] as TaskStatus[]).map(s => 
                                                <option key={s} value={s} disabled={s === 'Completed'}>{s}</option>
                                            )}
                                        </select>
                                    </div>
                                </section>
                                 {isAssigned && task.status !== 'Completed' && task.status !== 'Pending Transfer' && (
                                    <section className="task-actions-panel">
                                        <button onClick={() => setShowRequestModal('transfer')}>Transfer Task</button>
                                        <button onClick={() => setShowRequestModal('invite')}>Invite Collaborator</button>
                                    </section>
                                )}
                            </>
                        )}
                        
                        {task.status === 'Completed' && (
                             <section className="task-ratings">
                                <h4>Ratings</h4>
                                <div className="ratings-grid">
                                    {raters.map(rater => {
                                        const givenRating = task.ratings[rater.id];
                                        const canThisUserRate = rater.id === currentUser.id;
                                        return (
                                            <div key={rater.id} className="rating-item">
                                                <span>{rater.name} ({rater.role || rater.userType})</span>
                                                <StarRating
                                                    rating={givenRating || 0}
                                                    onRate={(newRating) => onRateTask(task.id, newRating)}
                                                    disabled={!canThisUserRate || !!givenRating}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>
                        )}

                        <section className="task-attachments">
                            <h4>Attachments</h4>
                            {task.attachments.length > 0 ? (
                                <ul>
                                    {task.attachments.map((file, index) => (
                                        <li key={index}>
                                            <a href={file.url} target="_blank" rel="noopener noreferrer">{file.fileName}</a>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p>No attachments.</p>}
                        </section>
                        
                        <section className="task-discussion">
                           <h4>Discussion & History</h4>
                            <div className="comment-list">
                                {[...task.comments, ...task.history]
                                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                    .map((item, index) => {
                                        if ('text' in item) { // It's a comment
                                            const author = getUserById(item.userId, users);
                                            return (
                                                <div key={`c-${index}`} className="comment-item">
                                                    <div className="comment-author">
                                                        <strong><UserDisplay user={author} onClick={(user, e) => onViewProfile(user)} isClickable={canViewProfiles}/></strong>
                                                        <span className="comment-time">{new Date(item.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <p>{item.text}</p>
                                                    {item.attachment && (
                                                        <div className="comment-attachment">
                                                            <AttachmentIcon/> <a href={item.attachment.url} target="_blank" rel="noopener noreferrer">{item.attachment.fileName}</a>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        } else { // It's a history entry
                                            const actor = getUserById(item.userId, users);
                                            return (
                                                <div key={`h-${index}`} className="history-item">
                                                    <span>
                                                        {actor ? <strong><UserDisplay user={actor} onClick={(user, e) => onViewProfile(user)} isClickable={canViewProfiles}/></strong> : 'System'} {item.action} on {new Date(item.timestamp).toLocaleString()}.
                                                        {item.details && <span className="history-details">"{item.details}"</span>}
                                                    </span>
                                                </div>
                                            );
                                        }
                                    })
                                }
                            </div>
                            {canComment && (
                                <form onSubmit={handleCommentSubmit} className="comment-form">
                                    <textarea
                                        placeholder="Add a comment..."
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        rows={2}
                                    />
                                    <div className="comment-actions">
                                        <label htmlFor="file-input" className="file-upload-button" title="Attach file">
                                            <AttachmentIcon />
                                        </label>
                                        <input type="file" id="file-input" className="file-input" onChange={e => setNewCommentFile(e.target.files ? e.target.files[0] : null)}/>
                                        {newCommentFile && <span className="file-preview">{newCommentFile.name}</span>}
                                        <button type="submit" disabled={!newComment.trim() && !newCommentFile}>Send</button>
                                    </div>
                                </form>
                            )}
                        </section>
                    </div>
                </div>
            </div>
            {showRequestModal === 'transfer' && (
                <RequestModal 
                    title="Request Task Transfer"
                    users={staffUsers}
                    onCancel={() => setShowRequestModal(null)}
                    onSubmit={handleRequestTransfer}
                    submitText="Request Transfer"
                />
            )}
            {showRequestModal === 'invite' && (
                 <RequestModal 
                    title="Invite Collaborator"
                    users={staffUsers}
                    onCancel={() => setShowRequestModal(null)}
                    onSubmit={handleRequestInvite}
                    submitText="Send Invitation"
                />
            )}
        </>
    );
};

const CreateTaskForm = ({ currentUser, users, onSubmit, onCancel }: { currentUser: User, users: User[], onSubmit: (task: Omit<Task, 'id' | 'status' | 'comments' | 'attachments' | 'history' | 'ratings'>) => void, onCancel: () => void }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [brandId, setBrandId] = useState<number | null>(null);

    const defaultStartTime = useMemo(() => {
        const d = new Date();
        d.setMinutes(0);
        return d;
    }, []);
    const defaultEndTime = useMemo(() => {
        const d = new Date(defaultStartTime);
        d.setHours(d.getHours() + 4);
        return d;
    }, [defaultStartTime]);

    const [startTime, setStartTime] = useState(formatForInput(new Date().toISOString()));
    const [endTime, setEndTime] = useState(formatForInput(defaultEndTime.toISOString()));


    const assignableUsers = useMemo(() => {
        if (currentUser.role === 'Founder') {
            return users.filter(u => u.userType === 'staff' && u.role !== 'Founder');
        }
        if (currentUser.role === 'Manager') {
            return users.filter(u => u.userType === 'staff' && u.role !== 'Founder' && u.role !== 'Manager');
        }
        return [];
    }, [currentUser, users]);
    
    const brandUsers = useMemo(() => users.filter(u => u.userType === 'brand'), [users]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || assignedTo.length === 0 || !startTime || !endTime) {
            alert('Please fill out all required fields.');
            return;
        }
        if (new Date(startTime) >= new Date(endTime)) {
            alert('End date and time must be after the start date and time.');
            return;
        }
        onSubmit({
            title,
            description,
            assignedTo: assignedTo.map(id => parseInt(id, 10)),
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            brandId,
        });
    };
    
    return (
        <form onSubmit={handleSubmit} className="create-task-form">
            <h3>Create a New Task</h3>
            <div className="form-group">
                <input
                    type="text"
                    placeholder="Task Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="task-title-input"
                />
            </div>
             <div className="form-group">
                <textarea
                    placeholder="Task Description / Brief..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                />
            </div>
            <div className="form-row">
                <select multiple value={assignedTo} onChange={e => setAssignedTo(Array.from(e.target.selectedOptions, o => o.value))} required className="multi-select-assign">
                    {assignableUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                    ))}
                </select>
                <div className="form-column">
                    <select value={brandId ?? ''} onChange={(e) => setBrandId(e.target.value ? parseInt(e.target.value, 10) : null)}>
                        <option value="">Tag a brand (optional)...</option>
                         {brandUsers.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                    <label htmlFor="startTime">Start Date & Time</label>
                    <input id="startTime" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                    <label htmlFor="endTime">End Date & Time</label>
                    <input id="endTime" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
            </div>
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
                <button type="submit" className="submit-button">Create Task</button>
            </div>
        </form>
    );
};

const TaskCard = ({ task, users, onSelect, onViewProfile }: { task: Task, users: User[], onSelect: (task: Task) => void, onViewProfile: (user: User) => void }) => {
  const assignedUsers = users.filter(user => task.assignedTo.includes(user.id));
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    let intervalId: number | undefined;
    const endTime = new Date(task.endTime).getTime();
    
    const updateCountdown = () => {
        const now = new Date().getTime();
        const timeLeft = endTime - now;
        
        if (timeLeft > 0 && timeLeft <= 10 * 60 * 1000 && task.status !== 'Completed') {
            setCountdown(formatCountdown(timeLeft));
        } else {
            setCountdown('');
            if (intervalId) clearInterval(intervalId);
        }
    };
    
    updateCountdown(); // Initial check
    intervalId = window.setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [task.endTime, task.status]);

  if (assignedUsers.length === 0 && task.status !== 'Pending') return null;

  return (
    <button className="task-card" aria-labelledby={`task-title-${task.id}`} onClick={() => onSelect(task)}>
      <div className="task-header">
        <h3 id={`task-title-${task.id}`}>
          {task.title}
          {task.isBrandRequested && <span className="task-requested-tag">Requested</span>}
        </h3>
        <div className="task-header-right">
            {countdown && <div className="task-countdown">{countdown}</div>}
            <span className={`status status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>{task.status}</span>
        </div>
      </div>
      <div className="task-footer">
        <div className="assignees">
          {assignedUsers.length > 0 ? (
            assignedUsers.map(user => {
                const roleClass = user.role ? `role-${user.role.toLowerCase().replace(/\s+/g, '-')}` : 'role-brand';
                return (
                    <div key={user.id} className="assignee-item">
                        <span className={`assignee-role ${roleClass}`}>{user.role}</span>
                        <span className="assignee-name"><UserDisplay user={user} onClick={(user, e) => { e.stopPropagation(); onViewProfile(user); }} isClickable={true}/></span>
                    </div>
                );
            })
          ) : <span className="unassigned-task">Unassigned</span>}
        </div>
        <div className="task-meta">
            {task.comments.length > 0 && 
                <span className="meta-item"><CommentIcon /> {task.comments.length}</span>
            }
            {task.attachments.length > 0 && 
                <span className="meta-item"><AttachmentIcon /> {task.attachments.length}</span>
            }
            <div className="due-date">
              Ends: {new Date(task.endTime).toLocaleDateString()}
            </div>
        </div>
      </div>
    </button>
  );
};

const TaskList = ({ title, tasks, users, onSelectTask, onViewProfile }: { title: string, tasks: Task[], users: User[], onSelectTask: (task: Task) => void, onViewProfile: (user: User) => void }) => {
  return (
    <section className="task-list" aria-labelledby={title.toLowerCase().replace(' ', '-')}>
      <h2 id={title.toLowerCase().replace(' ', '-')}>{title}</h2>
      <div className="tasks-container">
        {tasks.length > 0 ? (
          tasks.map(task => <TaskCard key={task.id} task={task} users={users} onSelect={onSelectTask} onViewProfile={onViewProfile}/>)
        ) : (
          <p className="no-tasks">No tasks for this period.</p>
        )}
      </div>
    </section>
  );
};

const AnnouncementsPanel = ({ currentUser, announcements, onPublish }: { currentUser: User; announcements: string[]; onPublish: (note: string) => void; }) => {
    const [newNote, setNewNote] = useState('');
    const canPublish = currentUser.role === 'Founder' || currentUser.role === 'Manager';

    const handlePublish = (e: React.FormEvent) => {
        e.preventDefault();
        if (newNote.trim()) {
            onPublish(newNote);
            setNewNote('');
        }
    };

    return (
        <div className="dashboard-panel announcements-panel">
            <h3>Announcements</h3>
            <div className="announcements-list">
                {announcements.map((note, index) => (
                    <div key={index} className="announcement-item">{note}</div>
                ))}
            </div>
            {canPublish && (
                <form onSubmit={handlePublish} className="announcement-form">
                    <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Publish a new note..." />
                    <button type="submit">Publish</button>
                </form>
            )}
        </div>
    );
};

const StatsPanel = ({ tasks }: { tasks: Task[] }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const ongoingCount = tasks.filter(t => new Date(t.startTime) <= now && now <= new Date(t.endTime) && t.status !== 'Completed').length;
        const upcomingCount = tasks.filter(t => new Date(t.startTime) > now && t.status !== 'Completed').length;
        const pendingCount = tasks.filter(t => t.status === 'Pending').length;
        return { ongoingCount, upcomingCount, pendingCount };
    }, [tasks]);

    return (
        <div className="dashboard-panel stats-panel">
            <h3>Stats</h3>
            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-value">{stats.ongoingCount}</span>
                    <span className="stat-label">Ongoing Tasks</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.upcomingCount}</span>
                    <span className="stat-label">Upcoming</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.pendingCount}</span>
                    <span className="stat-label">Pending</span>
                </div>
            </div>
        </div>
    );
};

const LeaderboardPanel = ({ users, onViewProfile }: { users: User[], onViewProfile: (user: User) => void }) => {
    const [leaderboardType, setLeaderboardType] = useState<'all-time' | 'monthly'>('all-time');
    
    const sortedUsers = useMemo(() => {
        const staff = users.filter(u => u.userType === 'staff' && (u.role !== 'Founder' && u.role !== 'Manager'));
        if (leaderboardType === 'all-time') {
            return staff.sort((a, b) => b.totalStars - a.totalStars);
        } else {
            return staff.sort((a, b) => b.monthlyStars - a.monthlyStars);
        }
    }, [users, leaderboardType]);

    return (
        <div className="dashboard-panel leaderboard-panel">
            <h3>Leaderboard</h3>
            <div className="leaderboard-toggle">
                <button onClick={() => setLeaderboardType('all-time')} className={leaderboardType === 'all-time' ? 'active' : ''}>All-Time</button>
                <button onClick={() => setLeaderboardType('monthly')} className={leaderboardType === 'monthly' ? 'active' : ''}>Monthly</button>
            </div>
            <ol className="leaderboard-list">
                {sortedUsers.slice(0, 5).map((user, index) => (
                    <li key={user.id} className="leaderboard-item">
                        <span className="leaderboard-rank">{index + 1}</span>
                        <div className="leaderboard-name"><UserDisplay user={user} onClick={(user, e) => onViewProfile(user)} isClickable={true} /></div>
                        <span className="leaderboard-score">✨ {leaderboardType === 'all-time' ? user.totalStars : user.monthlyStars}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

const PieChart = ({ data, title }: { data: { label: string; value: number; color: string }[], title: string }) => {
    const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

    const conicGradient = useMemo(() => {
        if (total === 0) {
            return 'var(--border-color)';
        }
        const gradientStops = [];
        let accumulatedPercentage = 0;
        data.forEach(item => {
            const percentage = (item.value / total) * 100;
            if (percentage > 0) {
                 gradientStops.push(`${item.color} ${accumulatedPercentage}% ${accumulatedPercentage + percentage}%`);
            }
            accumulatedPercentage += percentage;
        });
        return `conic-gradient(${gradientStops.join(', ')})`;
    }, [data, total]);
    
    return (
        <div className="pie-chart-section">
            <h4>{title}</h4>
            <div className="pie-chart-container">
                <div className="pie-chart-wrapper">
                    <div className="pie-chart" style={{ backgroundImage: conicGradient }}></div>
                    <div className="pie-chart-total">{total}</div>
                </div>
                <ul className="chart-legend">
                    {data.map(item => (
                        <li key={item.label} className="legend-item">
                            <span className="legend-color-box" style={{ backgroundColor: item.color }}></span>
                            {item.label}: <strong>{item.value}</strong>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const TaskChartsPanel = ({ tasks }: { tasks: Task[] }) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const chartData = useMemo(() => {
        const monthly = { completed: 0, pending: 0, upcoming: 0 };
        const allTime = { completed: 0, pending: 0 };
        
        tasks.forEach(task => {
            const isCompleted = task.status === 'Completed';
            const isPending = !isCompleted;

            // All-Time
            if (isCompleted) allTime.completed++;
            else allTime.pending++;
            
            // Monthly
            const taskEndDate = new Date(task.endTime);
            if(taskEndDate.getFullYear() === currentYear && taskEndDate.getMonth() === currentMonth) {
                if(isCompleted) {
                    monthly.completed++;
                } else if (new Date(task.startTime) > now) {
                    monthly.upcoming++;
                } else {
                    monthly.pending++;
                }
            }
        });
        
        return {
            monthlyData: [
                { label: 'Completed', value: monthly.completed, color: 'var(--status-completed)' },
                { label: 'Pending/Ongoing', value: monthly.pending, color: 'var(--status-pending)' },
                { label: 'Upcoming', value: monthly.upcoming, color: 'var(--status-in-progress)' },
            ],
            allTimeData: [
                 { label: 'Completed', value: allTime.completed, color: 'var(--status-completed)' },
                { label: 'Pending', value: allTime.pending, color: 'var(--status-pending)' },
            ]
        };
    }, [tasks, currentYear, currentMonth]);

    return (
        <div className="dashboard-panel task-charts-panel">
            <h3>Task Analytics</h3>
            <PieChart data={chartData.monthlyData} title="This Month" />
            <PieChart data={chartData.allTimeData} title="All-Time" />
        </div>
    );
};

const BirthdayPanel = ({ usersWithBirthday, allUsers, currentUser, wishes, onPostWish }: { usersWithBirthday: User[], allUsers: User[], currentUser: User, wishes: BirthdayWish[], onPostWish: (wish: Omit<BirthdayWish, 'timestamp'>) => void }) => {
    const [text, setText] = useState("");
    const emojis = ['🎂', '🥳', '🎉', '🎁', '🎈'];
    
    const handlePost = (type: BirthdayWishType, content: string, birthdayUserId: number) => {
        onPostWish({ userId: currentUser.id, birthdayUserId, type, content });
        if(type === 'text') setText("");
    };

    return (
        <div className="dashboard-panel birthday-panel">
            {usersWithBirthday.map(user => (
                <div key={user.id} className="birthday-section">
                    <h3>🎉 Happy Birthday, {user.name}! 🥳</h3>
                    <div className="birthday-wishes-list">
                        {wishes.filter(w => w.birthdayUserId === user.id).map((wish, index) => {
                             const author = getUserById(wish.userId, allUsers);
                             return (
                                <div key={index} className="birthday-wish-item">
                                    <strong>{author?.name}: </strong>
                                    {wish.type === 'text' && <span>{wish.content}</span>}
                                    {wish.type === 'emoji' && <span className="wish-emoji">{wish.content}</span>}
                                    {wish.type === 'voice' && <span>🎤 Voice Note</span>}
                                </div>
                             )
                        })}
                    </div>
                     <form className="birthday-comment-form" onSubmit={(e) => { e.preventDefault(); if (text.trim()) handlePost('text', text, user.id); }}>
                        <input type="text" placeholder="Send your wishes..." value={text} onChange={e => setText(e.target.value)} />
                        <div className="birthday-actions">
                            {emojis.map(emoji => <button type="button" key={emoji} onClick={() => handlePost('emoji', emoji, user.id)}>{emoji}</button>)}
                            <button type="button" title="Send Voice Note" onClick={() => handlePost('voice', 'voice_note', user.id)}><MicIcon/></button>
                        </div>
                        <button type="submit" disabled={!text.trim()}>Send</button>
                    </form>
                </div>
            ))}
        </div>
    );
};

const CalendarView = ({ tasks, onSelectTask }: { tasks: Task[], onSelectTask: (task: Task) => void }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const tasksByDate = useMemo(() => {
        const map = new Map<string, Task[]>();
        tasks.forEach(task => {
            const endDateStr = new Date(task.endTime).toDateString();
            if (!map.has(endDateStr)) {
                map.set(endDateStr, []);
            }
            map.get(endDateStr)!.push(task);
        });
        return map;
    }, [tasks]);

    return (
        <main className="calendar-view-container">
            <div className="calendar-header">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>‹</button>
                <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>›</button>
            </div>
            <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="calendar-grid">
                {days.map(d => {
                    const tasksForDay = tasksByDate.get(d.toDateString()) || [];
                    return (
                        <div key={d.toISOString()} className={`calendar-day ${d.getMonth() !== currentDate.getMonth() ? 'other-month' : ''} ${d.toDateString() === new Date().toDateString() ? 'today' : ''}`}>
                            <span className="day-number">{d.getDate()}</span>
                            <div className="calendar-tasks">
                                {tasksForDay.map(task => (
                                    <button key={task.id} onClick={() => onSelectTask(task)} className={`calendar-task status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {task.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </main>
    );
};

const BrandTaskRequestForm = ({ managers, onSubmit, onCancel }: { managers: User[], onSubmit: (request: Omit<TaskRequest, 'id' | 'brandId' | 'status'>) => void, onCancel: () => void }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [requestedManagerId, setRequestedManagerId] = useState<number | null>(null);
    const [requestedEndTime, setRequestedEndTime] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !requestedEndTime) {
            alert('Please fill out all required fields.');
            return;
        }
        onSubmit({
            title,
            description,
            requestedManagerId,
            requestedEndTime: new Date(requestedEndTime).toISOString(),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="brand-task-request-form create-task-form">
            <h3>Request a New Task</h3>
             <div className="form-group">
                <input type="text" placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
                <textarea placeholder="Task Description / Brief..." value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />
            </div>
            <div className="form-row">
                <div className="form-group form-column">
                    <label>Suggest a Manager (Optional)</label>
                    <select value={requestedManagerId ?? ''} onChange={(e) => setRequestedManagerId(e.target.value ? parseInt(e.target.value) : null)}>
                        <option value="">No preference</option>
                        {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div className="form-group form-column">
                    <label>Desired End Date & Time</label>
                    <input type="datetime-local" value={requestedEndTime} onChange={e => setRequestedEndTime(e.target.value)} required />
                </div>
            </div>
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
                <button type="submit" className="submit-button">Submit Request</button>
            </div>
        </form>
    );
};

const AdminRequestPanel = ({ requests, users, onApprove, onDecline }: { requests: TaskRequest[], users: User[], onApprove: (id: number) => void, onDecline: (id: number) => void }) => {
    return (
        <div className="dashboard-panel admin-request-panel">
            <h3>Brand Task Requests</h3>
            <div className="request-list">
                {requests.map(req => {
                    const brand = getUserById(req.brandId, users);
                    const manager = getUserById(req.requestedManagerId, users);
                    return (
                        <div key={req.id} className="request-item">
                            <div className="request-item-header">
                                <h4>{req.title}</h4>
                                <span>From: <strong>{brand?.name}</strong></span>
                            </div>
                            <p className="request-item-desc">{req.description}</p>
                            <div className="request-item-footer">
                                <div>
                                    <span>Requested Manager: {manager?.name || 'None'}</span>
                                    <span>Deadline: {new Date(req.requestedEndTime).toLocaleDateString()}</span>
                                </div>
                                <div className="approval-buttons">
                                    <button className="approve" onClick={() => onApprove(req.id)}>Approve</button>
                                    <button className="reject" onClick={() => onDecline(req.id)}>Decline</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const BrandDashboard = ({ user, users, tasks, taskRequests, onSelectTask, onCreateTaskRequest }: { user: User, users: User[], tasks: Task[], taskRequests: TaskRequest[], onSelectTask: (task: Task) => void, onCreateTaskRequest: (request: Omit<TaskRequest, 'id' | 'brandId' | 'status'>) => void }) => {
    const [isRequestingTask, setIsRequestingTask] = useState(false);
    const managers = useMemo(() => users.filter(u => u.role === 'Manager'), [users]);
    const now = new Date();
  
    const ongoingTasks = tasks.filter(task => new Date(task.startTime) <= now && now <= new Date(task.endTime) && task.status !== 'Completed');
    const upcomingTasks = tasks.filter(task => new Date(task.startTime) > now && task.status !== 'Completed').sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const completedTasks = tasks.filter(task => task.status === 'Completed').sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

    return (
        <main className="brand-dashboard-container">
            <div className="brand-dashboard-left">
                <div className="create-task-section">
                    {!isRequestingTask ? (
                        <button onClick={() => setIsRequestingTask(true)} className="create-task-button">Request New Task</button>
                    ) : (
                        <BrandTaskRequestForm
                            managers={managers}
                            onSubmit={(newRequest) => {
                                onCreateTaskRequest(newRequest);
                                setIsRequestingTask(false);
                            }}
                            onCancel={() => setIsRequestingTask(false)}
                        />
                    )}
                </div>
                <div className="dashboard-panel brand-requests-panel">
                    <h3>Your Task Requests</h3>
                    <div className="request-list">
                        {taskRequests.length > 0 ? taskRequests.map(req => (
                            <div key={req.id} className="request-item">
                                <div className="request-item-header">
                                    <h4>{req.title}</h4>
                                    <span className={`status-request status-request-${req.status}`}>{req.status}</span>
                                </div>
                            </div>
                        )) : <p>You haven't made any requests yet.</p>}
                    </div>
                </div>
            </div>
            <div className="brand-dashboard-right">
                <TaskList title="Ongoing Tasks" tasks={ongoingTasks} users={users} onSelectTask={onSelectTask} onViewProfile={() => {}}/>
                <TaskList title="Upcoming Tasks" tasks={upcomingTasks} users={users} onSelectTask={onSelectTask} onViewProfile={() => {}}/>
                <TaskList title="Completed Tasks" tasks={completedTasks} users={users} onSelectTask={onSelectTask} onViewProfile={() => {}}/>
            </div>
        </main>
    );
};

const Dashboard = ({ user, users, tasks, announcements, taskRequests, onCreateTask, onSelectTask, onPublishAnnouncement, onViewProfile, onApproveTaskRequest, onDeclineTaskRequest, birthdayUsers, birthdayWishes, onPostBirthdayWish }: { user: User, users: User[], tasks: Task[], announcements: string[], taskRequests: TaskRequest[], onCreateTask: (task: Omit<Task, 'id'|'status'|'comments'|'attachments'|'history'|'ratings'>) => void, onSelectTask: (task: Task) => void, onPublishAnnouncement: (note: string) => void, onViewProfile: (user: User) => void, onApproveTaskRequest: (id: number) => void, onDeclineTaskRequest: (id: number) => void, birthdayUsers: User[], birthdayWishes: BirthdayWish[], onPostBirthdayWish: (wish: Omit<BirthdayWish, 'timestamp'>) => void }) => {
  const now = new Date();
  
  const ongoingTasks = tasks.filter(task => 
    new Date(task.startTime) <= now && 
    now <= new Date(task.endTime) && 
    task.status !== 'Completed'
  );
  
  const upcomingTasks = tasks.filter(task => 
    new Date(task.startTime) > now && 
    task.status !== 'Completed'
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  const completedTasks = tasks.filter(task => task.status === 'Completed')
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

  const canCreateTasks = user.role === 'Founder' || user.role === 'Manager';
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const canManageRequests = user.role === 'Founder' || user.role === 'Manager';
  const pendingRequests = taskRequests.filter(r => r.status === 'pending');

  return (
    <main className="dashboard-container">
        {birthdayUsers.length > 0 && (
            <div className="birthday-area">
                <BirthdayPanel 
                    usersWithBirthday={birthdayUsers}
                    allUsers={users}
                    currentUser={user}
                    wishes={birthdayWishes}
                    onPostWish={onPostBirthdayWish}
                />
            </div>
        )}
        <div className="announcements-area">
            <AnnouncementsPanel currentUser={user} announcements={announcements} onPublish={onPublishAnnouncement} />
        </div>
        <div className="dashboard-sidebar">
            <StatsPanel tasks={tasks} />
            <LeaderboardPanel users={users} onViewProfile={onViewProfile} />
            <TaskChartsPanel tasks={tasks} />
        </div>
        
        {canManageRequests && pendingRequests.length > 0 && (
          <div className="admin-request-area">
             <AdminRequestPanel requests={pendingRequests} users={users} onApprove={onApproveTaskRequest} onDecline={onDeclineTaskRequest} />
          </div>
        )}
    
        <div className="dashboard-tasks">
            {canCreateTasks && (
                <div className="create-task-section">
                    {!isCreatingTask ? (
                        <button onClick={() => setIsCreatingTask(true)} className="create-task-button">
                            Create New Task
                        </button>
                    ) : (
                        <CreateTaskForm
                            currentUser={user}
                            users={users}
                            onSubmit={(newTask) => {
                                onCreateTask(newTask);
                                setIsCreatingTask(false);
                            }}
                            onCancel={() => setIsCreatingTask(false)}
                        />
                    )}
                </div>
            )}
            <TaskList title="Ongoing Tasks" tasks={ongoingTasks} users={users} onSelectTask={onSelectTask} onViewProfile={onViewProfile}/>
            <TaskList title="Upcoming Tasks" tasks={upcomingTasks} users={users} onSelectTask={onSelectTask} onViewProfile={onViewProfile}/>
            <TaskList title="Completed Tasks" tasks={completedTasks} users={users} onSelectTask={onSelectTask} onViewProfile={onViewProfile}/>
        </div>
    </main>
  );
};

const FinalizeRequestModal = ({ request, currentUser, users, onSubmit, onCancel }: { request: TaskRequest, currentUser: User, users: User[], onSubmit: (taskData: Omit<Task, 'id' | 'status' | 'comments' | 'attachments' | 'history' | 'ratings' | 'isBrandRequested' | 'title' | 'description' | 'brandId'>) => void, onCancel: () => void }) => {
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [startTime, setStartTime] = useState(formatForInput(new Date().toISOString()));
    const [endTime, setEndTime] = useState(formatForInput(request.requestedEndTime));

    const assignableUsers = useMemo(() => {
        if (currentUser.role === 'Founder') {
            return users.filter(u => u.userType === 'staff' && u.role !== 'Founder');
        }
        if (currentUser.role === 'Manager') {
            return users.filter(u => u.userType === 'staff' && u.role !== 'Founder' && u.role !== 'Manager');
        }
        return [];
    }, [currentUser, users]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (assignedTo.length === 0 || !startTime || !endTime) {
            alert('Please assign the task and set start/end times.');
            return;
        }
        if (new Date(startTime) >= new Date(endTime)) {
            alert('End date and time must be after the start date and time.');
            return;
        }
        onSubmit({
            assignedTo: assignedTo.map(id => parseInt(id, 10)),
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
        });
    };

    return (
        <div className="modal-overlay">
            <div className="finalize-request-modal modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onCancel} className="modal-close-button">&times;</button>
                <header className="modal-header">
                    <h3>Finalize Task from Request</h3>
                </header>
                <form onSubmit={handleSubmit} className="modal-body create-task-form">
                    <div className="readonly-section">
                        <h4>{request.title}</h4>
                        <p>{request.description}</p>
                    </div>
                    <div className="form-group">
                        <label>Assign to Staff (Required)</label>
                        <select multiple value={assignedTo} onChange={e => setAssignedTo(Array.from(e.target.selectedOptions, o => o.value))} required className="multi-select-assign">
                            {assignableUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group form-column">
                            <label htmlFor="req-startTime">Start Date & Time</label>
                            <input id="req-startTime" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                        </div>
                        <div className="form-group form-column">
                            <label htmlFor="req-endTime">End Date & Time</label>
                            <input id="req-endTime" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
                        <button type="submit" className="submit-button">Create Task from Request</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PeopleManagementPanel = ({ currentUser, users, roles, deletionRequests, onAddUser, onDeleteUser, onPromoteUser, onAddRole, onRequestDeletion, onResolveDeletionRequest, onViewProfile }: { 
    currentUser: User;
    users: User[]; 
    roles: UserRole[]; 
    deletionRequests: DeletionRequest[];
    onAddUser: (user: Omit<User, 'id' | 'totalStars' | 'monthlyStars'>) => void;
    onDeleteUser: (userId: number) => void;
    onPromoteUser: (userId: number) => void;
    onAddRole: (role: string) => void;
    onRequestDeletion: (targetUserId: number, reason: string) => void;
    onResolveDeletionRequest: (requestId: number, approve: boolean) => void;
    onViewProfile: (user: User) => void;
}) => {
    const [activeTab, setActiveTab] = useState('staff');
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [isRequestingDelete, setIsRequestingDelete] = useState<User | null>(null);

    const isFounder = currentUser.role === 'Founder';
    
    // Manage Roles state
    const [newRole, setNewRole] = useState('');

    const handleAddRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRole.trim() && !roles.includes(newRole) && !['Manager', 'Founder'].includes(newRole)) {
            onAddRole(newRole.trim());
            setNewRole('');
        }
    };

    return (
        <main className="people-panel-container">
            <header className="people-panel-header">
                <h2>People Management</h2>
                {isFounder && <button className="add-user-button" onClick={() => setIsAddingUser(true)}>+ Add User</button>}
            </header>
            <div className="people-panel-tabs">
                <button onClick={() => setActiveTab('staff')} className={activeTab === 'staff' ? 'active' : ''}>Staff</button>
                <button onClick={() => setActiveTab('brands')} className={activeTab === 'brands' ? 'active' : ''}>Brands</button>
                <button onClick={() => setActiveTab('roles')} className={activeTab === 'roles' ? 'active' : ''}>Manage Roles</button>
                {isFounder && <button onClick={() => setActiveTab('requests')} className={activeTab === 'requests' ? 'active' : ''}>Deletion Requests ({deletionRequests.length})</button>}
            </div>
            <div className="people-panel-content">
                {activeTab === 'staff' && (
                    <div className="user-list">
                        {users.filter(u => u.userType === 'staff').map(user => (
                            <div key={user.id} className="user-list-item">
                                <img src={user.profilePicture || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} />
                                <div className="user-info">
                                    <span className="user-name"><UserDisplay user={user} isClickable={true} onClick={(u, e) => onViewProfile(u)} /></span>
                                    <span className="user-role">{user.role}</span>
                                    <span className="user-username">{user.username}</span>
                                </div>
                                <div className="user-actions">
                                    {isFounder && user.role !== 'Manager' && user.role !== 'Founder' && (
                                        <button className="action-button promote" onClick={() => onPromoteUser(user.id)}>Promote to Manager</button>
                                    )}
                                    {isFounder && !user.isPrimary && (
                                        <button className="action-button delete" onClick={() => onDeleteUser(user.id)}>Delete</button>
                                    )}
                                    {!isFounder && currentUser.role === 'Manager' && user.role !== 'Founder' && user.id !== currentUser.id && (
                                        <button className="action-button request-delete" onClick={() => setIsRequestingDelete(user)}>Request Deletion</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 {activeTab === 'brands' && (
                    <div className="user-list">
                         {users.filter(u => u.userType === 'brand').map(user => (
                            <div key={user.id} className="user-list-item">
                                <div className="user-info">
                                    <span className="user-name">{user.name}</span>
                                    <span className="user-username">{user.username}</span>
                                </div>
                                <div className="user-actions">
                                     {isFounder && (
                                        <button className="action-button delete" onClick={() => onDeleteUser(user.id)}>Delete</button>
                                    )}
                                     {!isFounder && currentUser.role === 'Manager' && (
                                        <button className="action-button request-delete" onClick={() => setIsRequestingDelete(user)}>Request Deletion</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 {activeTab === 'roles' && (
                     <div className="manage-roles-content">
                        <h4>Add New Role</h4>
                        <form onSubmit={handleAddRole} className="add-role-form">
                            <input type="text" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="e.g., Social Media Manager" />
                            <button type="submit">Add Role</button>
                        </form>
                        <h4>Existing Staff Roles</h4>
                        <ul className="roles-list">
                           {roles.map(role => <li key={role}>{role}</li>)}
                        </ul>
                     </div>
                 )}
                 {activeTab === 'requests' && isFounder && (
                     <div className="deletion-requests-list">
                        {deletionRequests.length > 0 ? deletionRequests.map(req => {
                            const requester = getUserById(req.requestedById, users);
                            const target = getUserById(req.targetUserId, users);
                            return (
                                <div key={req.id} className="deletion-request-item">
                                    <p><strong>{requester?.name}</strong> requested to delete <strong>{target?.name}</strong> ({target?.username}).</p>
                                    <p className="request-reason">Reason: "{req.reason}"</p>
                                    <div className="approval-buttons">
                                        <button className="approve" onClick={() => onResolveDeletionRequest(req.id, true)}>Approve Deletion</button>
                                        <button className="reject" onClick={() => onResolveDeletionRequest(req.id, false)}>Decline</button>
                                    </div>
                                </div>
                            );
                        }) : <p>No pending deletion requests.</p>}
                     </div>
                 )}
            </div>
             {isAddingUser && isFounder && <AddUserModal roles={roles} onAddUser={onAddUser} onCancel={() => setIsAddingUser(false)} users={users} />}
             {isRequestingDelete && (
                <RequestDeletionModal 
                    user={isRequestingDelete} 
                    onCancel={() => setIsRequestingDelete(null)} 
                    onSubmit={(reason) => {
                        onRequestDeletion(isRequestingDelete.id, reason);
                        setIsRequestingDelete(null);
                    }}
                />
             )}
        </main>
    );
};

const AddUserModal = ({ roles, onAddUser, onCancel, users }: { roles: UserRole[], onAddUser: (user: Omit<User, 'id' | 'totalStars' | 'monthlyStars'>) => void, onCancel: () => void, users: User[] }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState<UserType>('staff');
    const [role, setRole] = useState<UserRole>(roles[0] || 'Editor');
    const [isCreatingFounder, setIsCreatingFounder] = useState(false);

    const domain = useMemo(() => {
        if (isCreatingFounder) return '@bih';
        return userType === 'staff' ? '@bihstaff' : '@bihbrand';
    }, [userType, isCreatingFounder]);
    const fullUsername = useMemo(() => username ? `${username}${domain}` : '', [username, domain]);
    
    const handleAddUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !username || !password) return alert("All fields are required.");
        if (users.some(u => u.username === fullUsername)) return alert("Username already exists.");

        let finalRole: UserRole | null = role;
        if(isCreatingFounder) finalRole = 'Founder';
        else if (userType === 'brand') finalRole = null;

        onAddUser({ name, username: fullUsername, password, userType, role: finalRole });
        onCancel();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content add-user-modal" onClick={e => e.stopPropagation()}>
                <button onClick={onCancel} className="modal-close-button">&times;</button>
                <header className="modal-header"><h3>Add New User</h3></header>
                <form onSubmit={handleAddUserSubmit} className="modal-body auth-form">
                    <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                    <div className="radio-group">
                       <label><input type="radio" value="staff" checked={userType === 'staff'} onChange={() => { setUserType('staff'); setIsCreatingFounder(false); }} /> Staff</label>
                       <label><input type="radio" value="brand" checked={userType === 'brand'} onChange={() => { setUserType('brand'); setIsCreatingFounder(false); }} /> Brand</label>
                       <label><input type="checkbox" checked={isCreatingFounder} onChange={(e) => { setIsCreatingFounder(e.target.checked); setUserType('staff'); }} /> Is Founder?</label>
                    </div>
                    {userType === 'staff' && !isCreatingFounder && (
                        <select value={role} onChange={e => setRole(e.target.value as UserRole)} required>
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            <option value="Manager">Manager</option>
                        </select>
                    )}
                    <div className="username-group">
                      <input type="text" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} required />
                      <span>{domain}</span>
                    </div>
                    {fullUsername && <p className="username-preview">User's ID will be: <strong>{fullUsername}</strong></p>}
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
                        <button type="submit" className="submit-button">Add User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RequestDeletionModal = ({ user, onCancel, onSubmit }: { user: User; onCancel: () => void; onSubmit: (reason: string) => void; }) => {
    const [reason, setReason] = useState('');
    return (
        <div className="modal-overlay">
            <div className="modal-content request-delete-modal" onClick={e => e.stopPropagation()}>
                 <button onClick={onCancel} className="modal-close-button">&times;</button>
                <header className="modal-header"><h3>Request to Delete User</h3></header>
                <form className="modal-body" onSubmit={(e) => { e.preventDefault(); onSubmit(reason); }}>
                    <p>You are requesting to delete <strong>{user.name}</strong> ({user.username}). Please provide a reason for this request, which will be sent to a Founder for approval.</p>
                     <div className="form-group">
                        <label htmlFor="delete-reason">Reason (Required)</label>
                        <textarea id="delete-reason" value={reason} onChange={e => setReason(e.target.value)} rows={4} required/>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
                        <button type="submit" disabled={!reason.trim()} className="submit-button delete">Submit Request</button>
                    </div>
                </form>
            </div>
        </div>
    )
};


const AuthPage = ({ onLogin, onSignUp, users, roles }: { onLogin: (username: string, password: string) => void, onSignUp: (user: Omit<User, 'id' | 'totalStars' | 'monthlyStars'>) => void, users: User[], roles: UserRole[] }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    
    // Login state
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Sign-up state
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState<UserType>('staff');
    const [role, setRole] = useState<UserRole>(roles[0] || 'Editor');

    const domain = useMemo(() => userType === 'staff' ? '@bihstaff' : '@bihbrand', [userType]);
    const fullUsername = useMemo(() => username ? `${username}${domain}` : '', [username, domain]);

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(loginUsername, loginPassword);
    };

    const handleSignUpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !username || !password) {
            alert("Please fill all fields.");
            return;
        }
        if(users.some(u => u.username === fullUsername)) {
            alert("This username is already taken.");
            return;
        }
        onSignUp({
            name,
            username: fullUsername,
            password,
            userType,
            role: userType === 'staff' ? role : null,
        });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Brands In House</h1>
                    <p>{isSignUp ? "Create your account" : "Welcome back! Please login."}</p>
                </div>

                {isSignUp ? (
                    <form onSubmit={handleSignUpSubmit} className="auth-form">
                        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                        <div className="radio-group">
                           <label><input type="radio" value="staff" checked={userType === 'staff'} onChange={() => setUserType('staff')} /> Staff</label>
                           <label><input type="radio" value="brand" checked={userType === 'brand'} onChange={() => setUserType('brand')} /> Brand</label>
                        </div>
                        {userType === 'staff' && (
                            <select value={role} onChange={e => setRole(e.target.value as UserRole)} required>
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        )}
                        <div className="username-group">
                          <input type="text" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} required />
                          <span>{domain}</span>
                        </div>
                        {fullUsername && <p className="username-preview">Your ID will be: <strong>{fullUsername}</strong></p>}
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                        <button type="submit" className="auth-button">Sign Up</button>
                    </form>
                ) : (
                    <form onSubmit={handleLoginSubmit} className="auth-form">
                        <input type="text" placeholder="Username (e.g., alice@bihstaff)" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} required />
                        <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                        <button type="submit" className="auth-button">Login</button>
                    </form>
                )}

                <div className="auth-toggle">
                    <p>
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}
                        <button onClick={() => setIsSignUp(!isSignUp)}>
                            {isSignUp ? "Login" : "Sign Up"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [taskRequests, setTaskRequests] = useState<TaskRequest[]>(initialTaskRequests);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>(['Welcome to the new dashboard! Please review your tasks for today.']);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [finalizingRequest, setFinalizingRequest] = useState<TaskRequest | null>(null);
  const [view, setView] = useState<'dashboard' | 'calendar' | 'people'>('dashboard');
  const [roles, setRoles] = useState<UserRole[]>(initialRoles);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>(initialDeletionRequests);
  const [birthdayWishes, setBirthdayWishes] = useState<BirthdayWish[]>(initialBirthdayWishes);

  useEffect(() => {
    const intervalId = setInterval(() => {
        const now = new Date().getTime();
        let tasksChanged = false;
        const updatedTasks = tasks.map(task => {
            const endTime = new Date(task.endTime).getTime();
            if (now > endTime && task.status !== 'Completed' && task.status !== 'Pending') {
                tasksChanged = true;
                const historyEntry: HistoryEntry = {
                    userId: 0, // System user
                    action: 'Task became overdue and was marked as Pending',
                    timestamp: new Date().toISOString(),
                };
                return { ...task, status: 'Pending' as TaskStatus, history: [...task.history, historyEntry] };
            }
            return task;
        });

        if (tasksChanged) {
            setTasks(updatedTasks);
        }
    }, 5000); // Check for overdue tasks every 5 seconds

    return () => clearInterval(intervalId);
  }, [tasks]);

  const birthdayUsers = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    return users.filter(u => {
        if (!u.dob) return false;
        // DOB is YYYY-MM-DD string, need to parse carefully to avoid timezone issues.
        const [year, month, day] = u.dob.split('-').map(Number);
        return month - 1 === todayMonth && day === todayDate;
    });
  }, [users]);

  const handleLogin = (username: string, password: string) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        setCurrentUser(user);
        setView('dashboard');
    } else {
        alert('Invalid credentials');
    }
  };

  const handleSignUp = (newUser: Omit<User, 'id' | 'totalStars' | 'monthlyStars'>) => {
    const userWithId = { ...newUser, id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1, totalStars: 0, monthlyStars: 0 };
    setUsers([...users, userWithId]);
    setCurrentUser(userWithId);
    setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const handleCreateTask = (newTaskData: Omit<Task, 'id'|'status'|'comments'|'attachments'|'history'|'ratings'>) => {
    if(!currentUser) return;
    const taskWithId: Task = { 
        ...newTaskData, 
        id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
        status: 'Pending',
        comments: [],
        attachments: [],
        history: [{ userId: currentUser.id, action: 'Task Created', timestamp: new Date().toISOString() }],
        ratings: {},
    };
    setTasks(prevTasks => [...prevTasks, taskWithId]);
  };

   const handleCreateTaskRequest = (requestData: Omit<TaskRequest, 'id' | 'brandId' | 'status'>) => {
    if (!currentUser || currentUser.userType !== 'brand') return;
    const newRequest: TaskRequest = {
        ...requestData,
        id: taskRequests.length > 0 ? Math.max(...taskRequests.map(r => r.id)) + 1 : 1,
        brandId: currentUser.id,
        status: 'pending',
    };
    setTaskRequests(prev => [...prev, newRequest]);
    alert('Your task request has been submitted for approval.');
  };

  const handleApproveTaskRequest = (requestId: number) => {
    const request = taskRequests.find(r => r.id === requestId);
    if (request) {
        setFinalizingRequest(request);
    }
  };

   const handleFinalizeTaskFromRequest = (request: TaskRequest, taskData: Omit<Task, 'id' | 'status' | 'comments' | 'attachments' | 'history' | 'ratings' | 'isBrandRequested' | 'title' | 'description' | 'brandId'>) => {
    if (!currentUser) return;

    const newTask: Task = {
        ...taskData,
        id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
        title: request.title,
        description: request.description,
        brandId: request.brandId,
        status: 'Pending',
        comments: [],
        attachments: [],
        history: [{ userId: currentUser.id, action: `Task created from approved brand request #${request.id}`, timestamp: new Date().toISOString() }],
        ratings: {},
        isBrandRequested: true,
    };

    setTasks(prev => [...prev, newTask]);
    setTaskRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'approved' } : r));
    setFinalizingRequest(null);
  };

  const handleDeclineTaskRequest = (requestId: number) => {
     if (!currentUser || (currentUser.role !== 'Founder' && currentUser.role !== 'Manager')) return;
     setTaskRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'declined' } : r));
  };
  
  const handlePublishAnnouncement = (note: string) => {
    setAnnouncements(prev => [note, ...prev]);
  };

  const handleUpdateTask = useCallback((updatedTask: Task) => {
      setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      if(selectedTask?.id === updatedTask.id) {
          setSelectedTask(updatedTask);
      }
  }, [selectedTask]);
  
  const handleInitiateComplete = (task: Task) => {
    setCompletingTask(task);
    setSelectedTask(null);
  };

  const handleCancelComplete = () => {
    setCompletingTask(null);
  };

  const handleConfirmComplete = (taskId: number, commentText: string, file: File | null) => {
    if (!currentUser) return;
    
    const taskToComplete = tasks.find(t => t.id === taskId);
    if (!taskToComplete) return;

    const newComments = [...taskToComplete.comments];
    if (commentText.trim() || file) {
      const newComment: Comment = {
        userId: currentUser.id,
        text: commentText,
        timestamp: new Date().toISOString(),
      };
      if (file) {
        newComment.attachment = { fileName: file.name, url: '#' };
      }
      newComments.push(newComment);
    }

    const historyEntry: HistoryEntry = {
        userId: currentUser.id,
        action: 'Status changed to Completed',
        timestamp: new Date().toISOString(),
    };

    const updatedTask = {
        ...taskToComplete,
        status: 'Completed' as TaskStatus,
        comments: newComments,
        history: [...taskToComplete.history, historyEntry]
    };
    
    handleUpdateTask(updatedTask);
    setCompletingTask(null);
  };

  const handleRateTask = (taskId: number, rating: number) => {
    if (!currentUser) return;
    const raterId = currentUser.id;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.ratings[raterId] !== undefined) return;

    const updatedTask = { ...task, ratings: { ...task.ratings, [raterId]: rating } };
    handleUpdateTask(updatedTask);

    const updatedUsers = users.map(user => {
        if (task.assignedTo.includes(user.id)) {
            return { 
                ...user, 
                totalStars: user.totalStars + rating,
                monthlyStars: user.monthlyStars + rating,
            };
        }
        return user;
    });
    setUsers(updatedUsers);
  };
  
  const handleSelectTask = (task: Task) => setSelectedTask(task);
  const handleCloseTaskModal = () => setSelectedTask(null);

  const handleViewProfile = (user: User) => {
    if (currentUser?.userType === 'staff') {
      setViewingProfile(user);
    }
  };
  const handleCloseProfileModal = () => setViewingProfile(null);

  const handleUpdateProfile = (updatedProfile: User) => {
    setUsers(users.map(u => u.id === updatedProfile.id ? updatedProfile : u));
    if (currentUser?.id === updatedProfile.id) {
        setCurrentUser(updatedProfile);
    }
    setViewingProfile(updatedProfile);
  };

  const handleAddRole = (role: string) => setRoles(prev => [...prev, role]);

  const handleAddUser = (newUser: Omit<User, 'id' | 'totalStars' | 'monthlyStars'>) => {
    const userWithId = { ...newUser, id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1, totalStars: 0, monthlyStars: 0 };
    setUsers([...users, userWithId]);
  };
  
  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handlePromoteUser = (userId: number) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: 'Manager' } : u));
  };
  
  const handleRequestDeletion = (targetUserId: number, reason: string) => {
    if (!currentUser) return;
    const newRequest: DeletionRequest = {
        id: deletionRequests.length > 0 ? Math.max(...deletionRequests.map(r => r.id)) + 1 : 1,
        requestedById: currentUser.id,
        targetUserId,
        reason,
        status: 'pending',
    };
    setDeletionRequests(prev => [...prev, newRequest]);
    alert('Your request to delete the user has been sent to a Founder for approval.');
  };

  const handleResolveDeletionRequest = (requestId: number, approve: boolean) => {
    const request = deletionRequests.find(r => r.id === requestId);
    if (!request) return;

    if (approve) {
        handleDeleteUser(request.targetUserId);
    }
    setDeletionRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handlePostBirthdayWish = (wish: Omit<BirthdayWish, 'timestamp'>) => {
    const newWish = { ...wish, timestamp: new Date().toISOString() };
    setBirthdayWishes(prev => [...prev, newWish]);
  };

  const mainContent = () => {
    if(!currentUser) return null;
    if(currentUser.userType !== 'staff') {
        return <BrandDashboard 
            user={currentUser}
            users={users}
            tasks={tasks.filter(t => t.brandId === currentUser.id)}
            taskRequests={taskRequests.filter(r => r.brandId === currentUser.id)}
            onSelectTask={handleSelectTask}
            onCreateTaskRequest={handleCreateTaskRequest}
        />;
    }
    switch (view) {
        case 'dashboard':
             return <Dashboard 
                user={currentUser} 
                users={users}
                tasks={tasks}
                announcements={announcements}
                taskRequests={taskRequests}
                birthdayUsers={birthdayUsers}
                birthdayWishes={birthdayWishes}
                onCreateTask={handleCreateTask}
                onSelectTask={handleSelectTask}
                onPublishAnnouncement={handlePublishAnnouncement}
                onViewProfile={handleViewProfile}
                onApproveTaskRequest={handleApproveTaskRequest}
                onDeclineTaskRequest={handleDeclineTaskRequest}
                onPostBirthdayWish={handlePostBirthdayWish}
            />;
        case 'calendar':
            return <CalendarView tasks={tasks} onSelectTask={handleSelectTask}/>;
        case 'people':
            return <PeopleManagementPanel 
                currentUser={currentUser}
                users={users}
                roles={roles}
                deletionRequests={deletionRequests}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                onPromoteUser={handlePromoteUser}
                onAddRole={handleAddRole}
                onRequestDeletion={handleRequestDeletion}
                onResolveDeletionRequest={handleResolveDeletionRequest}
                onViewProfile={handleViewProfile}
            />
        default:
            return null;
    }
  };
  
  return (
    <>
      {!currentUser ? 
        <AuthPage onLogin={handleLogin} onSignUp={handleSignUp} users={users} roles={roles}/> :
        (
            <>
                <header>
                    <h1>Brands In House <span className="short-form">(BIH)</span></h1>
                     {currentUser.userType === 'staff' && (
                        <div className="view-switcher">
                            <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'active' : ''}>Dashboard</button>
                            <button onClick={() => setView('calendar')} className={view === 'calendar' ? 'active' : ''}>Calendar</button>
                            {(currentUser.role === 'Founder' || currentUser.role === 'Manager') && (
                                <button onClick={() => setView('people')} className={view === 'people' ? 'active' : ''}>People</button>
                            )}
                        </div>
                    )}
                    <div className="header-user-info">
                        <span>Welcome, <UserDisplay user={currentUser} onClick={(user, e) => handleViewProfile(user)} isClickable={currentUser.userType === 'staff'}/></span>
                        {currentUser.userType === 'staff' && <button onClick={() => handleViewProfile(currentUser)} className="profile-button">My Profile</button>}
                        <button onClick={handleLogout} className="logout-button">Logout</button>
                    </div>
                </header>
                 {mainContent()}
            </>
        )
      }
      {selectedTask && currentUser && (
        <TaskDetailModal 
            task={selectedTask} 
            users={users}
            currentUser={currentUser}
            onClose={handleCloseTaskModal}
            onUpdateTask={handleUpdateTask}
            onRateTask={handleRateTask}
            onViewProfile={handleViewProfile}
            onInitiateComplete={handleInitiateComplete}
        />
      )}
      {viewingProfile && currentUser && currentUser.userType === 'staff' && (
          <ProfileModal
            user={viewingProfile}
            currentUser={currentUser}
            onClose={handleCloseProfileModal}
            onUpdateProfile={handleUpdateProfile}
        />
      )}
      {completingTask && currentUser && (
        <CompleteTaskModal
            task={completingTask}
            onClose={handleCancelComplete}
            onConfirm={handleConfirmComplete}
        />
      )}
      {finalizingRequest && currentUser && (
          <FinalizeRequestModal
            request={finalizingRequest}
            currentUser={currentUser}
            users={users}
            onCancel={() => setFinalizingRequest(null)}
            onSubmit={(taskData) => handleFinalizeTaskFromRequest(finalizingRequest, taskData)}
          />
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);