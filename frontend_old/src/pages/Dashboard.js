import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  fetchClasses,
  deleteClass,
  fetchClassBySession,
} from '../redux/slices/classSlice';
import toast from 'react-hot-toast';
import { 
  Plus, BookOpen, Video, Users, Star, Copy, Trash2, Edit3, 
  X, Sparkles, LayoutGrid, Search, Trash, GraduationCap,
  Calendar, Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { classes, loading } = useSelector((state) => state.classes);

  const [sessionCode, setSessionCode] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    dispatch(fetchClasses());
  }, [dispatch]);

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!sessionCode.trim()) return;
    setJoiningCode(true);
    try {
      const result = await dispatch(fetchClassBySession(sessionCode.trim().toUpperCase()));
      if (!result.error) {
        const cls = result.payload;
        navigate(`/classroom/${cls.sessionId}`);
      }
    } finally {
      setJoiningCode(false);
    }
  };

  const handleEnterClassroom = (cls) => {
    navigate(`/classroom/${cls.sessionId}`);
  };

  const handleDelete = async (id) => {
    await dispatch(deleteClass(id));
    setDeleteConfirm(null);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code "${code}" copied!`);
  };

  const liveCount = classes.filter((c) => c.isLive).length;
  const totalStudents = classes.reduce((acc, c) => acc + (c.students?.length || 0), 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="dashboard-header"
      >
        <div>
          <h1 className="dashboard-title">
            {isTeacher ? 'Teacher Hub' : 'Learning Hub'}
          </h1>
          <p className="dashboard-subtitle">
            Welcome back, <span className="font-bold text-primary">{user?.name}</span>! Ready for today's session?
          </p>
        </div>

        {isTeacher && (
          <Link to="/classes/create" className="btn btn-primary btn-lg">
            <Plus size={20} />
            <span>Create New Class</span>
          </Link>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="stats-grid"
      >
        <motion.div variants={itemVariants} className="stat-card">
          <div className="stat-icon purple"><BookOpen size={24} /></div>
          <div>
            <div className="stat-value">{classes.length}</div>
            <div className="stat-label">Total Classes</div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="stat-card">
          <div className="stat-icon green"><Video size={24} /></div>
          <div>
            <div className="stat-value">{liveCount}</div>
            <div className="stat-label">Live Now</div>
          </div>
        </motion.div>
        {isTeacher && (
          <motion.div variants={itemVariants} className="stat-card">
            <div className="stat-icon blue"><Users size={24} /></div>
            <div>
              <div className="stat-value">{totalStudents}</div>
              <div className="stat-label">Total Students</div>
            </div>
          </motion.div>
        )}
        <motion.div variants={itemVariants} className="stat-card">
          <div className="stat-icon orange"><Star size={24} /></div>
          <div>
            <div className="stat-value capitalize">{user?.role}</div>
            <div className="stat-label">Your Status</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Join by code (students) */}
      {isStudent && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <form className="join-class-form" onSubmit={handleJoinByCode}>
            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <Search size={14} />
                Quick Join Session
              </label>
              <input
                id="session-code-input"
                type="text"
                className="form-input"
                placeholder="Paste code here (e.g. A1B2C3D4)"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                maxLength={8}
                style={{ letterSpacing: '0.15em', fontWeight: '800', fontFamily: 'monospace' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-accent btn-lg"
              disabled={!sessionCode.trim() || joiningCode}
            >
              {joiningCode ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Calendar size={20} />
                </motion.div>
              ) : (
                <Sparkles size={20} />
              )}
              <span>{joiningCode ? 'Joining...' : 'Jump In'}</span>
            </button>
          </form>
        </motion.div>
      )}

      {/* Classes Grid */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid size={18} className="text-secondary" />
          <h2 className="text-lg font-bold text-secondary">
            {isTeacher ? 'Managed Courses' : 'Your Enrolled Courses'}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="loading-spinner" />
            <p className="text-muted mt-3">Fetching your learning material...</p>
          </div>
        ) : classes.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="empty-state card"
          >
            <div className="empty-icon">
              {isTeacher ? <GraduationCap size={48} /> : <BookOpen size={48} />}
            </div>
            <h3>{isTeacher ? 'No classes found' : 'No active enrollments'}</h3>
            <p className="max-w-xs mx-auto mb-4">
              {isTeacher
                ? 'Ready to share your knowledge? Start by creating your very first session!'
                : 'Join a class using a session code or wait for your teacher to invite you.'}
            </p>
            {isTeacher && (
              <Link to="/classes/create" className="btn btn-primary">
                <Plus size={18} />
                Create First Class
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="classes-grid"
          >
            {classes.map((cls) => (
              <motion.div key={cls._id} variants={itemVariants}>
                <ClassCard
                  cls={cls}
                  isTeacher={isTeacher}
                  onEnter={() => handleEnterClassroom(cls)}
                  onDelete={() => setDeleteConfirm(cls._id)}
                  onCopyCode={() => copyCode(cls.sessionId)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay" 
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="modal" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title flex items-center gap-2">
                  <Trash2 className="text-danger" />
                  Delete Class
                </h2>
                <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                  <X size={18} />
                </button>
              </div>
              <p className="text-secondary mb-4">
                Are you sure? This will permanently remove <span className="font-bold text-primary">Class Data</span> and all student records for this session.
              </p>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  Keep Class
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                  <Trash size={18} />
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ClassCard = ({ cls, isTeacher, onEnter, onDelete, onCopyCode }) => {
  return (
    <div className="class-card">
      <div className="class-card-header">
        <div className="flex-1 min-w-0">
          <div className="class-card-title truncate" title={cls.title}>{cls.title}</div>
          {cls.subject && (
            <div className="class-card-subject flex items-center gap-1.5">
              <Book size={12} strokeWidth={2.5} />
              {cls.subject}
            </div>
          )}
          <div className="mt-3 flex gap-2 flex-wrap">
            {cls.isLive && <span className="badge badge-live">🔴 LIVE</span>}
            <span className={`badge ${cls.isActive ? 'badge-success' : 'badge-danger'}`}>
              {cls.isActive ? 'Active' : 'Closed'}
            </span>
          </div>
        </div>
        <div className="session-code" onClick={onCopyCode} title="Copy session code">
          <span>{cls.sessionId}</span>
          <Copy size={12} />
        </div>
      </div>

      <div className="class-card-body">
        <p className="class-card-description">{cls.description || 'No session description provided.'}</p>

        <div className="class-card-meta">
          <span className="flex items-center gap-1">
            <GraduationCap size={14} />
            {cls.teacher?.name || 'Instructor'}
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} />
            {cls.students?.length || 0} Learners
          </span>
        </div>
      </div>

      <div className="class-card-actions">
        <button
          className={`btn ${cls.isLive ? 'btn-accent' : 'btn-primary'} flex-1`}
          onClick={onEnter}
        >
          {cls.isLive ? <Video size={16} /> : <Sparkles size={16} />}
          <span>{cls.isLive ? 'Join Now' : 'Enter Class'}</span>
        </button>

        {isTeacher && (
          <>
            <Link to={`/classes/edit/${cls._id}`} className="btn btn-secondary btn-icon">
              <Edit3 size={18} />
            </Link>
            <button className="btn btn-ghost btn-icon text-danger" onClick={onDelete}>
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

export default Dashboard;
