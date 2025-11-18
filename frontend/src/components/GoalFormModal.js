import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const GoalFormModal = ({ isOpen, onClose, goal = null, quarter = null, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    owner: '',
    status: 'on-track',
    progress: 0,
    targetValue: '',
    currentValue: '',
    metric: '',
    keyResults: [{ id: Date.now(), description: '', progress: 0, target: '', current: '' }]
  });

  useEffect(() => {
    if (goal) {
      // Editing existing goal
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        owner: goal.owner || '',
        status: goal.status || 'on-track',
        progress: goal.progress || 0,
        targetValue: goal.targetValue?.toString() || '',
        currentValue: goal.currentValue?.toString() || '',
        metric: goal.metric || '',
        keyResults: goal.keyResults?.length > 0 
          ? goal.keyResults.map(kr => ({
              id: kr.id || Date.now() + Math.random(),
              description: kr.description || '',
              progress: kr.progress || 0,
              target: kr.target?.toString() || '',
              current: kr.current?.toString() || ''
            }))
          : [{ id: Date.now(), description: '', progress: 0, target: '', current: '' }]
      });
    } else {
      // Creating new goal
      setFormData({
        title: '',
        description: '',
        owner: '',
        status: 'on-track',
        progress: 0,
        targetValue: '',
        currentValue: '',
        metric: '',
        keyResults: [{ id: Date.now(), description: '', progress: 0, target: '', current: '' }]
      });
    }
  }, [goal, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleKeyResultChange = (index, field, value) => {
    setFormData(prev => {
      const newKeyResults = [...prev.keyResults];
      newKeyResults[index] = { ...newKeyResults[index], [field]: value };
      
      // Auto-calculate progress if target and current are provided
      if (field === 'target' || field === 'current') {
        const target = parseFloat(newKeyResults[index].target) || 0;
        const current = parseFloat(newKeyResults[index].current) || 0;
        if (target > 0) {
          newKeyResults[index].progress = Math.min(100, Math.round((current / target) * 100));
        }
      }
      
      return { ...prev, keyResults: newKeyResults };
    });
  };

  const addKeyResult = () => {
    setFormData(prev => ({
      ...prev,
      keyResults: [...prev.keyResults, { id: Date.now() + Math.random(), description: '', progress: 0, target: '', current: '' }]
    }));
  };

  const removeKeyResult = (index) => {
    setFormData(prev => ({
      ...prev,
      keyResults: prev.keyResults.filter((_, i) => i !== index)
    }));
  };

  const calculateOverallProgress = () => {
    if (formData.keyResults.length === 0) return 0;
    const totalProgress = formData.keyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0);
    return Math.round(totalProgress / formData.keyResults.length);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    if (!formData.owner.trim()) {
      toast.error('Please enter an owner');
      return;
    }

    const overallProgress = calculateOverallProgress();
    
    const goalData = {
      ...formData,
      id: goal?.id || Date.now(),
      progress: overallProgress,
      targetValue: parseFloat(formData.targetValue) || 0,
      currentValue: parseFloat(formData.currentValue) || 0,
      keyResults: formData.keyResults.map(kr => ({
        ...kr,
        target: parseFloat(kr.target) || 0,
        current: parseFloat(kr.current) || 0
      })).filter(kr => kr.description.trim() !== '')
    };

    onSave(goalData, goal ? 'update' : 'create');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      style={{ background: 'rgba(0, 0, 0, 0.5)' }} 
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-amber-500 to-orange-600">
          <h3 className="text-white font-bold text-xl" style={{ fontFamily: 'Space Grotesk' }}>
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <Label htmlFor="title">Goal Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Increase Customer Acquisition"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the goal and its objectives..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="owner">Owner *</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  placeholder="e.g., Marketing Team"
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-track">On Track</SelectItem>
                    <SelectItem value="at-risk">At Risk</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Progress Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress Metrics</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentValue">Current Value</Label>
                <Input
                  id="currentValue"
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => handleInputChange('currentValue', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="targetValue">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => handleInputChange('targetValue', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="metric">Metric Unit</Label>
                <Input
                  id="metric"
                  value={formData.metric}
                  onChange={(e) => handleInputChange('metric', e.target.value)}
                  placeholder="e.g., customers, %, $"
                />
              </div>
            </div>
          </div>

          {/* Key Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Key Results</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addKeyResult}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Key Result
              </Button>
            </div>

            <div className="space-y-4">
              {formData.keyResults.map((kr, index) => (
                <div key={kr.id || `kr-form-${index}`} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Key Result {index + 1}</Label>
                    {formData.keyResults.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKeyResult(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`kr-desc-${index}`}>Description</Label>
                    <Input
                      id={`kr-desc-${index}`}
                      value={kr.description}
                      onChange={(e) => handleKeyResultChange(index, 'description', e.target.value)}
                      placeholder="e.g., Launch 3 new acquisition campaigns"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`kr-current-${index}`}>Current</Label>
                      <Input
                        id={`kr-current-${index}`}
                        type="number"
                        value={kr.current}
                        onChange={(e) => handleKeyResultChange(index, 'current', e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`kr-target-${index}`}>Target</Label>
                      <Input
                        id={`kr-target-${index}`}
                        type="number"
                        value={kr.target}
                        onChange={(e) => handleKeyResultChange(index, 'target', e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`kr-progress-${index}`}>Progress</Label>
                      <Input
                        id={`kr-progress-${index}`}
                        type="number"
                        value={kr.progress}
                        onChange={(e) => handleKeyResultChange(index, 'progress', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
              {goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default GoalFormModal;

