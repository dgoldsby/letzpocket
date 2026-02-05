import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { mailchimpService } from '../services/mailchimp';
import { openaiService } from '../services/openai';
import { useSignInControl } from '../hooks/useSignInControl';
import { useStrapiSections } from '../hooks/useStrapiContent';
import { useStrapiHero } from '../hooks/useStrapiContent';
import { trackCTAClick, trackEvent, EVENT_CATEGORIES, EVENT_ACTIONS, trackFormInteraction, trackFeatureUsage, trackError, PAGE_NAMES } from '../lib/analytics';
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  Star, 
  ArrowRight,
  Calculator,
  TrendingUp,
  Building,
  BarChart3,
  Zap,
  Upload,
  Mail,
  Send,
  Bot,
  User
} from 'lucide-react';
import Logo from './Logo';

interface LandingPageProps {
  onLoginClick?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const [email, setEmail] = useState('');
  const [showFreeReview, setShowFreeReview] = useState(false);
  const [reviewEmail, setReviewEmail] = useState('');
  const { isSignInDisabled, disabledMessage } = useSignInControl();
  const { sections } = useStrapiSections();
  const { heroText, getTextColorClass } = useStrapiHero();
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Track page view on mount
  React.useEffect(() => {
    trackEvent(EVENT_ACTIONS.PAGE_VIEW, EVENT_CATEGORIES.NAVIGATION, PAGE_NAMES.HOME);
  }, []);

  const handleSignInClick = () => {
    trackCTAClick(EVENT_ACTIONS.CTA_SIGN_IN, 'header');
    if (isSignInDisabled) {
      alert(disabledMessage);
      return;
    }
    onLoginClick?.();
  };
  
