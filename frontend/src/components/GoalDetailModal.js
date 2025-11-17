import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, CheckCircle, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API, useAuth } from '@/App';

const GoalDetailModal = ({ isOpen, onClose, goal, onUpdate }) => {
  const { token, user: userEmail } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ description: '', status: 'pending' });
  const [goalProgress, setGoalProgress] = useState(0);
  const [goalStatus, setGoalStatus] = useState('on-track');
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (isOpen && goal && token) {
      loadCurrentUser();
      loadGoalDetails();
    }
  }, [isOpen, goal, token]);

  const loadCurrentUser = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
      
      // Check if user can edit (is owner, team member, or admin)
      const userIsOwner = goal.owners?.includes(response.data.id) || false;
      const userIsTeamMember = goal.teamMembers?.includes(response.data.id) || false;
      const userIsAdmin = response.data.role?.toLowerCase() === 'admin' || 
                         response.data.department?.toLowerCase() === 'admin';
      setCanEdit(userIsOwner || userIsTeamMember || userIsAdmin);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadGoalDetails = async () => {
    if (!token || !goal?.id) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API}/goals/${goal.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const goalData = response.data;
      setTasks(goalData.tasks || []);
      setGoalProgress(goalData.progress || 0);
      setGoalStatus(goalData.status || 'on-track');
    } catch (error) {
      console.error('Failed to load goal details:', error);
      toast.error('Failed to load goal details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    if (!newTask.description.trim()) {
      toast.error('Please enter a task description');
      return;
    }
    
    const task = {
      id: Date.now().toString(),
      description: newTask.description,
      status: newTask.status,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id
    };
    
    setTasks(prev => [...prev, task]);
    setNewTask({ description: '', status: 'pending' });
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleUpdateTaskStatus = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));
  };

  const handleSaveUpdates = async () => {
    if (!token || !goal?.id || !canEdit) return;
    
    setUpdating(true);
    try {
      await axios.put(
        `${API}/goals/${goal.id}`,
        {
          progress: goalProgress,
          status: goalStatus,
          tasks: tasks
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Goal updated successfully!');
      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (error) {
      console.error('Failed to update goal:', error);
      let errorMessage = 'Failed to update goal';
      if (error.response?.data) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(err => 
            typeof err === 'string' ? err : (err.msg || 'validation error')
          ).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen || !goal) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-track': return 'bg-green-100 text-green-700';
      case 'at-risk': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Goal Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {/* Goal Info */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{goal.title}</h3>
                <p className="text-gray-600 mb-4">{goal.description}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(goalStatus)}`}>
                    {goalStatus.replace('-', ' ')}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {goal.department}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Progress</label>
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={goalProgress}
                          onChange={(e) => setGoalProgress(parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">{goalProgress}%</span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${goalProgress}%`,
                        background: goalProgress >= 75
                          ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                          : goalProgress >= 50
                          ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                          : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                      }}
                    />
                  </div>
                </div>

                {/* Status */}
                {canEdit && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <Select value={goalStatus} onValueChange={setGoalStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on-track">On Track</SelectItem>
                        <SelectItem value="at-risk">At Risk</SelectItem>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Tasks Section */}
              {canEdit && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">My Tasks</h4>
                  
                  {/* Add New Task */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex gap-2 mb-2">
                      <Textarea
                        placeholder="Add a new task..."
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        className="flex-1"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={newTask.status} onValueChange={(value) => setNewTask({ ...newTask, status: value })}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAddTask} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Task
                      </Button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2">
                    {tasks.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No tasks added yet</p>
                    ) : (
                      tasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{task.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Select
                                value={task.status}
                                onValueChange={(value) => handleUpdateTaskStatus(task.id, value)}
                              >
                                <SelectTrigger className="w-32 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getTaskStatusColor(task.status)}`}>
                                {task.status.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleDeleteTask(task.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {!canEdit && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    You are not assigned to this goal. Only owners, team members, and admins can update it.
                  </p>
                </div>
              )}

              {/* Key Results */}
              {goal.keyResults && goal.keyResults.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Key Results</h4>
                  <div className="space-y-3">
                    {goal.keyResults.map((kr, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-900 mb-2">{kr.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">
                            {kr.current || 0} / {kr.target || 0}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{
                                width: `${((kr.current || 0) / (kr.target || 1)) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {canEdit && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveUpdates}
                    disabled={updating}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button onClick={onClose} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              )}

              {!canEdit && (
                <Button onClick={onClose} variant="outline" className="w-full">
                  Close
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalDetailModal;

