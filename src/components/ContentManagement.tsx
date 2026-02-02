import React, { useState } from 'react';
import { FileText, Eye, EyeOff, Save, RotateCcw, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface Section {
  id: string;
  title: string;
  content: string;
  visible: boolean;
  order: number;
}

export function ContentManagement() {
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'navigation',
      title: 'Navigation',
      content: '',
      visible: true,
      order: 1
    },
    {
      id: 'hero',
      title: 'Hero Section',
      content: 'Welcome to LetzPocket - Your UK Lettings Assistant',
      visible: true,
      order: 2
    },
    {
      id: 'features',
      title: 'Features Section',
      content: 'AI-powered tenancy agreement reviews, property management tools, and more.',
      visible: true,
      order: 3
    },
    {
      id: 'chatbot',
      title: 'AI Chatbot',
      content: 'Get instant help with your tenancy questions from our AI assistant.',
      visible: true,
      order: 4
    },
    {
      id: 'testimonials',
      title: 'Testimonials',
      content: 'What our users say about LetzPocket',
      visible: false,
      order: 5
    },
    {
      id: 'pricing',
      title: 'Pricing',
      content: 'Affordable plans for landlords and tenants',
      visible: false,
      order: 6
    }
  ]);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleVisibility = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, visible: !section.visible }
        : section
    ));
    setHasChanges(true);
  };

  const updateSection = (sectionId: string, field: keyof Section, value: any) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, [field]: value }
        : section
    ));
    setHasChanges(true);
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const newSections = [...prev];
      const index = newSections.findIndex(s => s.id === sectionId);
      
      if (direction === 'up' && index > 0) {
        [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      } else if (direction === 'down' && index < newSections.length - 1) {
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      }
      
      return newSections.map((section, idx) => ({ ...section, order: idx + 1 }));
    });
    setHasChanges(true);
  };

  const addNewSection = () => {
    const newSection: Section = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      content: '',
      visible: true,
      order: sections.length + 1
    };
    setSections(prev => [...prev, newSection]);
    setEditingSection(newSection.id);
    setHasChanges(true);
  };

  const deleteSection = (sectionId: string) => {
    // Using window.confirm is acceptable for admin actions
    if (window.confirm('Are you sure you want to delete this section?')) {
      setSections(prev => prev.filter(s => s.id !== sectionId));
      setHasChanges(true);
    }
  };

  const saveChanges = () => {
    // Here you would save to backend/Firestore
    console.log('Saving sections:', sections);
    localStorage.setItem('landingPageSections', JSON.stringify(sections));
    setHasChanges(false);
    alert('Changes saved successfully!');
  };

  const resetChanges = () => {
    // Using window.confirm is acceptable for admin actions
    if (window.confirm('Are you sure you want to reset all changes?')) {
      // Reset to default or load from backend
      const saved = localStorage.getItem('landingPageSections');
      if (saved) {
        setSections(JSON.parse(saved));
      }
      setHasChanges(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
          <p className="text-gray-600">Manage landing page sections and content</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetChanges} disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveChanges} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {sections
          .sort((a, b) => a.order - b.order)
          .map((section, index) => (
            <Card key={section.id} className={`${!section.visible ? 'opacity-50' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === sections.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>
                        Order: {section.order} • {section.visible ? 'Visible' : 'Hidden'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVisibility(section.id)}
                    >
                      {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSection(section.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {editingSection === section.id && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`title-${section.id}`}>Section Title</Label>
                    <Input
                      id={`title-${section.id}`}
                      value={section.title}
                      onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`content-${section.id}`}>Section Content</Label>
                    <Textarea
                      id={`content-${section.id}`}
                      value={section.content}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <Button onClick={addNewSection} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add New Section
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