  // Chatbot state
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    { role: 'assistant', content: 'Hello! I\'m your AI assistant specializing in UK lettings and the Renters Rights Act. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);

    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      trackFeatureUsage('chatbot', 'message_sent', 'lettings_assistant');
      const assistantMessage = await openaiService.askAboutLettings(userMessage);
      setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Chat error:', error);
      trackError('chatbot_error', error instanceof Error ? error.message : 'Unknown error', 'lettings_assistant');
      
      // Check if it's a quota error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'I apologize, but the AI service is currently unavailable due to API quota limits. Please check back later or contact support for assistance. In the meantime, you can find comprehensive information about UK lettings and the Renters Rights Act on our resources page. Of course, my responses cannot be considered legally binding and must be reviewed by your legal representative.' 
        }]);
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I\'m having trouble connecting right now. Please try again later. Of course, my responses cannot be considered legally binding and must be reviewed by your legal representative.' 
        }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    trackFormInteraction(EVENT_ACTIONS.FORM_START, 'newsletter_signup');
    setIsSubmitting(true);
    
    try {
      const result = await mailchimpService.addSubscriber(email);
      
      if (result.success) {
        trackFormInteraction(EVENT_ACTIONS.FORM_COMPLETE, 'newsletter_signup');
        trackCTAClick(EVENT_ACTIONS.CTA_NEWSLETTER_SUBSCRIBE, 'footer_section');
        setSubmitted(true);
        setEmail('');
      } else {
        // Handle error - for now, still show success to provide good UX
        console.error('Newsletter signup failed:', result.message);
        trackError('newsletter_signup_failed', result.message, 'footer_section');
        setSubmitted(true);
        setEmail('');
      }
    } catch (error) {
      console.error('Newsletter signup error:', error);
      trackError('newsletter_signup_error', error instanceof Error ? error.message : 'Unknown error', 'footer_section');
      // Still show success to provide good UX
      setSubmitted(true);
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreeReview = async (e: React.FormEvent) => {
    e.preventDefault();
    trackFormInteraction(EVENT_ACTIONS.FORM_START, 'free_review');
    setIsSubmitting(true);
    
    try {
      // Add to Mailchimp as warm lead
      const result = await mailchimpService.addWarmLead(reviewEmail);
      
      if (result.success) {
        trackFormInteraction(EVENT_ACTIONS.FORM_COMPLETE, 'free_review');
        trackCTAClick(EVENT_ACTIONS.CTA_FREE_REVIEW_START, 'hero_section');
        trackFeatureUsage('agreement_checker', 'upload_started', 'free_review');
        // TODO: Upload file to storage and trigger analysis
        console.log('File uploaded for analysis:', reviewFile?.name);
        
        setSubmitted(true);
        setReviewEmail('');
        setReviewFile(null);
      } else {
        console.error('Free review failed:', result.message);
        trackError('free_review_failed', result.message, 'hero_section');
      }
    } catch (error) {
      console.error('Free review error:', error);
      trackError('free_review_error', error instanceof Error ? error.message : 'Unknown error', 'hero_section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Renters Rights Act Compliance',
      description: 'Stay compliant with the latest UK rental legislation. Our AI-powered agreement checker identifies potential issues before they become problems.',
      color: 'text-lp-blue-600'
    },
    {
      icon: Calculator,
      title: 'Smart Yield Calculations',
      description: 'Calculate accurate rental yields across your portfolio. Factor in vacancy rates, costs, and market conditions for realistic projections.',
      color: 'text-lp-orange-600'
    },
    {
      icon: TrendingUp,
      title: 'Property Valuation Estimates',
      description: 'Get instant property valuations based on current UK market data. Track your portfolio value and make informed investment decisions.',
      color: 'text-lp-blue-600'
    },
    {
      icon: Building,
      title: 'Portfolio Management',
      description: 'Manage all your properties in one place. Track tenants, lease expiries, and property performance with our intuitive dashboard.',
      color: 'text-lp-orange-600'
    },
    {
      icon: BarChart3,
      title: 'Market Analytics',
      description: 'Access real-time market data and trends. Compare your properties against local averages and optimize your rental strategy.',
      color: 'text-lp-blue-600'
    },
    {
      icon: Zap,
      title: 'Email-Powered Workflows',
      description: 'Manage your portfolio via email. Simply send documents and commands, and let our AI handle the rest.',
      color: 'text-lp-orange-600'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'Landlord, London',
      content: 'LetzPocket saved me thousands in potential compliance issues. The agreement checker caught problems I would have never noticed.',
      rating: 5
    },
    {
      name: 'James Thompson',
      role: 'Property Investor, Manchester',
      content: 'The yield calculator is incredibly accurate. I use it for every property evaluation and it\'s helped me build a profitable portfolio.',
      rating: 5
    },
    {
      name: 'Emma Roberts',
      role: 'Landlord, Bristol',
      content: 'Being able to manage everything via email is a game-changer. I can update properties and get analyses while on the go.',
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: 'Free Tenancy Agreement Review',
      price: '£0',
      description: 'Perfect for landlords who want to check their compliance',
      features: [
        'One tenancy agreement analysis',
        'Compliance report',
        'Recommendations for fixes',
        'Email delivery of results'
      ],
      highlighted: false,
      action: () => {
        trackCTAClick(EVENT_ACTIONS.CTA_FREE_REVIEW_PRICING, 'pricing_section');
        const freeReviewSection = document.getElementById('free-review-section');
        if (freeReviewSection) {
          freeReviewSection.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => setShowFreeReview(true), 500);
        }
      }
    },
    {
      name: 'Professional',
      price: '£29/month',
      description: 'For serious landlords with growing portfolios',
      features: [
        'Unlimited agreement analyses',
        'Portfolio management',
        'Yield calculations',
        'Property valuations',
        'Email workflows',
        'Priority support'
      ],
      highlighted: true,
      action: () => {
        trackCTAClick(EVENT_ACTIONS.CTA_PROFESSIONAL_PLAN, 'pricing_section');
        // TODO: Navigate to signup
      }
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large portfolios and property management companies',
      features: [
        'Everything in Professional',
        'Custom integrations',
        'API access',
        'Dedicated account manager',
        'Custom workflows',
        'Advanced analytics'
      ],
      highlighted: false,
      action: () => {
        trackCTAClick(EVENT_ACTIONS.CTA_ENTERPRISE_PLAN, 'pricing_section');
        // TODO: Contact sales
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation Section */}
      {sections.navigation && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Logo size="small" />
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => {
                  trackCTAClick(EVENT_ACTIONS.CTA_FREE_REVIEW_NAVIGATION, 'header');
                  const freeReviewSection = document.getElementById('free-review-section');
                  if (freeReviewSection) {
                    freeReviewSection.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => setShowFreeReview(true), 500);
                  }
                }}>
                  Free Tenancy Agreement Review
                </Button>
                <Button onClick={handleSignInClick} disabled={isSignInDisabled}>
                  {isSignInDisabled ? 'Sign In Disabled' : 'Sign In'}
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      {sections.hero && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className={getTextColorClass(heroText.headerColor)}>
                  {heroText.header}
                </span>
              </h1>
              <p className={`text-xl mb-8 max-w-3xl mx-auto ${getTextColorClass(heroText.subheaderColor)}`}>
                {heroText.subheader}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-lp-orange-500 text-white hover:bg-lp-orange-600"
                  onClick={() => {
                    trackCTAClick(EVENT_ACTIONS.CTA_CHATBOT_START, 'hero_section');
                    const element = document.getElementById('chatbot-section');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Bot className="mr-2 h-5 w-5" />
                  LetzHelp - ask our bot any question about your rental
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-lp-blue-600 text-white hover:bg-lp-blue-700"
                  onClick={() => {
                    trackCTAClick(EVENT_ACTIONS.CTA_FEATURES_VIEW, 'hero_section');
                    const featuresSection = document.getElementById('features-section');
                    if (featuresSection) {
                      featuresSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <ArrowRight className="ml-2 h-5 w-5" />
                  View All Features
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-lp-blue-600 mb-2">10,000+</div>
                <div className="text-gray-600">Landlords Trust LetzPocket</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-lp-orange-600 mb-2">£2.5B+</div>
                <div className="text-gray-600">Portfolio Value Managed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-lp-blue-600 mb-2">98%</div>
                <div className="text-gray-600">Compliance Issues Caught</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AI Chatbot Section */}
      {sections.chatbot && (
        <section id="chatbot-section" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-lp-blue-50 to-lp-orange-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Bot className="h-12 w-12 text-lp-blue-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">AI Lettings Assistant</h2>
              </div>
              <p className="text-lg text-gray-600">
                Get expert answers about UK lettings and the Renters Rights Act from our AI assistant
              </p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-6 w-6 text-lp-blue-600 mr-2" />
                  Chat with Our AI Expert
                </CardTitle>
                <CardDescription>
                  Ask questions about UK property lettings, tenant rights, and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-lp-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          {message.role === 'assistant' ? (
                            <Bot className="h-4 w-4 mr-2" />
                          ) : (
                            <User className="h-4 w-4 mr-2" />
                          )}
                          <span className="text-xs font-medium">
                            {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                        <div className="flex items-center">
                          <Bot className="h-4 w-4 mr-2" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleChatSubmit} className="flex space-x-2">
                  <Input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about UK lettings, Renters Rights Act, etc."
                    className="flex-1"
                    disabled={isChatLoading}
                  />
                  <Button type="submit" disabled={isChatLoading || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Features Section */}
      {sections.features && (
        <section id="features-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed as a UK Landlord
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From compliance checking to portfolio analytics, LetzPocket provides the tools 
              modern landlords need to thrive in today's rental market.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className={`h-8 w-8 ${feature.color} mb-4`} />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* Free Review Section */}
      {sections.freeReview && (
        <section id="free-review-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-lp-blue-50 to-lp-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Shield className="h-16 w-16 text-lp-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Is Your Tenancy Agreement Compliant?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get a FREE compliance review of your tenancy agreement. Our AI analyzes 
              your document against the Renters Rights Act 2024 and identifies potential issues.
            </p>
          </div>

          {!showFreeReview ? (
            <Button 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => {
                trackCTAClick(EVENT_ACTIONS.CTA_FREE_REVIEW_START, 'free_review_section');
                setShowFreeReview(true);
              }}
            >
              <FileText className="mr-2 h-5 w-5" />
              Start Free Review
            </Button>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Free Tenancy Agreement Review</CardTitle>
                <CardDescription>
                  Upload your agreement and we'll email you a detailed compliance report
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Review Request Received!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We'll analyze your agreement and send the results to your email within 24 hours.
                    </p>
                    <Button onClick={() => {
                      setShowFreeReview(false);
                      setSubmitted(false);
                    }}>
                      Done
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleFreeReview} className="space-y-4">
                    <div>
                      <Label htmlFor="review-email">Email Address</Label>
                      <Input
                        id="review-email"
                        type="email"
                        placeholder="your@email.com"
                        value={reviewEmail}
                        onChange={(e) => setReviewEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="agreement-file">Tenancy Agreement</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          {reviewFile ? reviewFile.name : 'Drop your agreement here or click to browse'}
                        </p>
                        <Input
                          id="agreement-file"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setReviewFile(e.target.files?.[0] || null)}
                          className="hidden"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('agreement-file')?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting || !reviewEmail || !reviewFile}
                    >
                      {isSubmitting ? 'Processing...' : 'Get Free Review'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
      )}

      {/* Testimonials Section */}
      {sections.testimonials && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by UK Landlords
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say about LetzPocket
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Pricing Section */}
      {sections.pricing && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that works best for your rental business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`hover:shadow-lg transition-shadow ${plan.highlighted ? 'ring-2 ring-lp-blue-600' : ''}`}
              >
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-gray-600">/month</span>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.highlighted ? 'default' : 'outline'}
                    onClick={plan.action}
                  >
                    {plan.name === 'Free Tenancy Agreement Review' ? 'Start Review' : 
                     plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Newsletter Signup Section */}
      {sections.newsletter && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-lp-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <Mail className="h-16 w-16 text-white mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Stay Updated with UK Rental Market Insights
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get the latest updates on rental regulations, market trends, and landlord tips.
          </p>

          {!submitted ? (
            <form onSubmit={handleNewsletterSignup} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={isSubmitting} className="px-8">
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-white mx-auto mb-2" />
              <p className="text-white">Thanks for subscribing! Check your email for confirmation.</p>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Footer Section */}
      {sections.footer && (
        <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-6 w-6" />
                <span className="text-lg font-bold">LetzPocket</span>
              </div>
              <p className="text-gray-400">
                Empowering UK landlords with smart property management tools.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Free Review</li>
                <li>API Access</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Renters Rights Act Guide</li>
                <li>Landlord Blog</li>
                <li>Market Reports</li>
                <li>Help Center</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LetzPocket. All rights reserved.</p>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
};

export default LandingPage;
