import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, RotateCcw, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { contentService, ContentSection, SignInControl, SectionVisibility, HeroText } from '../services/contentService';
import { useAuth } from '../contexts/AuthContext';

export function ContentManagement() {
  const { user } = useAuth();
  const [sections, setSections] = useState<ContentSection[]>([
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

  const [signInControl, setSignInControl] = useState<SignInControl>({
    enabled: true,
    message: ''
  });

  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({
    navigation: true,
    hero: true,
    features: true,
    chatbot: true,
    testimonials: false,
    pricing: false,
    freeReview: true,
    newsletter: true,
    footer: true
  });

  const [heroText, setHeroText] = useState<HeroText>({
    header: 'The Smart Way to Manage Your UK Rental Portfolio',
    subheader: 'LetzPocket empowers UK landlords with AI-powered tools for compliance checking, yield calculations, and portfolio management. Stay ahead of the Renters Rights Act and maximize your rental returns.',
    headerColor: 'black',
    subheaderColor: 'black'
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load content settings from Firebase on component mount
  useEffect(() => {
    const loadContentSettings = async () => {
      try {
        const settings = await contentService.loadContentSettings();
        if (settings) {
          setSections(settings.sections);
          setSignInControl(settings.signInControl);
          setSectionVisibility(settings.sectionVisibility);
          setHeroText(settings.heroText);
        } else {
          // Fallback to localStorage if no Firebase data
          const localData = contentService.loadFromLocalStorage();
          if (localData) {
            setSections(localData.sections);
            setSignInControl(localData.signInControl);
            setSectionVisibility(localData.sectionVisibility);
            setHeroText(localData.heroText);
          }
        }
      } catch (error) {
        console.error('Failed to load from Firebase, falling back to localStorage:', error);
        
        // Fallback to localStorage
        const localData = contentService.loadFromLocalStorage();
        if (localData) {
          setSections(localData.sections);
          setSignInControl(localData.signInControl);
          setSectionVisibility(localData.sectionVisibility);
          setHeroText(localData.heroText);
        }
      }
    };

    loadContentSettings();
  }, []);

  const toggleVisibility = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, visible: !section.visible }
        : section
    ));
    setHasChanges(true);
  };

  const updateSignInControl = (field: keyof SignInControl, value: any) => {
    setSignInControl(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateSectionVisibility = (section: keyof SectionVisibility, value: boolean) => {
    setSectionVisibility(prev => ({ ...prev, [section]: value }));
    setHasChanges(true);
  };

  const updateHeroText = (field: keyof HeroText, value: any) => {
    setHeroText(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateSection = (sectionId: string, field: keyof ContentSection, value: any) => {
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
    const newSection: ContentSection = {
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

  const saveChanges = async () => {
    if (!user) {
      alert('You must be logged in to save changes');
      return;
    }

    try {
      console.log('Saving sections:', sections);
      console.log('Saving sign-in control:', signInControl);
      console.log('Saving section visibility:', sectionVisibility);
      console.log('Saving hero text:', heroText);
      
      // Save to Firebase Firestore
      await contentService.saveContentSettings(sections, signInControl, sectionVisibility, heroText, user.uid);
      
      // Also save to localStorage as backup
      contentService.saveToLocalStorage(sections, signInControl, sectionVisibility, heroText);
      
      setHasChanges(false);
      alert('Changes saved successfully to Firebase!');
    } catch (error) {
      console.error('Failed to save to Firebase:', error);
      alert('Failed to save to Firebase. Changes saved locally only.');
      
      // Fallback to localStorage
      contentService.saveToLocalStorage(sections, signInControl, sectionVisibility, heroText);
      setHasChanges(false);
    }
  };

  const resetChanges = async () => {
    // Using window.confirm is acceptable for admin actions
    if (window.confirm('Are you sure you want to reset all changes?')) {
      try {
        // Try to load from Firebase first
        const settings = await contentService.loadContentSettings();
        if (settings) {
          setSections(settings.sections);
          setSignInControl(settings.signInControl);
          setSectionVisibility(settings.sectionVisibility);
          setHeroText(settings.heroText);
        } else {
          // Fallback to localStorage
          const localData = contentService.loadFromLocalStorage();
          if (localData) {
            setSections(localData.sections);
            setSignInControl(localData.signInControl);
            setSectionVisibility(localData.sectionVisibility);
            setHeroText(localData.heroText);
          }
        }
      } catch (error) {
        console.error('Failed to load from Firebase, falling back to localStorage:', error);
        
        // Fallback to localStorage
        const localData = contentService.loadFromLocalStorage();
        if (localData) {
          setSections(localData.sections);
          setSignInControl(localData.signInControl);
          setSectionVisibility(localData.sectionVisibility);
          setHeroText(localData.heroText);
        }
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

      {/* Sign-In Control Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Sign-In Control</CardTitle>
              <CardDescription>
                Control whether users can sign in to the application
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="signin-enabled"
              checked={signInControl.enabled}
              onChange={(e) => updateSignInControl('enabled', e.target.checked)}
              className="h-4 w-4 text-lp-blue-600 focus:ring-lp-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="signin-enabled" className="text-sm font-medium">
              Enable Sign-In
            </Label>
          </div>
          
          {!signInControl.enabled && (
            <div>
              <Label htmlFor="signin-message" className="text-sm font-medium">
                Disabled Message (shown to users when they try to sign in)
              </Label>
              <Input
                id="signin-message"
                value={signInControl.message || ''}
                onChange={(e) => updateSignInControl('message', e.target.value)}
                placeholder="Sign-in is currently disabled. Please try again later."
                className="mt-1"
              />
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            {signInControl.enabled 
              ? "Users can sign in normally. Sign-in buttons will be active and functional."
              : "Sign-in will be disabled. Buttons will appear grayed out and show a message when clicked."
            }
          </div>
        </CardContent>
      </Card>

      {/* Section Visibility Control Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Section Visibility</CardTitle>
              <CardDescription>
                Control which sections are visible on the landing page
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(sectionVisibility).map(([section, visible]) => (
              <div key={section} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`section-${section}`}
                  checked={visible}
                  onChange={(e) => updateSectionVisibility(section as keyof SectionVisibility, e.target.checked)}
                  className="h-4 w-4 text-lp-blue-600 focus:ring-lp-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor={`section-${section}`} className="text-sm font-medium capitalize">
                  {section.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-gray-500">
            Toggle sections on/off to control what users see on the landing page. Changes apply immediately across all browsers.
          </div>
        </CardContent>
      </Card>

      {/* Hero Text Control Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Hero Text Control</CardTitle>
              <CardDescription>
                Edit the main heading and subheading text on the landing page
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hero-header" className="text-sm font-medium">
              Main Heading
            </Label>
            <Input
              id="hero-header"
              value={heroText.header}
              onChange={(e) => updateHeroText('header', e.target.value)}
              placeholder="Enter main heading text"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="hero-subheader" className="text-sm font-medium">
              Subheading Text
            </Label>
            <Textarea
              id="hero-subheader"
              value={heroText.subheader}
              onChange={(e) => updateHeroText('subheader', e.target.value)}
              placeholder="Enter subheading text"
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="header-color" className="text-sm font-medium">
                Header Color
              </Label>
              <select
                id="header-color"
                value={heroText.headerColor}
                onChange={(e) => updateHeroText('headerColor', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lp-blue-500 focus:border-lp-blue-500"
              >
                <option value="black">Black</option>
                <option value="orange">Orange</option>
                <option value="blue">Blue</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="subheader-color" className="text-sm font-medium">
                Subheader Color
              </Label>
              <select
                id="subheader-color"
                value={heroText.subheaderColor}
                onChange={(e) => updateHeroText('subheaderColor', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lp-blue-500 focus:border-lp-blue-500"
              >
                <option value="black">Black</option>
                <option value="orange">Orange</option>
                <option value="blue">Blue</option>
              </select>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Changes to hero text and colors are applied instantly across all browsers. The colors match your site's design scheme.
          </div>
        </CardContent>
      </Card>

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
