// Mailchimp Integration Service
// This service handles newsletter subscriptions and lead capture

interface MailchimpListMember {
  email_address: string;
  status: 'subscribed' | 'pending' | 'unsubscribed';
  merge_fields?: {
    FNAME?: string;
    LNAME?: string;
    PHONE?: string;
    COMPANY?: string;
    PROPERTIES?: string;
    SIGNUP_SOURCE?: string;
  };
  tags?: string[];
}

interface MailchimpResponse {
  success: boolean;
  message: string;
  data?: any;
}

class MailchimpService {
  private apiKey: string;
  private serverPrefix: string;
  private listId: string;

  constructor() {
    // These should be environment variables in production
    this.apiKey = process.env.REACT_APP_MAILCHIMP_API_KEY || '';
    this.serverPrefix = process.env.REACT_APP_MAILCHIMP_SERVER_PREFIX || '';
    this.listId = process.env.REACT_APP_MAILCHIMP_LIST_ID || '';
  }

  /**
   * Add a new subscriber to the main newsletter list
   */
  async addSubscriber(email: string, firstName?: string, lastName?: string, source?: string): Promise<MailchimpResponse> {
    try {
      if (!this.apiKey || !this.serverPrefix || !this.listId) {
        // For development, return success without actual API call
        console.log('Mailchimp: Adding subscriber (development mode)', { email, firstName, lastName, source });
        return {
          success: true,
          message: 'Successfully subscribed to newsletter!'
        };
      }

      const member: MailchimpListMember = {
        email_address: email,
        status: 'pending', // Requires email confirmation
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
          SIGNUP_SOURCE: source || 'landing_page'
        },
        tags: ['Landing Page']
      };

      const response = await fetch(
        `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists/${this.listId}/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': `apikey ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(member)
        }
      );

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Please check your email to confirm your subscription!',
          data
        };
      } else {
        // Handle specific Mailchimp errors
        if (data.title === 'Member Exists') {
          return {
            success: true,
            message: 'You\'re already subscribed! Check your email for the latest updates.'
          };
        }

        return {
          success: false,
          message: data.detail || 'Failed to subscribe. Please try again.'
        };
      }
    } catch (error) {
      console.error('Mailchimp subscription error:', error);
      return {
        success: false,
        message: 'Failed to subscribe. Please try again later.'
      };
    }
  }

  /**
   * Add a warm lead from free agreement review
   */
  async addWarmLead(
    email: string, 
    firstName?: string, 
    lastName?: string,
    phone?: string,
    company?: string,
    propertyCount?: string
  ): Promise<MailchimpResponse> {
    try {
      if (!this.apiKey || !this.serverPrefix || !this.listId) {
        // For development, return success without actual API call
        console.log('Mailchimp: Adding warm lead (development mode)', { 
          email, firstName, lastName, phone, company, propertyCount 
        });
        return {
          success: true,
          message: 'Free review request received! We\'ll analyze your agreement and email results within 24 hours.'
        };
      }

      const member: MailchimpListMember = {
        email_address: email,
        status: 'subscribed', // Auto-subscribe since they're actively requesting a service
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
          PHONE: phone,
          COMPANY: company,
          PROPERTIES: propertyCount
        },
        tags: ['Free Review', 'Warm Lead', 'High Priority']
      };

      const response = await fetch(
        `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists/${this.listId}/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': `apikey ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(member)
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Add additional tags for segmentation
        await this.addTagsToMember(email, ['Free Review Requested', 'Agreement Analysis']);
        
        return {
          success: true,
          message: 'Free review request received! We\'ll analyze your agreement and email results within 24 hours.',
          data
        };
      } else {
        if (data.title === 'Member Exists') {
          // Update existing member with new tags
          await this.addTagsToMember(email, ['Free Review Requested', 'Returning Lead']);
          return {
            success: true,
            message: 'Welcome back! We\'ll analyze your agreement and email results within 24 hours.'
          };
        }

        return {
          success: false,
          message: data.detail || 'Failed to process your request. Please try again.'
        };
      }
    } catch (error) {
      console.error('Mailchimp warm lead error:', error);
      return {
        success: false,
        message: 'Failed to process your request. Please try again later.'
      };
    }
  }

  /**
   * Add a new user who signed up for the platform
   */
  async addUser(
    email: string, 
    firstName: string, 
    lastName: string,
    phone?: string,
    company?: string,
    plan?: string
  ): Promise<MailchimpResponse> {
    try {
      if (!this.apiKey || !this.serverPrefix || !this.listId) {
        console.log('Mailchimp: Adding user (development mode)', { 
          email, firstName, lastName, phone, company, plan 
        });
        return {
          success: true,
          message: 'Welcome to LetzPocket!'
        };
      }

      const member: MailchimpListMember = {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
          PHONE: phone,
          COMPANY: company
        },
        tags: ['User', plan || 'Free Trial']
      };

      const response = await fetch(
        `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists/${this.listId}/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': `apikey ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(member)
        }
      );

      const data = await response.json();

      if (response.ok) {
        await this.addTagsToMember(email, ['Platform User', plan || 'Free Trial']);
        
        return {
          success: true,
          message: 'Welcome to LetzPocket!',
          data
        };
      } else {
        if (data.title === 'Member Exists') {
          await this.addTagsToMember(email, ['Platform User', 'Returning User']);
          return {
            success: true,
            message: 'Welcome back to LetzPocket!'
          };
        }

        return {
          success: false,
          message: data.detail || 'Failed to create account. Please try again.'
        };
      }
    } catch (error) {
      console.error('Mailchimp user addition error:', error);
      return {
        success: false,
        message: 'Failed to create account. Please try again later.'
      };
    }
  }

  /**
   * Add tags to an existing member
   */
  private async addTagsToMember(email: string, tags: string[]): Promise<void> {
    try {
      if (!this.apiKey || !this.serverPrefix || !this.listId) {
        return;
      }

      // Get subscriber hash (MD5 of lowercase email)
      const subscriberHash = require('crypto')
        .createHash('md5')
        .update(email.toLowerCase())
        .digest('hex');

      const response = await fetch(
        `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists/${this.listId}/members/${subscriberHash}/tags`,
        {
          method: 'POST',
          headers: {
            'Authorization': `apikey ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tags: tags.map(tag => ({ name: tag, status: 'active' }))
          })
        }
      );

      if (!response.ok) {
        console.error('Failed to add tags to member:', await response.text());
      }
    } catch (error) {
      console.error('Error adding tags to member:', error);
    }
  }

  /**
   * Update member information
   */
  async updateMember(
    email: string, 
    updates: Partial<MailchimpListMember>
  ): Promise<MailchimpResponse> {
    try {
      if (!this.apiKey || !this.serverPrefix || !this.listId) {
        return {
          success: true,
          message: 'Profile updated successfully!'
        };
      }

      const subscriberHash = require('crypto')
        .createHash('md5')
        .update(email.toLowerCase())
        .digest('hex');

      const response = await fetch(
        `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists/${this.listId}/members/${subscriberHash}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `apikey ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        }
      );

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Profile updated successfully!',
          data
        };
      } else {
        return {
          success: false,
          message: data.detail || 'Failed to update profile. Please try again.'
        };
      }
    } catch (error) {
      console.error('Mailchimp update error:', error);
      return {
        success: false,
        message: 'Failed to update profile. Please try again later.'
      };
    }
  }

  /**
   * Create a campaign for follow-up emails
   */
  async createCampaign(
    subject: string,
    content: string,
    segmentId?: string
  ): Promise<MailchimpResponse> {
    try {
      if (!this.apiKey || !this.serverPrefix || !this.listId) {
        return {
          success: true,
          message: 'Campaign created successfully!'
        };
      }

      const campaignData = {
        type: 'regular',
        recipients: {
          list_id: this.listId,
          segment_opts: segmentId ? { id: segmentId } : undefined
        },
        settings: {
          subject_line: subject,
          from_name: 'LetzPocket',
          reply_to: 'hello@letz-pocket.app',
          template_id: null // You would create a template in Mailchimp
        }
      };

      const response = await fetch(
        `https://${this.serverPrefix}.api.mailchimp.com/3.0/campaigns`,
        {
          method: 'POST',
          headers: {
            'Authorization': `apikey ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(campaignData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Campaign created successfully!',
          data
        };
      } else {
        return {
          success: false,
          message: data.detail || 'Failed to create campaign.'
        };
      }
    } catch (error) {
      console.error('Mailchimp campaign creation error:', error);
      return {
        success: false,
        message: 'Failed to create campaign. Please try again later.'
      };
    }
  }
}

// Export singleton instance
export const mailchimpService = new MailchimpService();

// Export types for use in components
export type { MailchimpResponse, MailchimpListMember };
