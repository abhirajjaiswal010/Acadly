import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createClass, fetchClass, updateClass } from '../redux/slices/classSlice';
import { 
  ArrowLeft, BookOpen, Type, Maximize, Tags, 
  ShieldCheck, Sparkles, Save, Info, Plus, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const ClassForm = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentClass, loading } = useSelector((state) => state.classes);

  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    maxStudents: 50,
    tags: '',
    isActive: true,
  });

  useEffect(() => {
    if (isEdit) {
      dispatch(fetchClass(id));
    }
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (isEdit && currentClass && currentClass._id === id) {
      setForm({
        title: currentClass.title || '',
        description: currentClass.description || '',
        subject: currentClass.subject || '',
        maxStudents: currentClass.maxStudents || 50,
        tags: (currentClass.tags || []).join(', '),
        isActive: currentClass.isActive !== false,
      });
    }
  }, [currentClass, id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      maxStudents: parseInt(form.maxStudents),
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    let result;
    if (isEdit) {
      result = await dispatch(updateClass({ id, ...payload }));
    } else {
      result = await dispatch(createClass(payload));
    }

    if (!result.error) {
      navigate('/dashboard');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="page-container" 
      style={{ maxWidth: '700px' }}
    >
      <div className="mb-4">
        <button
          className="btn btn-ghost btn-sm mb-4"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to Hub
        </button>
        <h1 className="dashboard-title">
          {isEdit ? 'Refine Session' : 'New Knowledge Quest'}
        </h1>
        <p className="dashboard-subtitle">
          {isEdit
            ? 'Adjust your classroom settings and material for your students.'
            : 'Prepare your virtual space and invite students to learn together.'}
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Type size={14} />
              Session Title *
            </label>
            <input
              id="class-title"
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g. Master React in 60 Minutes"
              value={form.title}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={100}
            />
          </div>

          <div className="grid grid-2 gap-4">
            {/* Subject */}
            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <BookOpen size={14} />
                Focus Topic
              </label>
              <input
                id="class-subject"
                type="text"
                name="subject"
                className="form-input"
                placeholder="e.g. Web Development"
                value={form.subject}
                onChange={handleChange}
              />
            </div>

            {/* Max Students */}
            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <Maximize size={14} />
                Student Limit
              </label>
              <input
                id="class-max-students"
                type="number"
                name="maxStudents"
                className="form-input"
                placeholder="50"
                value={form.maxStudents}
                onChange={handleChange}
                min={1}
                max={200}
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Brief Overview</label>
            <textarea
              id="class-description"
              name="description"
              className="form-input"
              placeholder="Describe what learners will achieve in this session..."
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              style={{ resize: 'none' }}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Tags size={14} />
              Skill Tags (comma-separated)
            </label>
            <input
              id="class-tags"
              type="text"
              name="tags"
              className="form-input"
              placeholder="javascript, ui, design"
              value={form.tags}
              onChange={handleChange}
            />
          </div>

          {/* Active status */}
          {isEdit && (
            <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border mt-2">
              <input
                id="class-is-active"
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="class-is-active" className="form-label mb-0 cursor-pointer font-semibold">
                Class visibility: {form.isActive ? 'Public & Active' : 'Hidden / Maintenance'}
              </label>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              className="btn btn-secondary flex-1"
              onClick={() => navigate('/dashboard')}
            >
              Discard
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
              id="class-form-submit"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Calendar size={18} />
                </motion.div>
              ) : isEdit ? (
                <Save size={18} />
              ) : (
                <Plus size={18} />
              )}
              <span>{loading ? 'Committing...' : isEdit ? 'Update Class' : 'Launch Session'}</span>
            </button>
          </div>
        </form>
      </div>

      {!isEdit && (
        <div className="mt-4 p-4 bg-accent/5 rounded-xl border border-accent/20 flex gap-3">
          <Info size={18} className="text-accent mt-0.5" />
          <p className="text-sm text-secondary leading-relaxed">
            <strong className="text-accent">Note:</strong> A unique session code will be generated upon launch. You can share this with your students from the Dashboard.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ClassForm;
