import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, UserPlus, Loader2, X, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API, useAuth } from '@/App';

const CreateGoalsModal = ({ isOpen, onClose, campaign, onGoalsCreated }) => {
  const { token } = useAuth();
  const [mode, setMode] = useState(null); // 'manual' or 'ai'
  const [generating, setGenerating] = useState(false);
  const [generatedGoals, setGeneratedGoals] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen && campaign) {
      loadUsers();
    }
  }, [isOpen, campaign]);

  const loadUsers = async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!token || !campaign) {
      toast.error('Campaign information is missing');
      return;
    }
    
    if (!campaign.id) {
      console.error('Campaign object:', campaign);
      toast.error('Campaign ID is missing');
      return;
    }
    
    setGenerating(true);
    try {
      const requestBody = {
        campaignId: String(campaign.id),
        autoAssign: false
      };
      console.log('Sending request:', requestBody);
      
      const response = await axios.post(
        `${API}/kanban/generate-goals`,
        requestBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGeneratedGoals(response.data || []);
      setSelectedGoals(response.data.map(g => g.id)); // Select all by default
      toast.success(`Generated ${response.data.length} goals!`);
    } catch (error) {
      console.error('Failed to generate goals:', error);
      console.error('Error response:', error.response);
      // Handle FastAPI validation errors (422) and server errors (500)
      let errorMessage = 'Failed to generate goals';
      if (error.response?.data) {
        if (Array.isArray(error.response.data.detail)) {
          // FastAPI validation errors are arrays
          errorMessage = error.response.data.detail.map(err => 
            typeof err === 'string' ? err : (err.msg || JSON.stringify(err))
          ).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          // Try to extract any error message
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGoals = async () => {
    if (!token || !campaign) return;
    if (selectedGoals.length === 0) {
      toast.error('Please select at least one goal to save');
      return;
    }

    try {
      const goalsToSave = generatedGoals.filter(g => selectedGoals.includes(g.id));
      
      for (const goal of goalsToSave) {
        // Ensure all fields are properly formatted
        const goalData = {
          campaignId: String(campaign.id),
          title: String(goal.title || 'Untitled Goal'),
          description: String(goal.description || ''),
          department: String(goal.department || 'sales'),
          owners: Array.isArray(goal.owners) ? goal.owners : [],
          teamMembers: Array.isArray(goal.teamMembers) ? goal.teamMembers : [],
          dependencies: Array.isArray(goal.dependencies) ? goal.dependencies : [],
          metrics: Array.isArray(goal.metrics) ? goal.metrics : [],
          keyResults: Array.isArray(goal.keyResults) ? goal.keyResults : [],
          status: String(goal.status || 'on-track'),
          progress: typeof goal.progress === 'number' ? goal.progress : parseInt(goal.progress) || 0
        };
        
        console.log('Saving goal:', goalData);
        
        await axios.post(
          `${API}/kanban/goals`,
          goalData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      toast.success(`Successfully created ${goalsToSave.length} goals!`);
      if (onGoalsCreated) {
        onGoalsCreated();
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save goals:', error);
      console.error('Error response:', error.response);
      
      // Handle FastAPI validation errors (422)
      let errorMessage = 'Failed to save goals';
      if (error.response?.data) {
        if (Array.isArray(error.response.data.detail)) {
          // FastAPI validation errors are arrays
          errorMessage = error.response.data.detail.map(err => 
            typeof err === 'string' ? err : (err.msg || `${err.loc?.join('.')}: ${err.msg || 'validation error'}`)
          ).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    setMode(null);
    setGeneratedGoals([]);
    setSelectedGoals([]);
    onClose();
  };

  const toggleGoalSelection = (goalId) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSelectAll = () => {
    if (selectedGoals.length === generatedGoals.length) {
      // Deselect all
      setSelectedGoals([]);
    } else {
      // Select all
      setSelectedGoals(generatedGoals.map(g => g.id));
    }
  };

  const handleRemoveGoal = (goalId, e) => {
    e.stopPropagation(); // Prevent triggering the card click
    setGeneratedGoals(prev => prev.filter(g => g.id !== goalId));
    setSelectedGoals(prev => prev.filter(id => id !== goalId));
  };

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create Goals for Campaign</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Campaign Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{campaign.title}</h3>
            <p className="text-sm text-gray-600">{campaign.description}</p>
          </div>

          {/* Mode Selection */}
          {!mode && (
            <div className="space-y-4">
              <p className="text-gray-700 mb-4">Choose how you want to create goals:</p>
              
              <button
                onClick={() => setMode('ai')}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">AI Generate Goals</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Let AI analyze the campaign and generate strategic goals automatically
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('manual')}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <UserPlus className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Create Manually</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Create goals step by step with full control
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* AI Generation Mode */}
          {mode === 'ai' && (
            <div className="space-y-4">
              {generatedGoals.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate AI Goals</h3>
                  <p className="text-gray-600 mb-6">
                    AI will analyze the campaign and create strategic goals across departments
                  </p>
                  <Button
                    onClick={handleGenerateAI}
                    disabled={generating}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Goals
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Generated Goals ({generatedGoals.length})
                    </h3>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleSelectAll}
                        variant="outline"
                        className="text-sm"
                      >
                        {selectedGoals.length === generatedGoals.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        onClick={handleSaveGoals}
                        disabled={selectedGoals.length === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Save {selectedGoals.length} Selected Goal{selectedGoals.length !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </div>

                  {generatedGoals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No goals available. Click "Generate Goals" to create new ones.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {generatedGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                            selectedGoals.includes(goal.id)
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleGoalSelection(goal.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                              {selectedGoals.includes(goal.id) ? (
                                <CheckCircle className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                <span className="px-2 py-1 bg-gray-100 rounded">
                                  {goal.department}
                                </span>
                                <span>{goal.owners.length} owner{goal.owners.length !== 1 ? 's' : ''}</span>
                                <span>{goal.keyResults?.length || 0} key results</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleRemoveGoal(goal.id, e)}
                              className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Remove this goal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Manual goal creation will be available in the Goals Management section.
                For now, please use AI generation or create goals directly in Goals Management.
              </p>
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          )}

          {/* Back Button */}
          {mode && generatedGoals.length === 0 && (
            <div className="mt-6">
              <Button onClick={() => setMode(null)} variant="outline">
                Back
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGoalsModal;

