import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, X, Plus, Trash2, Send, Clock, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const PollSystem = ({ socket, roomId, userRole, userId }) => {
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [activePoll, setActivePoll] = useState(null);
  const [polls, setPolls] = useState([]);
  const [votedPolls, setVotedPolls] = useState(new Set());
  const [showPollHistory, setShowPollHistory] = useState(false);

  // Form State for creating poll
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    if (!socket) return;

    // Listen for new polls
    socket.on('new-poll', (poll) => {
      setActivePoll(poll);
      setPolls(prev => [poll, ...prev]);
      toast.success('New Poll Started!', { icon: '📊' });
    });

    // Listen for poll updates (votes)
    socket.on('poll-update', (updatedPoll) => {
      if (activePoll?._id === updatedPoll._id) {
        setActivePoll(updatedPoll);
      }
      setPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
    });

    // Listen for poll ended
    socket.on('poll-ended', (endedPoll) => {
      if (activePoll?._id === endedPoll._id) {
        setActivePoll(endedPoll);
        setTimeout(() => setActivePoll(null), 5000); // Hide after 5 seconds
      }
      setPolls(prev => prev.map(p => p._id === endedPoll._id ? endedPoll : p));
      toast.error('Poll Ended', { icon: '⏱️' });
    });

    // Listen for active polls on join
    socket.on('active-polls', (activePolls) => {
      if (activePolls.length > 0) {
        setActivePoll(activePolls[0]);
        setPolls(prev => [...activePolls, ...prev]);
      }
    });

    socket.emit('get-active-polls', { roomId });

    return () => {
      socket.off('new-poll');
      socket.off('poll-update');
      socket.off('poll-ended');
      socket.off('active-polls');
    };
  }, [socket, roomId, activePoll?._id]);

  const handleCreatePoll = (e) => {
    e.preventDefault();
    if (!question.trim() || options.some(opt => !opt.trim())) {
      return toast.error('Please fill all fields');
    }
    socket.emit('create-poll', {
      roomId,
      question,
      options: options.filter(opt => opt.trim() !== ''),
      duration,
      anonymous: false
    });
    setShowCreatePool(false);
    setQuestion('');
    setOptions(['', '']);
    setDuration(30);
  };

  const handleVote = (optionIndex) => {
    if (votedPolls.has(activePoll._id)) return;
    socket.emit('cast-vote', { pollId: activePoll._id, optionIndex });
    setVotedPolls(prev => new Set([...prev, activePoll._id]));
  };

  const handleAddOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getTotalVotes = (poll) => {
    return poll.options.reduce((acc, opt) => acc + opt.votes, 0);
  };

  return (
    <>
      {/* Poll Toggle Button in Controls (Triggered from Parent) */}
      <button 
        className="control-btn" 
        onClick={() => userRole === 'teacher' ? setShowCreatePool(true) : setShowPollHistory(true)}
      >
        <BarChart2 size={20} />
        <span>Poll</span>
      </button>

      {/* 1. Create Poll Modal (Teacher) */}
      <AnimatePresence>
        {showCreatePool && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-md rounded-2xl border border-border overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-bottom border-border flex items-center justify-between bg-primary-glow">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="text-primary" /> Create New Poll
                </h2>
                <button onClick={() => setShowCreatePool(false)} className="p-1 hover:bg-black/10 rounded-full">
                  <X />
                </button>
              </div>

              <form onSubmit={handleCreatePoll} className="p-6 space-y-4">
                <div className="form-group">
                  <label className="form-label">Question</label>
                  <textarea 
                    className="form-input min-h-[80px]" 
                    placeholder="Enter your question here..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="form-label">Options (Max 5)</label>
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        className="form-input" 
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[idx] = e.target.value;
                          setOptions(newOpts);
                        }}
                        required
                      />
                      {options.length > 2 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2 text-danger hover:bg-danger/10 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 5 && (
                    <button 
                      type="button" 
                      onClick={handleAddOption}
                      className="text-primary font-semibold text-sm flex items-center gap-1 hover:underline"
                    >
                      <Plus size={16} /> Add Option
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (seconds)</label>
                  <select 
                    className="form-select"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    <option value={15}>15 Seconds</option>
                    <option value={30}>30 Seconds</option>
                    <option value={60}>1 Minute</option>
                    <option value={120}>2 Minutes</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button type="submit" className="btn btn-primary btn-full gap-2">
                    <Send size={18} /> Launch Poll
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Active Poll Notification / Modal (Student) */}
      <AnimatePresence>
        {activePoll && (
          <div className="fixed top-24 right-6 z-[999] w-80">
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="bg-surface rounded-xl border border-primary shadow-xl overflow-hidden"
            >
              <div className="p-4 bg-primary text-white flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold">
                  <BarChart2 size={18} /> Live Poll
                </span>
                <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  <Clock size={12} />
                  {activePoll.active ? 'Ends soon' : 'Ended'}
                </div>
              </div>

              <div className="p-4 space-y-4">
                <h3 className="font-bold text-lg leading-tight">{activePoll.question}</h3>
                
                <div className="space-y-2">
                  {activePoll.options.map((option, idx) => {
                    const total = getTotalVotes(activePoll);
                    const percent = calculatePercentage(option.votes, total);
                    const isVoted = votedPolls.has(activePoll._id);
                    const myVote = activePoll.voters.find(v => v.userId === userId && v.optionIndex === idx);

                    return (
                      <button 
                        key={idx}
                        disabled={isVoted || !activePoll.active}
                        onClick={() => handleVote(idx)}
                        className={`w-full text-left p-2 rounded-lg relative overflow-hidden transition-all ${
                          isVoted ? 'cursor-default' : 'hover:bg-primary-glow border border-transparent hover:border-primary'
                        } ${myVote ? 'border-primary bg-primary-glow' : 'bg-base border-border'}`}
                      >
                        {/* Progress Bar Background */}
                        {(isVoted || !activePoll.active) && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            className="absolute inset-0 bg-primary/10 z-0"
                          />
                        )}

                        <div className="relative z-10 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {myVote && <CheckCircle size={14} className="text-primary" />}
                            {option.text}
                          </span>
                          {(isVoted || !activePoll.active) && (
                            <span className="text-sm font-bold text-primary">{percent}%</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-muted pt-2">
                  <span>{getTotalVotes(activePoll)} votes</span>
                  {votedPolls.has(activePoll._id) && (
                    <span className="text-primary font-semibold flex items-center gap-1">
                      <CheckCircle size={12} /> Vote recorded
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Poll History / Results Panel */}
      <AnimatePresence>
        {showPollHistory && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-2xl max-h-[80vh] rounded-2xl border border-border overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-bottom border-border flex items-center justify-between bg-primary-glow">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BarChart2 className="text-primary" /> Poll Results
                </h2>
                <button onClick={() => setShowPollHistory(false)} className="p-1 hover:bg-black/10 rounded-full">
                  <X />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {polls.length === 0 ? (
                  <div className="text-center py-10 text-muted">
                    <Info className="mx-auto mb-2 opacity-20" size={48} />
                    <p>No polls available yet.</p>
                  </div>
                ) : (
                  polls.map((poll) => (
                    <div key={poll._id} className="card p-4 space-y-3 border-primary/20">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg">{poll.question}</h4>
                        <span className={`badge ${poll.active ? 'badge-primary' : 'badge-secondary'}`}>
                          {poll.active ? 'Active' : 'Completed'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {poll.options.map((opt, idx) => {
                          const total = getTotalVotes(poll);
                          const percent = calculatePercentage(opt.votes, total);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{opt.text}</span>
                                <span className="font-bold">{percent}% ({opt.votes})</span>
                              </div>
                              <div className="h-2 w-full bg-base rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  className="h-full bg-primary"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="text-xs text-muted flex justify-between">
                        <span>{new Date(poll.createdAt).toLocaleTimeString()}</span>
                        <span>Total: {getTotalVotes(poll)} votes</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PollSystem;
